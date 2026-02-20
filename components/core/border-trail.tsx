'use client';
import { cn } from '@/lib/utils';
import { motion, Transition, useReducedMotion } from 'motion/react';

export type BorderTrailProps = {
  className?: string;
  size?: number;
  transition?: Transition;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
};

const STILL_TRAIL = {
  offsetDistance: '0%',
};

const MOVING_TRAIL = {
  offsetDistance: ['0%', '100%'],
};

const INSTANT: Transition = {
  duration: 0,
};

const DEFAULT_TRANSITION: Transition = {
  repeat: Infinity,
  duration: 5,
  ease: 'linear',
};

function trailAnimationOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return STILL_TRAIL;
  }
  return MOVING_TRAIL;
}

function trailTransitionOf(
  prefersReducedMotion: boolean | null,
  transition?: Transition
) {
  if (prefersReducedMotion) {
    return INSTANT;
  }
  return transition || DEFAULT_TRANSITION;
}

export function BorderTrail({
  className,
  size = 60,
  transition,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-image:linear-gradient(transparent,transparent),linear-gradient(black,black)] [mask-composite:intersect] [mask-clip:padding-box,border-box]'>
      <motion.div
        className={cn('bg-muted-foreground absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={trailAnimationOf(prefersReducedMotion)}
        transition={trailTransitionOf(prefersReducedMotion, transition)}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
