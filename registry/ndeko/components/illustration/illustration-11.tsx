'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  Globe,
  type GlobeArc,
  type GlobeLocation,
  type GlobeMarker,
} from '@/components/core/globe';
import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { degreesOf, radiansOf, rounded } from './_parts/geometry';

export type WheelPlace = {
  id: string;
  name: string;
  location: GlobeLocation;
};

type Pose = {
  transform: string;
  opacity: number;
};

/** A point of the sphere of radius one: towards longitude zero, towards longitude 90 east, towards the north pole. */
type Direction = [x: number, y: number, z: number];

type Wheel = {
  /** True for an index the wheel itself reported while it turned: the parent only hands it back. */
  isEcho: (index: number) => boolean;
  glideTo: (index: number, isInstant: boolean) => void;
  step: (by: number, isInstant: boolean) => void;
  press: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  release: (event: PointerEvent, isInstant: boolean) => void;
  cancel: (isInstant: boolean) => void;
  dispose: () => void;
};

const ITEM_PX = 36;

/** The wheel is a drum: each item sits this many degrees further round it than the one before. */
const STEP_DEG = 22;

const STEP_RAD = radiansOf(STEP_DEG);

const DRUM_RADIUS_PX = ITEM_PX / Math.sin(STEP_RAD);

const QUARTER_TURN_DEG = 90;

const SMALLEST_SCALE = 0.72;

/** A press becomes a drag once the pointer has moved this far: under it, it is a tap on a region. */
const DRAG_AFTER_PX = 4;

/** Past its first or last region the wheel gives, a third as far as it is pulled. */
const GIVE_PAST_END = 0.35;

/** How far a flick carries the wheel: where it would land after this long at the speed it was let go. */
const MOMENTUM_MS = 260;

const HELD_STILL_MS = 80;

const GLIDE_EASE_MS = 130;

/** A frame that comes late, after a hidden tab, turns the wheel no further than this long would. */
const MAX_STEP_MS = 50;

const SETTLED_WITHIN = 0.002;

const MAX_ECHOES = 16;

const EARTH_RADIUS_KM = 6371;

/** A round trip over fibre covers about a hundred kilometres each way per millisecond, after a fixed cost at both ends. */
const FIXED_LATENCY_MS = 8;

const KM_PER_ROUND_TRIP_MS = 50;

/**
 * How far to the side of the route the globe looks from. Seen from straight above the middle of the
 * route, its arc lies edge on and reads as a straight line.
 */
const VIEW_ASIDE_DEG = 20;

function poseOf(offset: number): Pose {
  const angle = offset * STEP_DEG;
  const isBehind = Math.abs(angle) >= QUARTER_TURN_DEG;
  if (isBehind) {
    return { transform: 'translateY(0px) scale(0)', opacity: 0 };
  }
  const radians = radiansOf(angle);
  const facing = Math.cos(radians);
  const drop = Math.sin(radians) * DRUM_RADIUS_PX;
  const grown = (1 - SMALLEST_SCALE) * facing;
  const down = rounded(drop);
  const scale = rounded(SMALLEST_SCALE + grown);
  return {
    transform: `translateY(${down}px) scale(${scale})`,
    opacity: rounded(facing * facing),
  };
}

function boundedIndexOf(index: number, lastIndex: number) {
  const atLeastFirst = Math.max(0, index);
  return Math.min(lastIndex, atLeastFirst);
}

function withGiveOf(raw: number, lastIndex: number) {
  if (raw < 0) {
    return raw * GIVE_PAST_END;
  }
  if (raw > lastIndex) {
    const past = raw - lastIndex;
    return lastIndex + past * GIVE_PAST_END;
  }
  return raw;
}

function shareOf(elapsedMs: number, easeMs: number) {
  const decay = Math.exp(-elapsedMs / easeMs);
  return 1 - decay;
}

/**
 * The wheel moves outside React: a drag and a glide write the pose of every item to its element, and
 * frames are asked for only while it turns. React hears about it when another region reaches the centre.
 */
