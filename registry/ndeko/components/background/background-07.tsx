'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { Aim } from './_parts/aim';
import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE } from './_parts/hue';
import { landTransitions } from './_parts/loops';
import { watchShowing } from './_parts/showing';
import { useCells } from './_parts/use-cells';

const DEFAULT_CELL = 40;

const MIN_CELL = 8;

/**
 * A line is one device pixel wide and lies wholly inside its cell: the path runs along the top and
 * left edges, shifted in by half its own width, so it never straddles two pixels.
 */
const LINE_STYLE: CSSProperties = {
  strokeWidth: 'var(--hairline, 1px)',
  transform:
    'translate(calc(var(--hairline, 1px) / 2), calc(var(--hairline, 1px) / 2))',
};

/** Five dashes to a cell, so a dashed line runs on from one cell to the next without a seam. */
const DASHES_PER_CELL = 5;

const DASH_PARTS = DASHES_PER_CELL * 2;

const FADE_MASK =
  '[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]';

/** How strongly a lit cell wears the hue. Text sits above the grid, so it stays a tint. */
const LIT_FILL = 'color-mix(in oklab, currentColor 16%, transparent)';

/**
 * A lit cell is a box laid over the pattern. A box that fades its opacity on its own layer is
 * composited, where a shape inside the drawing would repaint the grid on every frame of its fade.
 * The layer is kept between fades, so starting or ending one repaints nothing either.
 */
const LIT_CELL =
  'absolute top-px left-px opacity-0 transition-opacity duration-700 ease-(--ease-out-strong) will-change-[opacity]';

/** Where the four lit cells rest, across and down the box. */
const RESTS: Aim[] = [
  { x: 0.2, y: 0.32 },
  { x: 0.42, y: 0.7 },
  { x: 0.63, y: 0.24 },
  { x: 0.82, y: 0.62 },
];

/** A cell fades out, lands on its new place and fades in, then the next one takes its turn. */
const FADE_MS = 700;

const REST_MS = 1100;

/** A new place is drawn inside this margin, so a lit cell is never cut by the edge of the box. */
const EDGE_MARGIN = 0.06;

const BOTH_MARGINS = EDGE_MARGIN * 2;

const PLACE_ROOM = 1 - BOTH_MARGINS;

const PLACE_TRIES = 8;

const RADIANS_PER_DEGREE = Math.PI / 180;

type Place = {
  column: number;
  row: number;
};

function dashesOf(isDashed: boolean, cell: number) {
  if (!isDashed) {
    return undefined;
  }
  const dash = cell / DASH_PARTS;
  return `${dash} ${dash}`;
}

/**
 * The cell under a point of the box. The grid is twice as wide as the box, starts half a box to
 * its left and leans around its own middle, so the point is brought back into the grid first.
 */
function cellAt(
  host: HTMLElement,
  aim: Aim,
  cell: number,
  skew: number
): Place {
  const width = host.clientWidth;
  const height = host.clientHeight;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const x = aim.x * width;
  const y = aim.y * height;
  const radians = skew * RADIANS_PER_DEGREE;
  const lean = Math.tan(radians);
  const fromMiddle = y - halfHeight;
  const leaned = fromMiddle * lean;
  const fromGridEdge = x + halfWidth;
  const along = fromGridEdge - leaned;
  const column = Math.floor(along / cell);
  const row = Math.floor(y / cell);
  return { column, row };
}

function litStyleOf(side: number): CSSProperties {
  return { width: side, height: side, backgroundColor: LIT_FILL };
}

function put(square: HTMLElement, place: Place, cell: number) {
  const x = place.column * cell;
  const y = place.row * cell;
  square.style.transform = `translate(${x}px, ${y}px)`;
}

function show(square: HTMLElement) {
  square.style.opacity = '1';
}

function hide(square: HTMLElement) {
  square.style.opacity = '0';
}

function isSamePlace(first: Place, second: Place) {
  const isSameColumn = first.column === second.column;
  const isSameRow = first.row === second.row;
  return isSameColumn && isSameRow;
}

function shareWithinMargin() {
  const share = Math.random() * PLACE_ROOM;
  return EDGE_MARGIN + share;
}

type Trade = {
  host: HTMLElement;
  squares: HTMLElement[];
  places: Place[];
  cell: number;
  skewOf: () => number;
};

/** A place no lit cell holds. After a few unlucky draws the last one is taken as it is. */
function freePlaceOf(trade: Trade) {
  let place: Place = { column: 0, row: 0 };
  for (let attempt = 0; attempt < PLACE_TRIES; attempt += 1) {
    const aim = { x: shareWithinMargin(), y: shareWithinMargin() };
    const candidate = cellAt(trade.host, aim, trade.cell, trade.skewOf());
    const isTaken = trade.places.some((taken) => isSamePlace(taken, candidate));
    place = candidate;
    if (!isTaken) {
      return place;
    }
  }
  return place;
}

