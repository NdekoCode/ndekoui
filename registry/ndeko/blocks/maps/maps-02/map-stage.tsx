'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import { DottedMap } from '@/components/core/dotted-map';
import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  AGENTS,
  regionOf,
  REGIONS,
  ROUTES,
  routeBetween,
  touchesRegion,
  type Region,
  type RegionId,
} from './data';
import {
  arcPathOf,
  bendOf,
  pointOf,
  shareOf,
  VIEW_BOX,
  VIEW_WIDTH,
  type MapPoint,
  type Share,
} from './projection';
import { FLIGHT_MS, pinnedLineOf, type Flight } from './session';

/** The first half of a parabola, as an easing: fast away from the chord, slow at the top. */
const RISE = 'cubic-bezier(0.3333, 0.6667, 0.6667, 1)';

/** The second half: slow from the top, fast back onto the chord. */
const FALL = 'cubic-bezier(0.3333, 0, 0.6667, 0.3333)';

/** A marker this close to the top of the map opens its bubble below, inside the map. */
const NEAR_TOP = 0.35;

const DOT_SCALE_MIN = 0.75;

const DOT_SCALE_MAX = 1.35;

const DOT_SCALE_PER_RUN = 0.035;

const ROUTE_LINE =
  'fill-none stroke-[1.25px] transition-[stroke] duration-200 [vector-effect:non-scaling-stroke]';

const MARKER = [
  'group/marker absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none',
  'transition-[scale,background-color] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
  'hover:z-10 focus-visible:z-10 data-[pinned=true]:z-10',
  'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
].join(' ');

const DOT =
  'bg-primary size-3 rounded-full transition-[scale,box-shadow] duration-300 ease-(--ease-out-strong)';

const LANDING_RING =
  'ring-primary/60 absolute size-3 scale-[2.6] rounded-full opacity-0 ring-1 transition-[scale,opacity] duration-700 ease-(--ease-out-strong) starting:scale-100 starting:opacity-100';

const BUBBLE = [
  'surface-raised pointer-events-none absolute left-1/2 z-10 w-max max-w-48 rounded-lg px-2 py-1 text-start text-xs leading-4',
  'opacity-0 transition-opacity duration-100',
  'group-hover/marker:opacity-100 group-focus-visible/marker:opacity-100 group-data-[pinned=true]/marker:opacity-100',
].join(' ');

type DrawnRoute = {
  id: string;
  from: RegionId;
  to: RegionId;
  path: string;
};

function placeOf(id: RegionId): MapPoint {
  const region = regionOf(id);
  return pointOf(region.latitude, region.longitude);
}

const DRAWN_ROUTES: DrawnRoute[] = ROUTES.map((route) => {
  const from = placeOf(route.from);
  const to = placeOf(route.to);
  const path = arcPathOf(from, to);
  return { ...route, path };
});

function shareOfRegion(id: RegionId) {
  const point = placeOf(id);
  return shareOf(point);
}

function percentOf(share: number) {
  const percent = share * 100;
  return `${percent}%`;
}

function anchorStyleOf(share: Share) {
  return { left: percentOf(share.left), top: percentOf(share.top) };
}

function clamp(value: number, min: number, max: number) {
  const atLeast = Math.max(value, min);
  return Math.min(atLeast, max);
}

/** A busier region draws a larger dot. */
function dotStyleOf(runs: number) {
  const grown = runs * DOT_SCALE_PER_RUN;
  const raw = DOT_SCALE_MIN + grown;
  const scale = clamp(raw, DOT_SCALE_MIN, DOT_SCALE_MAX);
  return { scale: String(scale) };
}

function dotRingOf(isPinned: boolean) {
  if (isPinned) {
    return 'ring-primary/25 ring-4';
  }
  return 'ring-card ring-2';
}

function routeToneOf(isLit: boolean) {
  if (isLit) {
    return 'stroke-primary/70';
  }
  return 'stroke-foreground/20';
}

function bubblePlaceOf(isNearTop: boolean) {
  if (isNearTop) {
    return 'top-full mt-1';
  }
  return 'bottom-full mb-1';
}