function createWheel(
  host: HTMLElement,
  startIndex: number,
  onNearest: (index: number) => void
): Wheel {
  const found = host.querySelectorAll<HTMLElement>('[role="option"]');
  const items = Array.from(found);
  const lastIndex = Math.max(items.length - 1, 0);
  const echoes: number[] = [];
  let position = startIndex;
  let target = startIndex;
  let reported = startIndex;
  let velocity = 0;
  let isPressed = false;
  let isDragging = false;
  let pressY = 0;
  let grabY = 0;
  let grabPosition = 0;
  let lastMoveAt = 0;
  let frame = 0;
  let lastTick = 0;

  function paint() {
    items.forEach((item, index) => {
      const pose = poseOf(index - position);
      item.style.transform = pose.transform;
      item.style.opacity = `${pose.opacity}`;
    });
  }

  function report() {
    const closest = Math.round(position);
    const nearest = boundedIndexOf(closest, lastIndex);
    if (nearest === reported) {
      return;
    }
    reported = nearest;
    echoes.push(nearest);
    if (echoes.length > MAX_ECHOES) {
      echoes.shift();
    }
    onNearest(nearest);
  }

  function show() {
    paint();
    report();
  }

  function tick(now: number) {
    const sinceLast = now - lastTick;
    const elapsed = Math.min(sinceLast, MAX_STEP_MS);
    const gap = target - position;
    const share = shareOf(elapsed, GLIDE_EASE_MS);
    lastTick = now;
    position += gap * share;
    const isSettled = Math.abs(target - position) < SETTLED_WITHIN;
    if (isSettled) {
      position = target;
      frame = 0;
      show();
      return;
    }
    show();
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame !== 0) {
      return;
    }
    lastTick = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function sleep() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function aimAt(index: number, isInstant: boolean) {
    target = boundedIndexOf(index, lastIndex);
    if (isInstant) {
      sleep();
      position = target;
      show();
      return;
    }
    wake();
  }

  /** The region under a tap. Items sit closer together towards the rims of the drum, so the height is read back as an angle. */
  function tappedIndexOf(event: PointerEvent) {
    const box = host.getBoundingClientRect();
    const middle = box.top + box.height / 2;
    const fromMiddle = (event.clientY - middle) / DRUM_RADIUS_PX;
    const atLeast = Math.max(-1, fromMiddle);
    const reach = Math.min(1, atLeast);
    const radians = Math.asin(reach);
    const itemsAway = degreesOf(radians) / STEP_DEG;
    return Math.round(position + itemsAway);
  }

  return {
    isEcho(index) {
      const at = echoes.indexOf(index);
      if (at === -1) {
        return false;
      }
      echoes.splice(0, at + 1);
      return true;
    },
    glideTo(index, isInstant) {
      const isThere = position === index;
      const isHeading = target === index;
      if (isThere && isHeading) {
        return;
      }
      echoes.length = 0;
      aimAt(index, isInstant);
    },
    step(by, isInstant) {
      aimAt(target + by, isInstant);
    },
    press(event) {
      const isMainButton = event.button === 0;
      if (!isMainButton) {
        return;
      }
      isPressed = true;
      isDragging = false;
      pressY = event.clientY;
      host.setPointerCapture(event.pointerId);
    },
    drag(event) {
      if (!isPressed) {
        return;
      }
      if (!isDragging) {
        const travelled = Math.abs(event.clientY - pressY);
        if (travelled < DRAG_AFTER_PX) {
          return;
        }
        isDragging = true;
        grabY = event.clientY;
        grabPosition = position;
        lastMoveAt = event.timeStamp;
        velocity = 0;
        sleep();
      }
      const pulled = (grabY - event.clientY) / ITEM_PX;
      const next = withGiveOf(grabPosition + pulled, lastIndex);
      const sinceLast = event.timeStamp - lastMoveAt;
      const elapsed = Math.max(sinceLast, 1);
      const speed = (next - position) / elapsed;
      velocity = velocity * 0.6 + speed * 0.4;
      position = next;
      lastMoveAt = event.timeStamp;
      show();
    },
    release(event, isInstant) {
      if (!isPressed) {
        return;
      }
      const wasDragging = isDragging;
      isPressed = false;
      isDragging = false;
      if (!wasDragging) {
        const tapped = tappedIndexOf(event);
        aimAt(tapped, isInstant);
        return;
      }
      const stillFor = event.timeStamp - lastMoveAt;
      if (stillFor > HELD_STILL_MS) {
        velocity = 0;
      }
      const landing = Math.round(position + velocity * MOMENTUM_MS);
      aimAt(landing, isInstant);
    },
    cancel(isInstant) {
      const closest = Math.round(position);
      isPressed = false;
      isDragging = false;
      aimAt(closest, isInstant);
    },
    dispose() {
      sleep();
    },
  };
}

function distanceKmOf(from: GlobeLocation, to: GlobeLocation) {
  const fromLatitude = radiansOf(from[0]);
  const toLatitude = radiansOf(to[0]);
  const latitudeGap = toLatitude - fromLatitude;
  const longitudeGap = radiansOf(to[1] - from[1]);
  const latitudeChord = Math.sin(latitudeGap / 2) ** 2;
  const longitudeChord = Math.sin(longitudeGap / 2) ** 2;
  const shrink = Math.cos(fromLatitude) * Math.cos(toLatitude);
  const chord = latitudeChord + shrink * longitudeChord;
  const halfChord = Math.sqrt(chord);
  const angle = 2 * Math.asin(halfChord);
  return EARTH_RADIUS_KM * angle;
}

