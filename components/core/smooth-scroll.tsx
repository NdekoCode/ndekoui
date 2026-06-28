'use client';
import { useReducedMotion } from 'motion/react';
import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_LERP = 0.12;
const MIN_LERP = 0.01;
const LINE_HEIGHT = 100 / 3;
const REFERENCE_FRAME_MS = 1000 / 60;
const SETTLED_DISTANCE = 0.5;
const OWN_WRITE_TOLERANCE = 1.5;
const IGNORE_ATTRIBUTE = 'data-smooth-scroll-ignore';

type Scroller = {
  eventTarget: HTMLElement | Window;
  boundary: HTMLElement;
  read: () => number;
  max: () => number;
  pageHeight: () => number;
  isLocked: () => boolean;
  write: (top: number) => void;
};

function hidesOverflow(element: Element) {
  const overflowY = getComputedStyle(element).overflowY;
  const isHidden = overflowY === 'hidden';
  const isClipped = overflowY === 'clip';
  return isHidden || isClipped;
}

function windowScroller(): Scroller {
  const root = document.documentElement;

  return {
    eventTarget: window,
    boundary: root,
    read: () => window.scrollY,
    max: () => root.scrollHeight - root.clientHeight,
    pageHeight: () => root.clientHeight,
    isLocked: () => {
      const isRootLocked = hidesOverflow(root);
      const isBodyLocked = hidesOverflow(document.body);
      return isRootLocked || isBodyLocked;
    },
    write: (top) => window.scrollTo({ top, behavior: 'instant' }),
  };
}

function elementScroller(element: HTMLElement): Scroller {
  return {
    eventTarget: element,
    boundary: element,
    read: () => element.scrollTop,
    max: () => element.scrollHeight - element.clientHeight,
    pageHeight: () => element.clientHeight,
    isLocked: () => hidesOverflow(element),
    write: (top) => element.scrollTo({ top, behavior: 'instant' }),
  };
}

function scrollerOf(container?: RefObject<HTMLElement | null>) {
  if (!container) {
    return windowScroller();
  }
  const element = container.current;
  if (!element) {
    return null;
  }
  return elementScroller(element);
}

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(min, value);
  return Math.min(max, atLeastMin);
}

function pixelDeltaOf(event: WheelEvent, scroller: Scroller) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * LINE_HEIGHT;
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * scroller.pageHeight();
  }
  return event.deltaY;
}

function ownsWheel(element: Element, delta: number) {
  if (element.hasAttribute(IGNORE_ATTRIBUTE)) {
    return true;
  }
  const style = getComputedStyle(element);
  const isAuto = style.overflowY === 'auto';
  const isScroll = style.overflowY === 'scroll';
  const room = element.scrollHeight - element.clientHeight;
  const isScrollable = isAuto || isScroll;
  if (!isScrollable || room <= 0) {
    return false;
  }
  if (delta < 0) {
    return element.scrollTop > 0;
  }
  const lastPosition = room - 1;
  return element.scrollTop < lastPosition;
}