/** The bubble slides from its left edge to its right edge as its marker crosses the map, so it never leaves it. */
function bubbleShiftOf(share: Share) {
  const percent = share.left * 100;
  return { transform: `translateX(-${percent}%)` };
}

function runsNowWordOf(count: number) {
  if (count === 1) {
    return 'run now';
  }
  return 'runs now';
}

type Motion = {
  travel: Keyframe[];
  bend: Keyframe[];
};

/** The bend of the route a flight follows, whichever way it travels it, so the light stays on the drawn line. */
function routeBendOf(flight: Flight) {
  const route = routeBetween(flight.from, flight.to);
  let fromId = flight.from;
  let toId = flight.to;
  if (route) {
    fromId = route.from;
    toId = route.to;
  }
  const from = placeOf(fromId);
  const to = placeOf(toId);
  return bendOf(from, to);
}

/**
 * A quadratic curve is the straight line between its ends plus a parabola away from it. The light
 * travels the line on one element and the parabola on the one inside it, both on transform.
 */
function motionOf(flight: Flight, scale: number): Motion {
  const from = placeOf(flight.from);
  const to = placeOf(flight.to);
  const bend = routeBendOf(flight);
  const spanX = to.x - from.x;
  const spanY = to.y - from.y;
  const dx = spanX * scale;
  const dy = spanY * scale;
  const topX = bend.x * scale;
  const topY = bend.y * scale;
  const travel = [
    { translate: '0px 0px', opacity: 0 },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, offset: 0.86 },
    { translate: `${dx}px ${dy}px`, opacity: 0 },
  ];
  const lift = [
    { translate: '0px 0px', easing: RISE },
    { translate: `${topX}px ${topY}px`, offset: 0.5, easing: FALL },
    { translate: '0px 0px' },
  ];
  return { travel, bend: lift };
}

function RouteLayer({ selectedId }: { selectedId: RegionId | null }) {
  return (
    <svg
      viewBox={VIEW_BOX}
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 size-full overflow-visible'
    >
      {DRAWN_ROUTES.map((route) => {
        const isLit = touchesRegion(route, selectedId);
        return (
          <path
            key={route.id}
            d={route.path}
            className={cn(ROUTE_LINE, routeToneOf(isLit))}
          />
        );
      })}
    </svg>
  );
}

type FlightLightProps = {
  flight: Flight;
  /** False off screen and in a hidden tab: the light waits where it is, as the session does. */
  isActive: boolean;
};

/** One light, once: it leaves when its run departs and fades as the run lands. */
function FlightLight({ flight, isActive }: FlightLightProps) {
  const travelRef = useRef<HTMLSpanElement>(null);
  const bendRef = useRef<HTMLSpanElement>(null);
  const animations = useRef<Animation[]>([]);
  const start = shareOfRegion(flight.from);
  const agent = AGENTS[flight.agentId];
  const color = seriesColorOf(agent.series);
  const dotStyle = { backgroundColor: color };

  useLayoutEffect(() => {
    const travel = travelRef.current;
    const bend = bendRef.current;
    const overlay = travel?.closest<HTMLElement>('[data-map-overlay]');
    const hasElements = travel !== null && bend !== null;
    if (!hasElements || !overlay) {
      return;
    }
    const scale = overlay.clientWidth / VIEW_WIDTH;
    const motion = motionOf(flight, scale);
    const timing: KeyframeAnimationOptions = {
      duration: FLIGHT_MS,
      fill: 'forwards',
    };
    const moving = travel.animate(motion.travel, timing);
    const bending = bend.animate(motion.bend, timing);
    animations.current = [moving, bending];
    return () => {
      moving.cancel();
      bending.cancel();
      animations.current = [];
    };
  }, [flight]);

  /** A finished light is never paused: playing it again would send it back to its start. */
  useEffect(() => {
    for (const animation of animations.current) {
      const isRunning = animation.playState === 'running';
      const isPaused = animation.playState === 'paused';
      const shouldPause = !isActive && isRunning;
      const shouldResume = isActive && isPaused;
      if (shouldPause) {
        animation.pause();
      }
      if (shouldResume) {
        animation.play();
      }
    }
  }, [isActive]);

  return (
    <span
      aria-hidden='true'
      style={anchorStyleOf(start)}
      className='pointer-events-none absolute size-0'
    >
      <span ref={travelRef} className='absolute opacity-0'>
        <span ref={bendRef} className='absolute'>
          <span
            style={dotStyle}
            className='ring-card absolute -top-1 -left-1 size-2 rounded-full ring-2'
          />
        </span>
      </span>
    </span>
  );
}