/** A rough round trip between two places, from the distance alone. It is an estimate for a demo, never a measure. */
export function latencyMsOf(from: GlobeLocation, to: GlobeLocation) {
  const distance = distanceKmOf(from, to);
  const travel = distance / KM_PER_ROUND_TRIP_MS;
  return Math.round(FIXED_LATENCY_MS + travel);
}

function directionOf([latitude, longitude]: GlobeLocation): Direction {
  const latitudeAngle = radiansOf(latitude);
  const longitudeAngle = radiansOf(longitude);
  const ring = Math.cos(latitudeAngle);
  const x = ring * Math.cos(longitudeAngle);
  const y = ring * Math.sin(longitudeAngle);
  const z = Math.sin(latitudeAngle);
  return [x, y, z];
}

function locationOf([x, y, z]: Direction): GlobeLocation {
  const flat = Math.hypot(x, y);
  const latitude = degreesOf(Math.atan2(z, flat));
  const longitude = degreesOf(Math.atan2(y, x));
  return [rounded(latitude), rounded(longitude)];
}

function sumOf(first: Direction, second: Direction): Direction {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]];
}

function scaledOf([x, y, z]: Direction, factor: number): Direction {
  return [x * factor, y * factor, z * factor];
}

/** A route with no length or no side has no direction there: it stays at zero instead of dividing by it. */
function unitOf(direction: Direction): Direction {
  const length = Math.hypot(...direction);
  if (length === 0) {
    return direction;
  }
  return scaledOf(direction, 1 / length);
}

function crossOf(first: Direction, second: Direction): Direction {
  const x = first[1] * second[2] - first[2] * second[1];
  const y = first[2] * second[0] - first[0] * second[2];
  const z = first[0] * second[1] - first[1] * second[0];
  return [x, y, z];
}

/** The pole of the circle the route runs along, taken on its southern side: looked at from there, the arc bows upwards. */
function southSideOf(start: Direction, end: Direction): Direction {
  const pole = unitOf(crossOf(start, end));
  const isNorthern = pole[2] > 0;
  if (isNorthern) {
    return scaledOf(pole, -1);
  }
  return pole;
}

/** Where the globe turns to: the middle of the route seen from a little to its south, so both ends stay in sight when they can. */
function viewOf(from: GlobeLocation, to: GlobeLocation): GlobeLocation {
  const start = directionOf(from);
  const end = directionOf(to);
  const middle = unitOf(sumOf(start, end));
  const side = southSideOf(start, end);
  const aside = radiansOf(VIEW_ASIDE_DEG);
  const fromMiddle = scaledOf(middle, Math.cos(aside));
  const fromSide = scaledOf(side, Math.sin(aside));
  const view = sumOf(fromMiddle, fromSide);
  return locationOf(view);
}

const KEY_STEPS: Record<string, number> = {
  ArrowUp: -1,
  ArrowDown: 1,
};

export type RegionWheelProps = {
  /** Where the visitor is. The route starts there. */
  visitor: WheelPlace;
  regions: WheelPlace[];
  /** The region at the centre of the wheel. The wheel glides to it when it changes from outside. */
  index: number;
  /** Called as the wheel turns, each time another region reaches its centre. */
  onIndexChange: (index: number) => void;
  className?: string;
};

