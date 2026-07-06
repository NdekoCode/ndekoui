'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE } from './_parts/hue';
import { runWhileShowing } from './_parts/loops';
import { towards, type Point } from './_parts/math';
import { randomOf, seedOf } from './_parts/seeded';
import { useCells } from './_parts/use-cells';

const DEFAULT_CELL = 32;

const MIN_CELL = 16;

/**
 * A corner is rounded over a quarter of a cell. A run or a jog is never shorter than a cell, so two
 * rounded corners never meet.
 */
const CORNER_SHARE = 0.25;

/** A route runs this many cells to the right before it may jog, and up to five more. */
const MIN_RUN = 3;

const RUN_SPREAD = 5;

/** A jog moves a route by one or two rows. */
const MAX_JOG = 2;

/** Routes enter the box two rows apart. */
const LANE_GAP = 2;

const REVERSED_SHARE = 0.4;

/** A line drawn through the middle of a pixel fills that pixel and no other. */
const HALF_PIXEL = 0.5;

const QUARTER_TURN_DEGREES = 90;

/** The length of half a rounded corner, in radii: an eighth of a circle. */
const EIGHTH_TURN = Math.PI / 4;

/** How far the middle of a rounded corner sits from the corner itself, in radii, along each leg. */
const ARC_INSET = 1 - Math.SQRT1_2;

const SPEED_PX = 90;

/** One pulse for about this many pixels of route. */
const PULSE_GAP_PX = 520;

const FADE_IN = [{ opacity: 0 }, { opacity: 1 }];

const FADE_IN_MS = 500;

/** A pulse is a short dash centred on its place, with a tail that fades behind it. */
const PULSE =
  'absolute top-0 left-0 -mt-px -ml-2 h-0.5 w-4 rounded-full from-transparent to-current opacity-90';

const HEAD_RIGHT = 'bg-linear-to-r';

const HEAD_LEFT = 'bg-linear-to-l';

/** A place on a route, the way a pulse faces there, and how much of the route lies before it. */
type Stop = Point & {
  angle: number;
  at: number;
};

type Mark = Point & {
  angle: number;
  length: number;
};

type Route = {
  id: string;
  path: string;
  stops: Stop[];
  length: number;
  isReversed: boolean;
  /** Where along the route its first pulse starts, from 0 to 1. */
  phase: number;
};

type Pulse = {
  id: string;
  route: Route;
  phase: number;
  /** Where the pulse sits before it runs, and under reduced motion. */
  rest: string;
};

/** A route as it is being walked: its path so far, and where the walk stands. */
type Trace = {
  parts: string[];
  marks: Mark[];
  length: number;
  at: Point;
  heading: Point;
};

function pixelOf(corner: Point, cell: number): Point {
  const across = corner.x * cell;
  const down = corner.y * cell;
  return { x: across + HALF_PIXEL, y: down + HALF_PIXEL };
}

/** Routes only run along the grid, so a heading is one step along one axis. */
function headingOf(from: Point, to: Point): Point {
  const across = to.x - from.x;
  const down = to.y - from.y;
  return { x: Math.sign(across), y: Math.sign(down) };
}

/** A route never runs to the left: it faces right, down or up. */
function angleOf(heading: Point) {
  return heading.y * QUARTER_TURN_DEGREES;
}

function stepFrom(point: Point, heading: Point, distance: number): Point {
  const across = heading.x * distance;
  const down = heading.y * distance;
  return { x: point.x + across, y: point.y + down };
}

function distanceBetween(from: Point, to: Point) {
  const across = to.x - from.x;
  const down = to.y - from.y;
  return Math.hypot(across, down);
}

/** The flag an SVG arc takes: 1 when the turn is clockwise on screen. */
function sweepOf(heading: Point, leaving: Point) {
  const forward = heading.x * leaving.y;
  const sideways = heading.y * leaving.x;
  const isClockwise = forward > sideways;
  return Number(isClockwise);
}

function advance(trace: Trace, point: Point, angle: number, travelled: number) {
  trace.length += travelled;
  trace.at = point;
  trace.marks.push({ x: point.x, y: point.y, angle, length: trace.length });
}

/**
 * One rounded corner: a quarter of a circle between a point short of the corner and a point past
 * it. A pulse is told where the arc starts, where its middle is and where it ends, and turns as it
 * goes from one to the next, so it follows the arc closely on a straight glide.
 */
function turn(trace: Trace, corner: Point, next: Point, radius: number) {
  const { heading } = trace;
  const leaving = headingOf(corner, next);
  const inset = radius * ARC_INSET;
  const halfArc = radius * EIGHTH_TURN;
  const enter = stepFrom(corner, heading, -radius);
  const exit = stepFrom(corner, leaving, radius);
  const pulledBack = stepFrom(corner, heading, -inset);
  const middle = stepFrom(pulledBack, leaving, inset);
  const angleIn = angleOf(heading);
  const angleOut = angleOf(leaving);
  const angleSum = angleIn + angleOut;
  const angleMiddle = angleSum / 2;
  const straight = distanceBetween(trace.at, enter);
  const sweep = sweepOf(heading, leaving);
  const lineIn = `L${enter.x} ${enter.y}`;
  const arcOut = `A${radius} ${radius} 0 0 ${sweep} ${exit.x} ${exit.y}`;
  advance(trace, enter, angleIn, straight);
  advance(trace, middle, angleMiddle, halfArc);
  advance(trace, exit, angleOut, halfArc);
  trace.parts.push(lineIn, arcOut);
  trace.heading = leaving;
}