type RegionMarkerProps = {
  region: Region;
  runs: number;
  isPinned: boolean;
  isPressed: boolean;
  /** The flight that landed here last: a ring answers each new one. */
  landingId: string | undefined;
  onToggle: (id: RegionId) => void;
};

function RegionMarker({
  region,
  runs,
  isPinned,
  isPressed,
  landingId,
  onToggle,
}: RegionMarkerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const share = shareOfRegion(region.id);
  const isNearTop = share.top < NEAR_TOP;
  const hasLanding = landingId !== undefined;
  const showsRing = hasLanding && !shouldReduceMotion;

  return (
    <span style={anchorStyleOf(share)} className='absolute size-0'>
      <button
        type='button'
        aria-pressed={isPinned}
        aria-label={pinnedLineOf(region.id, runs)}
        data-pinned={isPinned}
        onClick={() => onToggle(region.id)}
        className={cn(MARKER, pressedQuietOf(isPressed))}
      >
        <span
          aria-hidden='true'
          className='absolute inset-0 flex items-center justify-center'
        >
          {showsRing && <span key={landingId} className={LANDING_RING} />}
          <span
            style={dotStyleOf(runs)}
            className={cn(DOT, dotRingOf(isPinned))}
          />
        </span>
        <span
          aria-hidden='true'
          style={bubbleShiftOf(share)}
          className={cn(BUBBLE, bubblePlaceOf(isNearTop))}
        >
          <span className='block font-medium'>
            {region.name}, {region.place}
          </span>
          <span className='text-muted-foreground flex items-baseline gap-1'>
            <MotionNumber value={runs} />
            {runsNowWordOf(runs)}
          </span>
        </span>
      </button>
    </span>
  );
}

export type MapStageProps = {
  runs: Record<RegionId, number>;
  flights: Flight[];
  landings: Partial<Record<RegionId, string>>;
  selectedId: RegionId | null;
  /** The marker a demonstration presses, shown held down. */
  pressed: string | null;
  isActive: boolean;
  onToggle: (id: RegionId) => void;
  onClear: () => void;
};

/**
 * The dotted map with an overlay drawn in its own units: routes as curves, a light along a route for
 * each run handed off, and a button on each region. Under reduced motion the routes stay drawn and
 * still, and no light travels.
 */
export function MapStage({
  runs,
  flights,
  landings,
  selectedId,
  pressed,
  isActive,
  onToggle,
  onClear,
}: MapStageProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const showsFlights = !shouldReduceMotion;

  function clearOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    const isEscape = event.key === 'Escape';
    const hasPinned = selectedId !== null;
    if (isEscape && hasPinned) {
      onClear();
    }
  }

  return (
    <div className='relative'>
      <DottedMap
        label='World map of live runs'
        dotClassName='text-foreground/15'
      />
      <div
        data-map-overlay
        onKeyDown={clearOnEscape}
        className='absolute inset-0'
      >
        <RouteLayer selectedId={selectedId} />
        {showsFlights &&
          flights.map((flight) => (
            <FlightLight key={flight.id} flight={flight} isActive={isActive} />
          ))}
        {REGIONS.map((region) => (
          <RegionMarker
            key={region.id}
            region={region}
            runs={runs[region.id]}
            isPinned={region.id === selectedId}
            isPressed={pressed === `marker-${region.id}`}
            landingId={landings[region.id]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
