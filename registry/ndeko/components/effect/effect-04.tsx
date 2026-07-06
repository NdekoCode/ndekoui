'use client';

import { useInView } from 'motion/react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import { hundredthsOf } from './_parts/rounded';
import { useHover } from './_parts/use-hover';

/** The outline of a pill: two straight edges joined by two half circles. */
type Stadium = {
  width: number;
  height: number;
  radius: number;
  straight: number;
  perimeter: number;
};

type PillPoint = {
  x: number;
  y: number;
};

/** The light runs once the pointer comes this close to the pill, and again only after it went this far away. */
const REACH_PX = 120;

const REARM_PX = 160;

/** The keyframes of a lap stand this far apart along the outline, so the light rounds the ends of the pill. */
const KEYFRAME_STEP_PX = 6;

const LAP_EASING = 'cubic-bezier(0.45, 0, 0.2, 1)';

const SHORTEST_LAP_MS = 900;

const LONGEST_LAP_MS = 1400;

const LAP_MS_PER_PX = 1.9;

/** The light comes up over the first part of the lap and fades over the last, so it never starts or stops as a hard spot. */
const FADE_IN_SHARE = 0.08;

const FADE_OUT_SHARE = 0.2;

function stadiumOf(width: number, height: number): Stadium {
  const shortSide = Math.min(width, height);
  const radius = shortSide / 2;
  const straight = Math.max(0, width - shortSide);
  const ends = 2 * Math.PI * radius;
  return { width, height, radius, straight, perimeter: 2 * straight + ends };
}

function wrappedDistanceOf(distance: number, perimeter: number) {
  const remainder = distance % perimeter;
  return (remainder + perimeter) % perimeter;
}

function pointOnCap(centreX: number, radius: number, angle: number) {
  const x = centreX + Math.cos(angle) * radius;
  const y = radius + Math.sin(angle) * radius;
  return { x, y };
}

/** The point of the outline this far along it, from the left end of the top edge, going clockwise. */
function pointAlong(stadium: Stadium, distance: number): PillPoint {
  const { width, height, radius, straight, perimeter } = stadium;
  const capLength = Math.PI * radius;
  let left = wrappedDistanceOf(distance, perimeter);
  if (left <= straight) {
    return { x: radius + left, y: 0 };
  }
  left -= straight;
  if (left <= capLength) {
    const angle = left / radius - Math.PI / 2;
    return pointOnCap(width - radius, radius, angle);
  }
  left -= capLength;
  if (left <= straight) {
    return { x: width - radius - left, y: height };
  }
  left -= straight;
  const angle = left / radius + Math.PI / 2;
  return pointOnCap(radius, radius, angle);
}

/** How far along the outline, from the left end of the top edge, lies the point nearest to `from`. */
function distanceNearest(stadium: Stadium, from: PillPoint) {
  const { width, radius, straight } = stadium;
  const capLength = Math.PI * radius;
  const isPastLeftEnd = from.x < radius;
  const isPastRightEnd = from.x > width - radius;
  const isAlongStraight = !isPastLeftEnd && !isPastRightEnd;
  if (isAlongStraight) {
    const isAbove = from.y < radius;
    if (isAbove) {
      return from.x - radius;
    }
    const fromRightEnd = width - radius - from.x;
    return straight + capLength + fromRightEnd;
  }
  if (isPastRightEnd) {
    const angle = Math.atan2(from.y - radius, from.x - (width - radius));
    return straight + (angle + Math.PI / 2) * radius;
  }
  const rawAngle = Math.atan2(from.y - radius, from.x - radius);
  let angle = rawAngle;
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  return 2 * straight + capLength + (angle - Math.PI / 2) * radius;
}

function fadeAt(share: number) {
  if (share < FADE_IN_SHARE) {
    return share / FADE_IN_SHARE;
  }
  const fadeOutFrom = 1 - FADE_OUT_SHARE;
  if (share > fadeOutFrom) {
    const left = 1 - share;
    return left / FADE_OUT_SHARE;
  }
  return 1;
}

/** One lap of the outline as keyframes spaced by length, so the light keeps one speed on the straight edges and round the ends. */
function lapKeyframesOf(stadium: Stadium, start: number) {
  const stepCount = Math.ceil(stadium.perimeter / KEYFRAME_STEP_PX);
  const steps = Math.max(24, stepCount);
  const keyframes: Keyframe[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const share = index / steps;
    const distance = start + stadium.perimeter * share;
    const point = pointAlong(stadium, distance);
    const x = hundredthsOf(point.x);
    const y = hundredthsOf(point.y);
    const opacity = hundredthsOf(fadeAt(share));
    keyframes.push({
      offset: share,
      transform: `translate(${x}px, ${y}px)`,
      opacity,
    });
  }
  return keyframes;
}

function lapDurationOf(stadium: Stadium) {
  const byLength = stadium.perimeter * LAP_MS_PER_PX;
  const atLeast = Math.max(SHORTEST_LAP_MS, byLength);
  return Math.min(LONGEST_LAP_MS, atLeast);
}

/**
 * A conic sweep would crawl along the long edges of a pill and leap round its ends; the light is a
 * small soft spot moved along the outline by a Web Animation on its transform, and a mask keeps only
 * the ring of the pill, so it shows as the edge lighting up.
 */
function runLap(pill: HTMLElement, light: HTMLElement, from: PillPoint) {
  const stadium = stadiumOf(pill.offsetWidth, pill.offsetHeight);
  const start = distanceNearest(stadium, from);
  const keyframes = lapKeyframesOf(stadium, start);
  const duration = lapDurationOf(stadium);
  return light.animate(keyframes, { duration, easing: LAP_EASING });
}