function settle(trade: Trade) {
  trade.squares.forEach((square, index) => {
    const rest = RESTS[index];
    if (!rest) {
      return;
    }
    const place = cellAt(trade.host, rest, trade.cell, trade.skewOf());
    trade.places[index] = place;
    put(square, place, trade.cell);
    show(square);
  });
}

/**
 * The lit cells trade places while the grid shows: one timer, and an opacity transition between
 * two of its ticks. Hidden, the timer is gone and every cell is put back in sight where it stands,
 * at once.
 */
function tradeWhileShowing(trade: Trade) {
  let turn = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function land() {
    const square = trade.squares[turn];
    const place = freePlaceOf(trade);
    trade.places[turn] = place;
    if (square) {
      put(square, place, trade.cell);
      show(square);
    }
    const next = turn + 1;
    turn = next % trade.squares.length;
    timer = setTimeout(leave, REST_MS);
  }

  function leave() {
    const square = trade.squares[turn];
    if (square) {
      hide(square);
    }
    timer = setTimeout(land, FADE_MS);
  }

  function stop() {
    clearTimeout(timer);
    timer = undefined;
    trade.squares.forEach(show);
    landTransitions(trade.host);
  }

  const stopWatching = watchShowing(trade.host, (isShowing) => {
    if (isShowing) {
      timer = setTimeout(leave, REST_MS);
      return;
    }
    stop();
  });

  return () => {
    stopWatching();
    stop();
  };
}

export type GridPatternProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The lit cells wear it. */
  hue?: string;
  /** The side of a cell, in pixels. */
  size?: number;
  dashed?: boolean;
  /** How far the grid leans, in degrees. Keep it between -30 and 30. */
  skew?: number;
  /** Fades the grid out towards the edges of the box. */
  fade?: boolean;
};

/**
 * A crisp grid of hairlines in the border colour, drawn by one SVG pattern on whole pixels, with
 * four cells lit in the hue that trade places every few seconds. The lines can be dashed, the grid
 * can lean and fade out towards its edges. It fills its parent, which must be positioned. Under
 * reduced motion the four cells stay where they are.
 */
export function GridPattern({
  className,
  hue = DEFAULT_HUE,
  size = DEFAULT_CELL,
  dashed = false,
  skew = 0,
  fade = false,
}: GridPatternProps) {
  const patternId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const skewRef = useRef(skew);
  const shouldReduceMotion = usePrefersReducedMotion();
  const cell = Math.max(MIN_CELL, size);
  const { columns, rows } = useCells(hostRef, cell);
  const inner = cell - 1;

  useEffect(() => {
    skewRef.current = skew;
  }, [skew]);

  useEffect(() => {
    const host = hostRef.current;
    const hasCells = columns > 0 && rows > 0;
    if (!host || !hasCells) {
      return;
    }
    const lit = host.querySelectorAll<HTMLElement>('[data-lit]');
    const squares = Array.from(lit);
    const trade: Trade = {
      host,
      squares,
      places: [],
      cell,
      skewOf: () => skewRef.current,
    };
    settle(trade);
    if (shouldReduceMotion) {
      return;
    }
    return tradeWhileShowing(trade);
  }, [columns, rows, cell, shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={{ color: hue }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        fade && FADE_MASK,
        className
      )}
    >
      <div
        style={{ transform: `skewX(${skew}deg)` }}
        className='absolute -inset-x-1/2 inset-y-0 transition-transform duration-500 ease-(--ease-out-strong)'
      >
        <svg aria-hidden='true' className='absolute inset-0 size-full'>
          <defs>
            <pattern
              id={patternId}
              width={cell}
              height={cell}
              patternUnits='userSpaceOnUse'
            >
              <path
                d={`M${cell} 0H0V${cell}`}
                fill='none'
                stroke='currentColor'
                strokeDasharray={dashesOf(dashed, cell)}
                shapeRendering='crispEdges'
                style={LINE_STYLE}
                className='text-border'
              />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill={`url(#${patternId})`} />
        </svg>
        {RESTS.map((rest) => (
          <div
            key={rest.x}
            data-lit=''
            style={litStyleOf(inner)}
            className={LIT_CELL}
          />
        ))}
      </div>
    </div>
  );
}

/** A lean that shows the option without bending the grid out of the band. */
const DEMO_SKEW = -14;

function skewOf(isLeaning: boolean) {
  if (isLeaning) {
    return DEMO_SKEW;
  }
  return 0;
}

function labelOf(isLeaning: boolean) {
  if (isLeaning) {
    return 'Level the grid';
  }
  return 'Tilt the grid';
}

export default function Background07() {
  const [isLeaning, setIsLeaning] = useState(false);
  const label = labelOf(isLeaning);

  return (
    <DemoBand
      title='A grid where four cells trade places'
      background={<GridPattern skew={skewOf(isLeaning)} fade />}
    >
      <Button onClick={() => setIsLeaning((current) => !current)}>
        <Swap swapKey={label}>{label}</Swap>
      </Button>
    </DemoBand>
  );
}
