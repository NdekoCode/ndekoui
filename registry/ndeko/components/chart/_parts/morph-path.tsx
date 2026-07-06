'use client';

import { motion, type Transition } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const MORPH: Transition = { duration: 0.3, ease: EASE_OUT_STRONG };

/** What is there on mount does not fade in: only a shape that replaced another one does. */
const SWAP_FADE =
  'transition-opacity duration-200 ease-(--ease-out-strong) starting:opacity-0';

function transitionOf(isInstant: boolean) {
  if (isInstant) {
    return INSTANT;
  }
  return MORPH;
}

function swapFadeOf(hasChanged: boolean) {
  if (hasChanged) {
    return SWAP_FADE;
  }
  return undefined;
}

/** False until the value changes for the first time. */
function useHasChanged(value: string) {
  const [firstValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  const isFirstChange = value !== firstValue && !hasChanged;
  if (isFirstChange) {
    setHasChanged(true);
  }
  return hasChanged;
}

type MorphPathProps = {
  d: string;
  /** True while the shape follows a hand: it is redrawn where the hand is, with no glide behind it. */
  isInstant?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** For a shape that is its own hit target. */
  onPointerEnter?: () => void;
};

/**
 * A shape that glides to its new outline when the data changes, as long as both outlines have the
 * same number of points. Under reduced motion the new shape replaces the old one with a fade.
 */
export function MorphPath({
  d,
  isInstant = false,
  className,
  style,
  onPointerEnter,
}: MorphPathProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasChanged = useHasChanged(d);

  if (shouldReduceMotion) {
    return (
      <path
        key={d}
        d={d}
        vectorEffect='non-scaling-stroke'
        className={cn(swapFadeOf(hasChanged), className)}
        style={style}
        onPointerEnter={onPointerEnter}
      />
    );
  }

  return (
    <motion.path
      initial={false}
      animate={{ d }}
      transition={transitionOf(isInstant)}
      vectorEffect='non-scaling-stroke'
      className={className}
      style={style}
      onPointerEnter={onPointerEnter}
    />
  );
}

/** The stroke of a line: 2px whatever the width of the plot, with round joins and ends. */
export const LINE_STROKE =
  'fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]';
