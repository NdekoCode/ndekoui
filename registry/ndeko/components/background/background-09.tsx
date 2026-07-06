'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';
import { runWhileShowing } from './_parts/loops';

const DEFAULT_CELL = 44;

const MIN_CELL = 16;

const DEFAULT_DURATION_S = 9;

/** The hue is on every fourth line, so the floor repeats every four cells: the loop runs exactly that far. */
const MAJOR_EVERY = 4;

/**
 * The eye of the scene: how far it stands from the screen, and how high in the box. The floor lies
 * flat under it, so its lines run towards that height, which is the horizon.
 */
const EYE: CSSProperties = {
  perspective: '240px',
  perspectiveOrigin: '50% 38%',
};

/**
 * The floor lies down from the bottom edge of the box, which is its near edge. It is short and
 * fades out long before the horizon: the far part of a floor is a large surface for a few pixels
 * on screen, and its lines would crowd there.
 */
const FLOOR: CSSProperties = {
  height: 460,
  transform: 'rotateX(90deg)',
};

const MINOR_LINE = 'var(--border)';

const MAJOR_LINE = 'color-mix(in oklab, currentColor 55%, transparent)';

function lineOf(direction: string, colour: string) {
  return `linear-gradient(${direction}, ${colour} 1px, transparent 1px)`;
}

const LINES = [
  lineOf('to right', MAJOR_LINE),
  lineOf('to bottom', MAJOR_LINE),
  lineOf('to right', MINOR_LINE),
  lineOf('to bottom', MINOR_LINE),
].join(', ');

/**
 * The lines hang from the near edge and reach one round of the loop past the far edge, so the
 * floor stays covered while they run. Both grids start from the same corner, so every fourth line
 * of the neutral grid is under a line of the hue.
 */
function linesOf(cell: number): CSSProperties {
  const major = cell * MAJOR_EVERY;
  const majorTile = `${major}px ${major}px`;
  const minorTile = `${cell}px ${cell}px`;
  const tiles = [majorTile, majorTile, minorTile, minorTile];
  return {
    top: -major,
    backgroundImage: LINES,
    backgroundSize: tiles.join(', '),
    backgroundPosition: '0 100%',
  };
}

function runOf(lines: HTMLElement, cell: number, durationSeconds: number) {
  const travel = cell * MAJOR_EVERY;
  const duration = durationSeconds * 1000;
  const frames = [
    { transform: 'translateY(0px)' },
    { transform: `translateY(${travel}px)` },
  ];
  return lines.animate(frames, {
    duration,
    easing: 'linear',
    iterations: Infinity,
  });
}

export type PerspectiveGridProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. Every fourth line wears it. */
  hue?: string;
  /** The side of a cell of the floor, in pixels. */
  size?: number;
  /** Seconds for the floor to run four cells towards the viewer. */
  duration?: number;
};

/**
 * A grid floor that runs towards the viewer and fades into a soft horizon. The lines are hairlines
 * in the border colour, with the hue on every fourth one. It is all CSS: one plane laid down in 3D
 * and one transform that loops, so nothing is repainted while it runs. It fills its parent, which
 * must be positioned. Under reduced motion the floor stands still.
 */
export function PerspectiveGrid({
  className,
  hue = DEFAULT_HUE,
  size = DEFAULT_CELL,
  duration = DEFAULT_DURATION_S,
}: PerspectiveGridProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const cell = Math.max(MIN_CELL, size);

  useEffect(() => {
    const host = hostRef.current;
    const lines = linesRef.current;
    if (!host || !lines) {
      return;
    }
    if (shouldReduceMotion) {
      return;
    }
    const run = runOf(lines, cell, duration);
    return runWhileShowing(host, [run]);
  }, [cell, duration, shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={{ ...EYE, color: hue }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        className
      )}
    >
      <div
        style={FLOOR}
        className='absolute -inset-x-3/4 bottom-0 origin-bottom [mask-image:linear-gradient(to_top,black_12%,transparent_92%)]'
      >
        <div
          ref={linesRef}
          style={linesOf(cell)}
          className='absolute inset-x-0 bottom-0'
        />
      </div>
    </div>
  );
}

export default function Background09() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='A floor that runs to the horizon'
      background={<PerspectiveGrid hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
