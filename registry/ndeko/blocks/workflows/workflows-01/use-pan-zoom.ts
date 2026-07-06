'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

type Point = {
  x: number;
  y: number;
};

type Box = Point & {
  width: number;
  height: number;
};

type Viewport = Point & {
  zoom: number;
};

type Span = {
  centre: Point;
  distance: number;
};

export const MIN_ZOOM = 0.4;

export const MAX_ZOOM = 1.6;

/** Fit never enlarges past full size: a small flow stays readable instead of filling the frame. */
const FIT_MAX_ZOOM = 1;

/** Nor does it shrink a flow until its text cannot be read: what does not fit is reached by panning. */
const FIT_MIN_ZOOM = 0.75;

const FIT_MARGIN = 20;

const REVEAL_MARGIN = 16;

const EASED = 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)';

/** A wheel that reports lines, as some mice do, moves this many pixels a line. */
const LINE_PIXELS = 16;

const WHEEL_DOM_DELTA_LINE = 1;

const WHEEL_ZOOM_RATE = 0.01;

/** One wheel event never zooms by more than about a quarter. */
const WHEEL_ZOOM_LIMIT = 24;

const NO_BOX: Box = { x: 0, y: 0, width: 1, height: 1 };

function clamp(value: number, min: number, max: number) {
  const atLeast = Math.max(value, min);
  return Math.min(atLeast, max);
}

function transitionOf(isEased: boolean) {
  if (isEased) {
    return EASED;
  }
  return 'none';
}

/** How far a span has to move to sit between two edges. Its start wins when it is too long to fit. */
function shiftOf(start: number, end: number, min: number, max: number) {
  if (start < min) {
    return min - start;
  }
  if (end > max) {
    const back = max - end;
    const untilStart = min - start;
    return Math.max(back, untilStart);
  }
  return 0;
}

/**
 * Where the content starts along one axis of the frame: centred when it fits, at the margin when it
 * does not, so the start of the flow is what shows.
 */
function startOf(
  frameSize: number,
  contentStart: number,
  contentSize: number,
  zoom: number
) {
  const scaled = contentSize * zoom;
  const room = frameSize - FIT_MARGIN * 2;
  if (scaled <= room) {
    return (frameSize - scaled) / 2 - contentStart * zoom;
  }
  return FIT_MARGIN - contentStart * zoom;
}

function spanOf(pointers: Map<number, Point>): Span | null {
  const [first, second] = Array.from(pointers.values());
  if (!first || !second) {
    return null;
  }
  const centre = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  return { centre, distance };
}

function wheelUnitOf(event: WheelEvent) {
  if (event.deltaMode === WHEEL_DOM_DELTA_LINE) {
    return LINE_PIXELS;
  }
  return 1;
}

/** Ctrl or Cmd with the wheel, which is also how a trackpad reports a pinch. */
function isZoomWheel(event: WheelEvent) {
  return event.ctrlKey || event.metaKey;
}

/**
 * Pan and zoom of a canvas as one transform on one plane element. The transform is written to the
 * element, never through React state: a drag or a pinch changes it on every frame.
 */