function stopOf(mark: Mark, total: number): Stop {
  const at = mark.length / total;
  return { x: mark.x, y: mark.y, angle: mark.angle, at };
}

function tracedOf(points: Point[], radius: number) {
  const first = points[0];
  const second = points[1];
  const last = points.at(-1);
  if (!first || !second || !last) {
    return null;
  }
  const heading = headingOf(first, second);
  const trace: Trace = {
    parts: [`M${first.x} ${first.y}`],
    marks: [],
    length: 0,
    at: first,
    heading,
  };
  advance(trace, first, angleOf(heading), 0);
  for (let index = 1; index < points.length - 1; index += 1) {
    turn(trace, points[index], points[index + 1], radius);
  }
  const lastLeg = distanceBetween(trace.at, last);
  advance(trace, last, angleOf(trace.heading), lastLeg);
  trace.parts.push(`L${last.x} ${last.y}`);
  return trace;
}

/** The row a jog ends on: the side asked for when there is room, the other side otherwise. */
function jogOf(row: number, reach: number, isUp: boolean, rows: number) {
  const lowest = Math.max(1, rows - 1);
  const up = Math.max(1, row - reach);
  const down = Math.min(lowest, row + reach);
  const canGoUp = up !== row;
  const canGoDown = down !== row;
  if (isUp && canGoUp) {
    return up;
  }
  if (canGoDown) {
    return down;
  }
  return up;
}

/**
 * The corners of one route, in cells. It enters a cell before the left edge and leaves past the
 * right one. Every round draws the same three numbers, whatever the size of the box, so a wider
 * box shows more of the same route and never another one.
 */
function cornersOf(
  next: () => number,
  firstRow: number,
  columns: number,
  rows: number
) {
  const lastColumn = columns + 1;
  const corners: Point[] = [{ x: -1, y: firstRow }];
  let column = -1;
  let row = firstRow;
  while (column < lastColumn) {
    const runRoll = next() * RUN_SPREAD;
    const jogRoll = next() * MAX_JOG;
    const isUp = next() < 0.5;
    const run = MIN_RUN + Math.floor(runRoll);
    const reach = 1 + Math.floor(jogRoll);
    column += run;
    const target = jogOf(row, reach, isUp, rows);
    const hasRoomLeft = column < lastColumn;
    const isTurning = target !== row && hasRoomLeft;
    if (isTurning) {
      const bend = { x: column, y: row };
      const landing = { x: column, y: target };
      corners.push(bend, landing);
      row = target;
    }
  }
  corners.push({ x: column, y: row });
  return corners;
}

function routeOf(
  seed: number,
  lane: number,
  columns: number,
  rows: number,
  cell: number
): Route | null {
  const laneSeed = seedOf(seed, lane);
  const next = randomOf(laneSeed);
  const isReversed = next() < REVERSED_SHARE;
  const phase = next();
  const rowsDown = lane * LANE_GAP;
  const firstRow = 1 + rowsDown;
  const radius = cell * CORNER_SHARE;
  const corners = cornersOf(next, firstRow, columns, rows);
  const points = corners.map((corner) => pixelOf(corner, cell));
  const trace = tracedOf(points, radius);
  if (!trace) {
    return null;
  }
  const total = trace.length;
  return {
    id: `route-${lane}`,
    path: trace.parts.join(''),
    stops: trace.marks.map((mark) => stopOf(mark, total)),
    length: total,
    isReversed,
    phase,
  };
}

function isRoute(route: Route | null): route is Route {
  return route !== null;
}

function routesOf(seed: number, columns: number, rows: number, cell: number) {
  const usable = Math.max(1, rows - 1);
  const fitting = Math.floor(usable / LANE_GAP);
  const lanes = Math.max(1, fitting);
  const drawn = Array.from({ length: lanes }, (_, lane) =>
    routeOf(seed, lane, columns, rows, cell)
  );
  return drawn.filter(isRoute);
}

function roundedOf(value: number) {
  const scaled = Math.round(value * 100);
  return scaled / 100;
}

function transformOf(place: Point & { angle: number }) {
  const x = roundedOf(place.x);
  const y = roundedOf(place.y);
  const angle = roundedOf(place.angle);
  return `translate(${x}px, ${y}px) rotate(${angle}deg)`;
}

