'use client';

import { motion, type Transition, type Variants } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

export type DrawnCheckTone = 'primary' | 'success';

export type DrawnCheckEntrance = 'pop' | 'draw' | 'draw-in-view';

export type DrawnCheckPace = 'quick' | 'calm';

const CHIP =
  'chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full';

const TONE_CLASS: Record<DrawnCheckTone, string> = {
  primary: '[--chip:var(--primary)]',
  success: '[--chip:var(--success)]',
};

const STROKE = {
  d: 'M2.6 6.4 4.9 8.7 9.5 3.6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.9',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const DRAW: Record<DrawnCheckPace, Transition> = {
  quick: { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 },
  calm: { duration: 0.32, ease: EASE_OUT_STRONG, delay: 0.1 },
};

const POP: Transition = { duration: 0.16, ease: EASE_OUT_STRONG };

const LEAVE: Transition = { duration: 0.1 };

const DRAWN = { pathLength: 1 };

const NOT_DRAWN = { pathLength: 0 };

const SHOWN = { opacity: 1, scale: 1 };

const LEFT = { opacity: 0, transition: LEAVE };

const ONCE = { once: true };

const SEEN_STROKE: Record<DrawnCheckPace, Variants> = {
  quick: { waiting: NOT_DRAWN, drawn: { ...DRAWN, transition: DRAW.quick } },
  calm: { waiting: NOT_DRAWN, drawn: { ...DRAWN, transition: DRAW.calm } },
};

const SEEN_STROKE_STILL: Variants = { waiting: DRAWN, drawn: DRAWN };

function strokeStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return DRAWN;
  }
  return NOT_DRAWN;
}

function seenStrokeOf(shouldReduceMotion: boolean, pace: DrawnCheckPace) {
  if (shouldReduceMotion) {
    return SEEN_STROKE_STILL;
  }
  return SEEN_STROKE[pace];
}

function arrivalOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { opacity: 0, scale: 1 };
  }
  return { opacity: 0, scale: 0.7 };
}

type StrokeProps = {
  pace: DrawnCheckPace;
  shouldReduceMotion: boolean;
};

function MountedStroke({ pace, shouldReduceMotion }: StrokeProps) {
  return (
    <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
      <motion.path
        {...STROKE}
        initial={strokeStartOf(shouldReduceMotion)}
        animate={DRAWN}
        transition={DRAW[pace]}
      />
    </svg>
  );
}

/** Takes its cue from the chip, which carries `whileInView`. */
function SeenStroke({ pace, shouldReduceMotion }: StrokeProps) {
  return (
    <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
      <motion.path
        {...STROKE}
        variants={seenStrokeOf(shouldReduceMotion, pace)}
      />
    </svg>
  );
}

export type DrawnCheckProps = {
  tone?: DrawnCheckTone;
  /** Read by screen readers. Leave it out when the row already says it is done or selected. */
  label?: string;
  /**
   * `pop`: the chip grows in, its check draws, and it leaves faster than it came (inside
   * `AnimatePresence`). `draw`: the chip is there at once and only its check draws.
   * `draw-in-view`: the same, the first time the mark is on screen rather than when it mounts, for
   * a list that can be hidden at the moment the mark lands.
   */
  entrance?: DrawnCheckEntrance;
  /** `quick` draws the stroke in 280ms after 80ms, `calm` in 320ms after 100ms. */
  pace?: DrawnCheckPace;
  className?: string;
};

/**
 * A check that draws itself on a small chip. Reduced motion shows it drawn. Inside an
 * `AnimatePresence initial={false}`, a mark present on mount is simply there.
 */
export function DrawnCheck({
  tone = 'primary',
  label,
  entrance = 'pop',
  pace = 'quick',
  className,
}: DrawnCheckProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasLabel = Boolean(label);
  const chipClass = cn(CHIP, TONE_CLASS[tone], className);

  if (entrance === 'draw-in-view') {
    return (
      <motion.span
        aria-hidden={!hasLabel}
        initial='waiting'
        whileInView='drawn'
        viewport={ONCE}
        className={chipClass}
      >
        <SeenStroke pace={pace} shouldReduceMotion={shouldReduceMotion} />
        {hasLabel && <span className='sr-only'>{label}</span>}
      </motion.span>
    );
  }
  if (entrance === 'draw') {
    return (
      <span aria-hidden={!hasLabel} className={chipClass}>
        <MountedStroke pace={pace} shouldReduceMotion={shouldReduceMotion} />
        {hasLabel && <span className='sr-only'>{label}</span>}
      </span>
    );
  }
  return (
    <motion.span
      aria-hidden={!hasLabel}
      initial={arrivalOf(shouldReduceMotion)}
      animate={SHOWN}
      exit={LEFT}
      transition={POP}
      className={chipClass}
    >
      <MountedStroke pace={pace} shouldReduceMotion={shouldReduceMotion} />
      {hasLabel && <span className='sr-only'>{label}</span>}
    </motion.span>
  );
}