export function createCanvasView() {
  let frame: HTMLElement | null = null;
  let plane: HTMLElement | null = null;
  let viewport: Viewport = { x: 0, y: 0, zoom: 1 };
  let content = NO_BOX;
  let coveredShare = 0;
  let pinned: Box | null = null;
  /** True once a person has moved the view: it is no longer refitted when the frame changes size. */
  let isManual = false;
  let hasFitted = false;
  const listeners = new Set<() => void>();
  const pointers = new Map<number, Point>();

  function sizeOf() {
    if (!frame) {
      return null;
    }
    return { width: frame.clientWidth, height: frame.clientHeight };
  }

  function apply(next: Viewport, isEased: boolean) {
    const x = Math.round(next.x);
    const y = Math.round(next.y);
    viewport = { x, y, zoom: next.zoom };
    if (plane) {
      plane.style.transition = transitionOf(isEased);
      plane.style.transform = `translate(${x}px, ${y}px) scale(${next.zoom})`;
    }
    listeners.forEach((listener) => listener());
  }

  function localOf(client: Point): Point {
    const rect = frame?.getBoundingClientRect();
    if (!rect) {
      return client;
    }
    return { x: client.x - rect.left, y: client.y - rect.top };
  }

  function centreOf(): Point {
    const size = sizeOf();
    if (!size) {
      return { x: 0, y: 0 };
    }
    return { x: size.width / 2, y: size.height / 2 };
  }

  /** The point under `anchor` stays under it while the zoom changes. */
  function zoomedAround(factor: number, anchor: Point): Viewport {
    const zoom = clamp(viewport.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const ratio = zoom / viewport.zoom;
    const x = anchor.x - (anchor.x - viewport.x) * ratio;
    const y = anchor.y - (anchor.y - viewport.y) * ratio;
    return { x, y, zoom };
  }

  function fitted(): Viewport | null {
    const size = sizeOf();
    if (!size) {
      return null;
    }
    const roomX = size.width - FIT_MARGIN * 2;
    const roomY = size.height - FIT_MARGIN * 2;
    const scale = Math.min(roomX / content.width, roomY / content.height);
    const zoom = clamp(scale, FIT_MIN_ZOOM, FIT_MAX_ZOOM);
    const x = startOf(size.width, content.x, content.width, zoom);
    const y = startOf(size.height, content.y, content.height, zoom);
    return { x, y, zoom };
  }

  function revealed(box: Box): Viewport | null {
    const size = sizeOf();
    if (!size) {
      return null;
    }
    const left = box.x * viewport.zoom + viewport.x;
    const top = box.y * viewport.zoom + viewport.y;
    const right = left + box.width * viewport.zoom;
    const bottom = top + box.height * viewport.zoom;
    const visibleHeight = size.height * (1 - coveredShare);
    const maxX = size.width - REVEAL_MARGIN;
    const maxY = visibleHeight - REVEAL_MARGIN;
    const dx = shiftOf(left, right, REVEAL_MARGIN, maxX);
    const dy = shiftOf(top, bottom, REVEAL_MARGIN, maxY);
    if (dx === 0 && dy === 0) {
      return null;
    }
    return { ...viewport, x: viewport.x + dx, y: viewport.y + dy };
  }

  function refit(isEased: boolean) {
    const next = fitted();
    if (next) {
      hasFitted = true;
      apply(next, isEased);
    }
  }

  /**
   * Focus on a step outside the frame makes the browser scroll the frame to it. The scroll is taken
   * back and given to the transform, so the plane stays the only thing that moves.
   */
  function absorbScroll() {
    if (!frame) {
      return;
    }
    const left = frame.scrollLeft;
    const top = frame.scrollTop;
    if (left === 0 && top === 0) {
      return;
    }
    frame.scrollLeft = 0;
    frame.scrollTop = 0;
    apply({ ...viewport, x: viewport.x - left, y: viewport.y - top }, false);
  }

  function reveal(box: Box) {
    absorbScroll();
    if (!hasFitted) {
      return;
    }
    const next = revealed(box);
    if (next) {
      apply(next, true);
    }
  }

  function panBy(dx: number, dy: number) {
    isManual = true;
    apply({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }, false);
  }

  function pinch(before: Span, after: Span) {
    if (before.distance === 0) {
      return;
    }
    const factor = after.distance / before.distance;
    const zoomed = zoomedAround(factor, localOf(before.centre));
    const x = zoomed.x + after.centre.x - before.centre.x;
    const y = zoomed.y + after.centre.y - before.centre.y;
    isManual = true;
    apply({ x, y, zoom: zoomed.zoom }, false);
  }

  return {
    /** The frame that clips the canvas and the plane that moves inside it. */
    attach(nextFrame: HTMLElement | null, nextPlane: HTMLElement | null) {
      frame = nextFrame;
      plane = nextPlane;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    percent() {
      return Math.round(viewport.zoom * 100);
    },
    zoom() {
      return viewport.zoom;
    },
    origin(): Point {
      return { x: viewport.x, y: viewport.y };
    },
    /** A point of the screen as a point of the plane. */
    toPlane(client: Point): Point {
      const local = localOf(client);
      const x = (local.x - viewport.x) / viewport.zoom;
      const y = (local.y - viewport.y) / viewport.zoom;
      return { x, y };
    },
    panBy,
    zoomStep(factor: number) {
      isManual = true;
      apply(zoomedAround(factor, centreOf()), true);
    },
    zoomTo(zoom: number) {
      isManual = true;
      apply(zoomedAround(zoom / viewport.zoom, centreOf()), true);
    },
    /** Shows everything again and hands the view back to the canvas, which refits it on its own. */
    fit() {
      isManual = false;
      refit(true);
    },
    /** What Fit shows, and the share of the frame a sheet covers from the bottom, from 0 to 1. */
    setScene(bounds: Box, covered: number) {
      content = bounds;
      coveredShare = covered;
    },
    /** Called when the frame, the layout or the sheet changed: refits a view nobody moved. */
    settle() {
      const isFirst = !hasFitted;
      if (isFirst || !isManual) {
        refit(!isFirst);
      }
      if (!pinned) {
        return;
      }
      const next = revealed(pinned);
      if (next) {
        apply(next, !isFirst);
      }
    },
    reveal,
    /** The box to keep in view, now and whenever the frame changes size. */
    pin(box: Box | null) {
      pinned = box;
      if (box) {
        reveal(box);
      }
    },
    absorbScroll,
    grab(pointerId: number, at: Point) {
      pointers.set(pointerId, at);
    },
    /** One pointer pans. Two pointers pinch: the zoom follows their distance, the pan their middle. */
    drag(pointerId: number, now: Point) {
      const last = pointers.get(pointerId);
      if (!last) {
        return;
      }
      const before = spanOf(pointers);
      pointers.set(pointerId, now);
      const after = spanOf(pointers);
      if (before && after) {
        pinch(before, after);
        return;
      }
      panBy(now.x - last.x, now.y - last.y);
    },
    release(pointerId: number) {
      pointers.delete(pointerId);
    },
    isHeld() {
      return pointers.size > 0;
    },
    /** A plain wheel pans. A zoom wheel zooms around the pointer. */
    takeWheel(event: WheelEvent) {
      const unit = wheelUnitOf(event);
      if (!isZoomWheel(event)) {
        panBy(-event.deltaX * unit, -event.deltaY * unit);
        return;
      }
      const raw = event.deltaY * unit;
      const delta = clamp(raw, -WHEEL_ZOOM_LIMIT, WHEEL_ZOOM_LIMIT);
      const factor = Math.exp(-delta * WHEEL_ZOOM_RATE);
      const anchor = localOf({ x: event.clientX, y: event.clientY });
      isManual = true;
      apply(zoomedAround(factor, anchor), false);
    },
  };
}

export type CanvasView = ReturnType<typeof createCanvasView>;

/**
 * The frame and the plane of a canvas, with its view. Call it in the component that renders them,
 * before any effect that uses the view. A plain wheel pans only while the focus is inside the
 * parent of the frame, so a page scrolled past the canvas keeps scrolling. A pinch always zooms the
 * canvas under it, never the page.
 */
export function usePanZoom() {
  const frameRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const [view] = useState(createCanvasView);
  const [isMeasured, setIsMeasured] = useState(false);

  useLayoutEffect(() => {
    view.attach(frameRef.current, planeRef.current);
    return () => view.attach(null, null);
  }, [view]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const scope = frame.parentElement ?? frame;
    let hasMeasured = false;

    /** The first fit is left to the canvas, which knows by then what it shows. */
    function measure() {
      setIsMeasured(true);
      if (hasMeasured) {
        view.settle();
      }
      hasMeasured = true;
    }

    function takeWheel(event: WheelEvent) {
      const isEngaged = scope.matches(':focus-within');
      const isZoom = isZoomWheel(event);
      if (!isEngaged && !isZoom) {
        return;
      }
      event.preventDefault();
      view.takeWheel(event);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    frame.addEventListener('wheel', takeWheel, { passive: false });
    frame.addEventListener('scroll', view.absorbScroll);
    return () => {
      observer.disconnect();
      frame.removeEventListener('wheel', takeWheel);
      frame.removeEventListener('scroll', view.absorbScroll);
    };
  }, [view]);

  return { frameRef, planeRef, view, isMeasured };
}

function fullSize() {
  return 100;
}

/** The zoom as a whole percentage. Only the text that shows it renders again when it changes. */
export function useZoomPercent(view: CanvasView) {
  return useSyncExternalStore(view.subscribe, view.percent, fullSize);
}