/** Where a pulse is and how it faces once it has covered `phase` of its route. */
function restOf(route: Route, phase: number) {
  let before = route.stops[0];
  for (const stop of route.stops) {
    const isPast = stop.at > phase;
    if (isPast && before) {
      const span = stop.at - before.at;
      const covered = phase - before.at;
      const share = covered / span;
      const x = towards(before.x, stop.x, share);
      const y = towards(before.y, stop.y, share);
      const angle = towards(before.angle, stop.angle, share);
      return transformOf({ x, y, angle });
    }
    before = stop;
  }
  return 'none';
}

function pulsesOn(route: Route): Pulse[] {
  const wanted = Math.round(route.length / PULSE_GAP_PX);
  const count = Math.max(1, wanted);
  return Array.from({ length: count }, (_, index) => {
    const spread = index / count;
    const shifted = route.phase + spread;
    const phase = shifted % 1;
    return {
      id: `${route.id}-${index}`,
      route,
      phase,
      rest: restOf(route, phase),
    };
  });
}

function keyframeOf(stop: Stop): Keyframe {
  return { offset: stop.at, transform: transformOf(stop) };
}

function directionOf(isReversed: boolean): PlaybackDirection {
  if (isReversed) {
    return 'reverse';
  }
  return 'normal';
}

function headOf(isReversed: boolean) {
  if (isReversed) {
    return HEAD_LEFT;
  }
  return HEAD_RIGHT;
}

/** One pulse travels its whole route at a steady speed, by a transform alone, and starts over. */
function travelOf(element: Element, pulse: Pulse) {
  const { route } = pulse;
  const seconds = route.length / SPEED_PX;
  const duration = seconds * 1000;
  const frames = route.stops.map(keyframeOf);
  return element.animate(frames, {
    duration,
    iterations: Infinity,
    iterationStart: pulse.phase,
    direction: directionOf(route.isReversed),
  });
}

function travelsOf(group: HTMLElement, pulses: Pulse[]) {
  const elements = group.querySelectorAll('[data-pulse]');
  const travels: Animation[] = [];
  elements.forEach((element, index) => {
    const pulse = pulses[index];
    if (pulse) {
      travels.push(travelOf(element, pulse));
    }
  });
  return travels;
}

type TracesProps = {
  seed: number;
  columns: number;
  rows: number;
  cell: number;
};

/** The routes and their pulses, for one seed. A new seed mounts a new one, which fades in. */
function Traces({ seed, columns, rows, cell }: TracesProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const routes = useMemo(
    () => routesOf(seed, columns, rows, cell),
    [seed, columns, rows, cell]
  );
  const pulses = useMemo(() => routes.flatMap(pulsesOn), [routes]);
  const columnsDrawn = columns + 2;
  const rowsDrawn = rows + 1;
  const width = columnsDrawn * cell;
  const height = rowsDrawn * cell;

  useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const fade = group.animate(FADE_IN, {
      duration: FADE_IN_MS,
      easing: 'ease-out',
    });
    return () => fade.cancel();
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || shouldReduceMotion) {
      return;
    }
    const travels = travelsOf(group, pulses);
    return runWhileShowing(group, travels);
  }, [pulses, shouldReduceMotion]);

  return (
    <div ref={groupRef} className='absolute inset-0'>
      <svg
        aria-hidden='true'
        width={width}
        height={height}
        fill='none'
        stroke='currentColor'
        strokeWidth={1}
        className='text-border absolute top-0 left-0'
      >
        {routes.map((route) => (
          <path key={route.id} d={route.path} />
        ))}
      </svg>
      {pulses.map((pulse) => (
        <span
          key={pulse.id}
          data-pulse=''
          style={{ transform: pulse.rest }}
          className={cn(PULSE, headOf(pulse.route.isReversed))}
        />
      ))}
    </div>
  );
}

export type SignalLinesProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The pulses wear it. */
  hue?: string;
  /** The same seed always draws the same routes. */
  seed?: number;
  /** The side of a cell of the grid the routes follow, in pixels. */
  size?: number;
};

/**
 * Faint routes with rounded corners, drawn from a seed in the border colour, and pulses of the hue
 * that travel along them. A pulse is moved by a transform alone, so nothing is repainted while it
 * travels. It fills its parent, which must be positioned. Under reduced motion the pulses rest on
 * their routes.
 */
export function SignalLines({
  className,
  hue = DEFAULT_HUE,
  seed = 1,
  size = DEFAULT_CELL,
}: SignalLinesProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cell = Math.max(MIN_CELL, size);
  const { columns, rows } = useCells(hostRef, cell);
  const hasCells = columns > 0 && rows > 0;

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={{ color: hue }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        className
      )}
    >
      {hasCells && (
        <Traces
          key={seed}
          seed={seed}
          columns={columns}
          rows={rows}
          cell={cell}
        />
      )}
    </div>
  );
}

export default function Background10() {
  const [seed, setSeed] = useState(1);

  return (
    <DemoBand
      title='Signals that travel along quiet routes'
      background={<SignalLines seed={seed} />}
    >
      <Button onClick={() => setSeed((current) => current + 1)}>
        Draw new routes
      </Button>
    </DemoBand>
  );
}
