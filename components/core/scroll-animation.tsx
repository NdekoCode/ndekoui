'use client';
import {
  motion,
  type MotionValue,
  type Transition,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import { type ReactNode, type RefObject, useRef } from 'react';
import { cn } from '@/lib/utils';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

export type ScrollAnimationPreset = 'fade-up' | 'scale-in' | 'clip-reveal';

type Preset = {
  variants: Variants;
  duration: number;
};

const PRESETS: Record<ScrollAnimationPreset, Preset> = {
  'fade-up': {
    variants: {
      hidden: { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0 },
    },
    duration: 0.5,
  },
  'scale-in': {
    variants: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1 },
    },
    duration: 0.5,
  },
  'clip-reveal': {
    variants: {
      hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
      visible: { clipPath: 'inset(0% 0% 0% 0%)' },
    },
    duration: 0.7,
  },
};

function revealStateOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'visible';
  }
  return 'hidden';
}

// Under reduced motion both states are the final one, so the element is written in place on
// mount instead of keeping the hidden styles rendered on the server.
function variantsOf(
  preset: ScrollAnimationPreset,
  prefersReducedMotion: boolean | null
): Variants {
  const { variants } = PRESETS[preset];
  if (prefersReducedMotion) {
    return { hidden: variants.visible, visible: variants.visible };
  }
  return variants;
}

export type ScrollAnimationProps = {
  children: ReactNode;
  preset?: ScrollAnimationPreset;
  delay?: number;
  amount?: number;
  className?: string;
  containerRef?: RefObject<HTMLElement | null>;
};

export function ScrollAnimation({
  children,
  preset = 'fade-up',
  delay = 0,
  amount = 0.3,
  className,
  containerRef,
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { root: containerRef, once: true, amount });
  const revealState = revealStateOf(isInView);
  const variants = variantsOf(preset, prefersReducedMotion);
  const transition: Transition = {
    duration: PRESETS[preset].duration,
    ease: EASE_OUT_STRONG,
    delay,
  };

  return (
    <motion.div
      ref={ref}
      initial='hidden'
      animate={revealState}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function layerOffsetOf(
  prefersReducedMotion: boolean | null,
  offset: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return 0;
  }
  return offset;
}

export type ScrollParallaxProps = {
  children: ReactNode;
  strength?: number;
  className?: string;
  layerClassName?: string;
  containerRef?: RefObject<HTMLElement | null>;
};

export function ScrollParallax({
  children,
  strength = 40,
  className,
  layerClassName,
  containerRef,
}: ScrollParallaxProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: frameRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });
  const offset = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  const reach = Math.abs(strength);
  const bleed = -reach;
  const layerOffset = layerOffsetOf(prefersReducedMotion, offset);

  return (
    <div ref={frameRef} className={cn('relative overflow-clip', className)}>
      <motion.div
        style={{
          y: layerOffset,
          top: bleed,
          bottom: bleed,
        }}
        className={cn('absolute inset-x-0', layerClassName)}
      >
        {children}
      </motion.div>
    </div>
  );
}
