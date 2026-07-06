'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

type LitCell = {
  column: number;
  row: number;
  durationMs: number;
  delayMs: number;
};

const CELL_REM = 4;

const LIT_CELLS: LitCell[] = [
  { column: 2, row: 1, durationMs: 7600, delayMs: 600 },
  { column: 5, row: 3, durationMs: 9200, delayMs: 2800 },
  { column: 8, row: 1, durationMs: 8400, delayMs: 4200 },
  { column: 10, row: 4, durationMs: 9800, delayMs: 1200 },
  { column: 3, row: 4, durationMs: 8800, delayMs: 5600 },
  { column: 7, row: 2, durationMs: 7200, delayMs: 3400 },
  { column: 12, row: 2, durationMs: 9000, delayMs: 800 },
];

const FADE_FRAMES: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1, offset: 0.16 },
  { opacity: 0 },
];

const GRID_LINES =
  'bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:4rem_4rem]';

const FADE_OUT_EDGES =
  '[mask-image:radial-gradient(ellipse_75%_85%_at_50%_35%,black_35%,transparent)]';

function cellStyleOf(cell: LitCell) {
  return {
    left: `${cell.column * CELL_REM}rem`,
    top: `${cell.row * CELL_REM}rem`,
  };
}

export function QuietGrid() {
  const hostRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldReduceMotion) {
      return;
    }
    const cells = Array.from(host.querySelectorAll<HTMLElement>('[data-cell]'));
    const animations = cells.map((cell, index) => {
      const { durationMs, delayMs } = LIT_CELLS[index];
      return cell.animate(FADE_FRAMES, {
        duration: durationMs,
        delay: delayMs,
        iterations: Infinity,
        easing: 'ease-in-out',
      });
    });
    animations.forEach((animation) => animation.pause());

    function onCrossing(entries: IntersectionObserverEntry[]) {
      const isOnScreen = entries.at(-1)?.isIntersecting ?? false;
      for (const animation of animations) {
        if (isOnScreen) {
          animation.play();
        } else {
          animation.pause();
        }
      }
    }

    const observer = new IntersectionObserver(onCrossing);
    observer.observe(host);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      className={`pointer-events-none absolute inset-0 overflow-hidden ${FADE_OUT_EDGES}`}
    >
      <div className={`absolute inset-0 ${GRID_LINES}`} />
      {LIT_CELLS.map((cell) => (
        <span
          key={`${cell.column}-${cell.row}`}
          data-cell=''
          style={cellStyleOf(cell)}
          className='bg-primary/10 absolute size-16 opacity-0'
        />
      ))}
    </div>
  );
}