export function RegionWheel({
  visitor,
  regions,
  index,
  onIndexChange,
  className,
}: RegionWheelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<Wheel | null>(null);
  const reportRef = useRef(onIndexChange);
  const [startIndex] = useState(index);
  const isStill = usePrefersReducedMotion();
  const baseId = useId();
  const lastIndex = regions.length - 1;
  const region = regions[index];
  const regionCount = regions.length;

  useEffect(() => {
    reportRef.current = onIndexChange;
  }, [onIndexChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const wheel = createWheel(host, startIndex, (nearest) =>
      reportRef.current(nearest)
    );
    wheelRef.current = wheel;
    return () => {
      wheel.dispose();
      wheelRef.current = null;
    };
  }, [startIndex, regionCount]);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel || wheel.isEcho(index)) {
      return;
    }
    wheel.glideTo(index, isStill);
  }, [index, isStill, regionCount]);

  const route = useMemo(() => {
    if (!region) {
      return null;
    }
    const markers: GlobeMarker[] = [
      { location: visitor.location, label: `Visitor in ${visitor.name}` },
      { location: region.location, label: `Region ${region.name}` },
    ];
    const arcs: GlobeArc[] = [{ from: visitor.location, to: region.location }];
    const focus = viewOf(visitor.location, region.location);
    const latencyMs = latencyMsOf(visitor.location, region.location);
    return { markers, arcs, focus, latencyMs };
  }, [visitor, region]);

  if (!region || !route) {
    return null;
  }

  const names = regions.map((place) => place.name);

  function optionIdOf(place: WheelPlace) {
    return `${baseId}-${place.id}`;
  }

  function turnWithKeys(event: React.KeyboardEvent) {
    const wheel = wheelRef.current;
    if (!wheel) {
      return;
    }
    const step = KEY_STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      wheel.step(step, isStill);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      wheel.glideTo(0, isStill);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      wheel.glideTo(lastIndex, isStill);
    }
  }

  return (
    <div className={cn('@container w-full max-w-[34rem]', className)}>
      <div className='flex flex-col items-center gap-4 @md:flex-row @md:gap-6'>
        <div
          ref={hostRef}
          role='listbox'
          aria-label='Server region'
          aria-activedescendant={optionIdOf(region)}
          tabIndex={0}
          onKeyDown={turnWithKeys}
          onPointerDown={(event) => wheelRef.current?.press(event.nativeEvent)}
          onPointerMove={(event) => wheelRef.current?.drag(event.nativeEvent)}
          onPointerUp={(event) =>
            wheelRef.current?.release(event.nativeEvent, isStill)
          }
          onPointerCancel={() => wheelRef.current?.cancel(isStill)}
          className='bg-foreground/[0.03] focus-visible:ring-ring focus-visible:ring-offset-background relative h-44 w-full max-w-56 shrink-0 cursor-grab touch-none overflow-hidden rounded-xl outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:cursor-grabbing @md:w-44'
        >
          <span
            aria-hidden='true'
            className='bg-foreground/[0.06] absolute inset-x-2 top-1/2 h-9 -translate-y-1/2 rounded-lg'
          />
          {regions.map((place, placeIndex) => (
            <div
              key={place.id}
              id={optionIdOf(place)}
              role='option'
              aria-selected={placeIndex === index}
              style={poseOf(placeIndex - startIndex)}
              onClick={() => wheelRef.current?.glideTo(placeIndex, isStill)}
              className='text-muted-foreground aria-selected:text-foreground absolute inset-x-0 top-1/2 -mt-[18px] flex h-9 cursor-pointer items-center justify-center text-[15px] font-medium transition-colors duration-150'
            >
              {place.name}
            </div>
          ))}
        </div>
        <div className='flex w-full min-w-0 flex-1 flex-col items-center gap-2'>
          <Globe
            focus={route.focus}
            markers={route.markers}
            arcs={route.arcs}
            autoRotate={false}
            label={`Route from ${visitor.name} to ${region.name}`}
            className='max-w-56'
          />
          <div className='flex flex-col items-center'>
            <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
              {visitor.name} to
              <WordRoll text={region.name} labels={names} />
            </p>
            <p className='text-2xl leading-8 font-semibold tabular-nums'>
              <MotionNumber value={route.latencyMs} />
              <span className='text-muted-foreground ms-1 text-sm font-normal'>
                ms
              </span>
            </p>
            <p className='text-muted-foreground text-xs'>
              Estimate for this demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const VISITOR: WheelPlace = {
  id: 'lagos',
  name: 'Lagos',
  location: [6.5, 3.4],
};

const REGIONS: WheelPlace[] = [
  { id: 'oregon', name: 'Oregon', location: [45.5, -122.7] },
  { id: 'virginia', name: 'Virginia', location: [38.9, -77.5] },
  { id: 'sao-paulo', name: 'São Paulo', location: [-23.5, -46.6] },
  { id: 'dublin', name: 'Dublin', location: [53.3, -6.3] },
  { id: 'frankfurt', name: 'Frankfurt', location: [50.1, 8.7] },
  { id: 'cape-town', name: 'Cape Town', location: [-33.9, 18.4] },
  { id: 'mumbai', name: 'Mumbai', location: [19.1, 72.9] },
  { id: 'singapore', name: 'Singapore', location: [1.35, 103.8] },
  { id: 'tokyo', name: 'Tokyo', location: [35.7, 139.7] },
];

const START_INDEX = 4;

const TOUR = [8, 2, 5, 1];

const TOUR_HOLD_MS = 2800;

export default function Illustration11() {
  const [index, setIndex] = useState(START_INDEX);
  const steps: AutoplayStep[] = TOUR.map((stop) => ({
    after: TOUR_HOLD_MS,
    run: () => setIndex(stop),
  }));
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: TOUR_HOLD_MS,
    onReset: () => setIndex(START_INDEX),
  });
  const region = REGIONS[index];
  const latencyMs = latencyMsOf(VISITOR.location, region.location);
  const announcement = `${region.name}, about ${latencyMs} milliseconds from ${VISITOR.name}`;

  return (
    <div ref={ref} className='flex w-full justify-center'>
      <RegionWheel
        visitor={VISITOR}
        regions={REGIONS}
        index={index}
        onIndexChange={setIndex}
      />
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