function isInsideOwnScroller(
  start: EventTarget | null,
  boundary: HTMLElement,
  delta: number
) {
  let node: Element | null = null;
  if (start instanceof Element) {
    node = start;
  }
  while (node && node !== boundary) {
    if (ownsWheel(node, delta)) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function isGestureForBrowser(event: WheelEvent) {
  const sidewaysAmount = Math.abs(event.deltaX);
  const downwardAmount = Math.abs(event.deltaY);
  const isHorizontal = sidewaysAmount > downwardAmount;
  const isPinchZoom = event.ctrlKey;
  const isSideways = event.shiftKey;
  const isEmpty = event.deltaY === 0;
  const isHandled = event.defaultPrevented;
  return isHorizontal || isPinchZoom || isSideways || isEmpty || isHandled;
}

function attachSmoothScroll(scroller: Scroller, lerp: number) {
  const easing = clamp(lerp, MIN_LERP, 1);
  const keptPerFrame = 1 - easing;
  let current = scroller.read();
  let target = current;
  let lastWritten = current;
  let lastTime = 0;
  let frameId = 0;

  const stop = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const step = (time: number) => {
    let elapsed = REFERENCE_FRAME_MS;
    if (lastTime > 0) {
      elapsed = time - lastTime;
    }
    lastTime = time;

    const frames = elapsed / REFERENCE_FRAME_MS;
    const kept = Math.pow(keptPerFrame, frames);
    const factor = 1 - kept;
    const max = scroller.max();
    target = clamp(target, 0, max);
    const gap = target - current;
    current += gap * factor;

    const remainingGap = target - current;
    const remaining = Math.abs(remainingGap);
    const isSettled = remaining < SETTLED_DISTANCE;
    if (isSettled) {
      current = target;
    }
    lastWritten = current;
    scroller.write(current);

    if (isSettled) {
      frameId = 0;
      return;
    }
    frameId = requestAnimationFrame(step);
  };

  const onWheel = (event: WheelEvent) => {
    if (isGestureForBrowser(event)) {
      return;
    }
    if (scroller.isLocked()) {
      return;
    }
    const delta = pixelDeltaOf(event, scroller);
    if (isInsideOwnScroller(event.target, scroller.boundary, delta)) {
      return;
    }

    const isAnimating = frameId !== 0;
    if (!isAnimating) {
      current = scroller.read();
      target = current;
    }

    // At an edge with nothing left to finish, the wheel goes back to the browser: it chains to
    // the page around a scrolling area, and keeps the overscroll bounce of the page.
    const max = scroller.max();
    const pushesPastTop = delta < 0 && target <= 0;
    const pushesPastBottom = delta > 0 && target >= max;
    const pushesPastEdge = pushesPastTop || pushesPastBottom;
    if (pushesPastEdge && !isAnimating) {
      return;
    }

    event.preventDefault();
    const nextTarget = target + delta;
    target = clamp(nextTarget, 0, max);
    if (!isAnimating) {
      lastTime = 0;
      frameId = requestAnimationFrame(step);
    }
  };

  // Keyboard, scrollbar, anchors, focus and find in page scroll natively: when the position
  // moves without us, the smoothing stops and starts again from there.
  const onScroll = () => {
    const position = scroller.read();
    const offset = position - lastWritten;
    const drift = Math.abs(offset);
    if (drift <= OWN_WRITE_TOLERANCE) {
      return;
    }
    stop();
    current = position;
    target = position;
    lastWritten = position;
  };

  const onWheelEvent = (event: Event) => {
    if (event instanceof WheelEvent) {
      onWheel(event);
    }
  };

  // The wheel listener cannot be passive: taking over the wheel means cancelling its default.
  scroller.eventTarget.addEventListener('wheel', onWheelEvent, {
    passive: false,
  });
  scroller.eventTarget.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    stop();
    scroller.eventTarget.removeEventListener('wheel', onWheelEvent);
    scroller.eventTarget.removeEventListener('scroll', onScroll);
  };
}

export type UseSmoothScrollOptions = {
  container?: RefObject<HTMLElement | null>;
  lerp?: number;
  enabled?: boolean;
};

export function useSmoothScroll({
  container,
  lerp = DEFAULT_LERP,
  enabled = true,
}: UseSmoothScrollOptions = {}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (prefersReducedMotion) {
      return;
    }
    const scroller = scrollerOf(container);
    if (!scroller) {
      return;
    }
    return attachSmoothScroll(scroller, lerp);
  }, [container, lerp, enabled, prefersReducedMotion]);
}

function areaClassOf(root: boolean) {
  if (root) {
    return '';
  }
  return 'relative overflow-y-auto';
}

export type SmoothScrollProps = {
  children: ReactNode;
  root?: boolean;
  lerp?: number;
  enabled?: boolean;
  className?: string;
};

export function SmoothScroll({
  children,
  root = false,
  lerp,
  enabled = true,
  className,
}: SmoothScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const smoothsWindow = root && enabled;
  const smoothsArea = !root && enabled;
  useSmoothScroll({ lerp, enabled: smoothsWindow });
  useSmoothScroll({ container: containerRef, lerp, enabled: smoothsArea });

  return (
    <div ref={containerRef} className={cn(areaClassOf(root), className)}>
      {children}
    </div>
  );
}