function gapToBox(box: DOMRect, x: number, y: number) {
  const across = Math.max(box.left - x, 0, x - box.right);
  const down = Math.max(box.top - y, 0, y - box.bottom);
  return Math.hypot(across, down);
}

export type AnnouncementPillHandle = {
  /** Runs the light once round the pill from the side nearest a point given in shares of the pill, for a demonstration. */
  reach: (across: number, down: number) => void;
};

export type AnnouncementPillProps = {
  href: string;
  /** The news, in a few words. */
  text: string;
  /** What pressing the pill does, said by the tag at its end: "Read the post". */
  action: string;
  /** Shows the arrow nudged as it is under the pointer, for a demonstration. */
  isNudged?: boolean;
  /** Runs the light from outside, for a demonstration. */
  handleRef?: React.Ref<AnnouncementPillHandle>;
  className?: string;
};

/**
 * The pill above a headline. When the pointer comes within 120px, or the keyboard reaches it, a
 * light runs once round its edge from the side the pointer came from, then rests. It listens only
 * while it is on screen and the tab is shown, and never under reduced motion.
 */
export function AnnouncementPill({
  href,
  text,
  action,
  isNudged = false,
  handleRef,
  className,
}: AnnouncementPillProps) {
  const pillRef = useRef<HTMLAnchorElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  const lap = useRef<Animation | null>(null);
  const isInView = useInView(pillRef);
  const isTabVisible = useDocumentVisible();
  const isStill = usePrefersReducedMotion();
  const isOnScreen = isInView && isTabVisible;
  const isListening = isOnScreen && !isStill;

  useEffect(() => {
    const pill = pillRef.current;
    const light = lightRef.current;
    const hasParts = pill !== null && light !== null;
    if (!hasParts || !isListening) {
      return;
    }
    let isArmed = true;

    const watchReach = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }
      const box = pill.getBoundingClientRect();
      const gap = gapToBox(box, event.clientX, event.clientY);
      if (gap > REARM_PX) {
        isArmed = true;
        return;
      }
      const isWithinReach = gap <= REACH_PX;
      if (!isWithinReach || !isArmed) {
        return;
      }
      isArmed = false;
      const from = { x: event.clientX - box.left, y: event.clientY - box.top };
      lap.current?.cancel();
      lap.current = runLap(pill, light, from);
    };

    document.addEventListener('pointermove', watchReach, { passive: true });
    return () => {
      document.removeEventListener('pointermove', watchReach);
      lap.current?.cancel();
      lap.current = null;
    };
  }, [isListening]);

  function lapFrom(from: PillPoint) {
    const pill = pillRef.current;
    const light = lightRef.current;
    const hasParts = pill !== null && light !== null;
    if (!hasParts || !isListening) {
      return;
    }
    lap.current?.cancel();
    lap.current = runLap(pill, light, from);
  }

  function lapOnKeyboardFocus(event: React.FocusEvent<HTMLAnchorElement>) {
    if (!event.target.matches(':focus-visible')) {
      return;
    }
    const height = event.currentTarget.offsetHeight;
    lapFrom({ x: 0, y: height / 2 });
  }

  useImperativeHandle(handleRef, () => ({
    reach(across: number, down: number) {
      const pill = pillRef.current;
      if (!pill) {
        return;
      }
      const x = across * pill.offsetWidth;
      const y = down * pill.offsetHeight;
      lapFrom({ x, y });
    },
  }));

  return (
    <a
      ref={pillRef}
      href={href}
      data-nudged={isNudged}
      onFocus={lapOnKeyboardFocus}
      className={cn(
        'group/pill bg-card hairline-ring ring-border hover:bg-foreground/[0.02] focus-visible:ring-ring/25 dark:bg-foreground/[0.04] dark:hover:bg-foreground/[0.06] relative inline-flex h-8 max-w-full items-center gap-2 rounded-full ps-3 pe-1 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]',
        className
      )}
    >
      <span className='min-w-0 truncate'>{text}</span>
      <span className='bg-foreground/[0.06] inline-flex h-6 shrink-0 items-center gap-1 rounded-full ps-2.5 pe-2 text-xs font-medium'>
        {action}
        <ArrowRightIcon className='text-muted-foreground size-3.5 transition-transform duration-150 ease-(--ease-out-strong) group-hover/pill:translate-x-0.5 group-focus-visible/pill:translate-x-0.5 group-data-[nudged=true]/pill:translate-x-0.5' />
      </span>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 overflow-hidden rounded-full p-[1.5px] [mask:linear-gradient(black,black)_content-box_exclude,linear-gradient(black,black)]'
      >
        <span
          ref={lightRef}
          className='absolute -top-6 -left-6 size-12 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-0'
        />
      </span>
    </a>
  );
}

export default function Effect04() {
  const pill = useRef<AnnouncementPillHandle>(null);
  const [isNudged, setIsNudged] = useState(false);
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: 1200, run: () => pill.current?.reach(0.14, 2.4) },
    { after: 1000, run: () => setIsNudged(true) },
    { after: 1600, run: () => setIsNudged(false) },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: () => setIsNudged(false),
    isEnabled: !isHovered,
  });
  /** A pointer on the piece only pauses the demonstration; once a person took over, the arrow the demonstration nudged goes back. */
  const isDemoStopped = !isAutoplaying && !isHovered;
  if (isDemoStopped && isNudged) {
    setIsNudged(false);
  }

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-4 text-center'
      {...hoverHandlers}
    >
      <AnnouncementPill
        handleRef={pill}
        href='#'
        text='Shared inboxes are here'
        action='Read the post'
        isNudged={isNudged}
      />
      <p className='text-xl leading-tight font-semibold text-balance'>
        Answer every customer from one inbox
      </p>
    </div>
  );
}
