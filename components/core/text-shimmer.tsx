'use client';
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

const SWEEP = {
  backgroundPosition: '0% center',
};

function sweepOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return undefined;
  }
  return SWEEP;
}

function TextShimmerComponent({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion[
    Component as keyof typeof motion
  ] as typeof motion.p;
  const prefersReducedMotion = useReducedMotion();

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:var(--muted-foreground)] [--base-gradient-color:var(--foreground)]',
        '[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,transparent_calc(50%-var(--spread)),var(--base-gradient-color),transparent_calc(50%+var(--spread)))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={sweepOf(prefersReducedMotion)}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
