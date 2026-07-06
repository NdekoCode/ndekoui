'use client';

import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, FADE } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const SWEEP_MS = 1100;

type ShimmerBarProps = {
  /** False off screen: the band stops where it is. */
  isActive: boolean;
  className?: string;
};

export function ShimmerBar({ isActive, className }: ShimmerBarProps) {
  const bandRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const band = bandRef.current;
    if (!band || shouldReduceMotion || !isActive) {
      return;
    }
    const sweep = [
      { transform: 'translateX(-100%)' },
      { transform: 'translateX(200%)' },
    ];
    const animation = band.animate(sweep, {
      duration: SWEEP_MS,
      iterations: Infinity,
      easing: 'linear',
    });
    return () => animation.cancel();
  }, [isActive, shouldReduceMotion]);

  return (
    <span
      aria-hidden='true'
      className={cn(
        'bg-foreground/[0.07] relative block h-3 overflow-hidden rounded-full',
        className
      )}
    >
      <span
        ref={bandRef}
        className='via-foreground/10 absolute inset-y-0 start-0 w-1/2 bg-linear-to-r from-transparent to-transparent'
      />
    </span>
  );
}

function landingFrom(isLanding: boolean, shouldReduceMotion: boolean) {
  if (!isLanding) {
    return false;
  }
  if (shouldReduceMotion) {
    return { opacity: 0 };
  }
  return { opacity: 0, scale: 1.04 };
}

const SETTLE = { duration: 0.28, ease: EASE_OUT_STRONG };

function landTransitionOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return SETTLE;
}

type LandedValueProps = {
  /** True for the value that has just arrived: it settles from 1.04. A value that was there already is simply drawn. */
  isLanding: boolean;
  className?: string;
  children: React.ReactNode;
};

export function LandedValue({
  isLanding,
  className,
  children,
}: LandedValueProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const initial = landingFrom(isLanding, shouldReduceMotion);
  const transition = landTransitionOf(shouldReduceMotion);

  return (
    <motion.span
      initial={initial}
      animate={{ opacity: 1, scale: 1 }}
      transition={transition}
      className={cn('inline-block origin-left', className)}
    >
      {children}
    </motion.span>
  );
}
