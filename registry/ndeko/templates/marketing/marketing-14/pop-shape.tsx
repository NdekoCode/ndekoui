'use client';

import { motion, type Transition, type Variants } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

export type ShapeKind = 'circle' | 'ring' | 'square' | 'pill';

const POP: Transition = { type: 'spring', bounce: 0, duration: 0.5 };

const FADE: Transition = { duration: 0.2 };

const POP_VARIANTS: Variants = {
  hidden: { scale: 0.4, opacity: 0 },
  shown: { scale: 1, opacity: 1 },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

const VIEWPORT = { once: true, margin: '0px 0px -8% 0px' } as const;

const KIND_CLASS: Record<ShapeKind, string> = {
  circle: 'rounded-full',
  ring: 'rounded-full border-[7px] bg-transparent',
  square: 'rounded-2xl',
  pill: 'rounded-full',
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return POP_VARIANTS;
}

function transitionOf(shouldReduceMotion: boolean | null, delay: number) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return { ...POP, delay };
}

function paintOf(kind: ShapeKind, color: string) {
  if (kind === 'ring') {
    return { borderColor: color };
  }
  return { backgroundColor: color };
}

type PopShapeProps = {
  kind: ShapeKind;
  series: SeriesSlot;
  className?: string;
  delay?: number;
};

export function PopShape({
  kind,
  series,
  className,
  delay = 0,
}: PopShapeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const color = seriesColorOf(series);

  return (
    <motion.span
      aria-hidden='true'
      variants={variantsOf(shouldReduceMotion)}
      initial='hidden'
      whileInView='shown'
      viewport={VIEWPORT}
      transition={transitionOf(shouldReduceMotion, delay)}
      style={paintOf(kind, color)}
      className={cn(
        'pointer-events-none absolute opacity-90',
        KIND_CLASS[kind],
        className
      )}
    />
  );
}
