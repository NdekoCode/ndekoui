import type { Transition, Variants } from 'motion/react';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * The spring AnimatedSize resizes with. It starts from rest, so the fade leads and the freed space
 * closes after it at the pace the surrounding container follows, instead of snapping shut.
 */
const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const ARRIVE: Transition = {
  ...SIZE_SPRING,
  opacity: { duration: 0.2, ease: EASE_OUT_STRONG },
};

const LEAVE: Transition = {
  ...SIZE_SPRING,
  opacity: { duration: 0.12, ease: EASE_OUT_STRONG },
};

const ARRIVE_FADE: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const LEAVE_FADE: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

/** A row whose spacing sits inside it: only its height and opacity change. */
const ROW_VARIANTS: Variants = {
  shown: { height: 'auto', opacity: 1, transition: ARRIVE },
  hidden: { height: 0, opacity: 0, transition: LEAVE },
};

/** A padded surface dismissed for good: its padding closes with its height. */
const SURFACE_VARIANTS: Variants = {
  shown: { height: 'auto', opacity: 1, transition: ARRIVE },
  hidden: {
    height: 0,
    opacity: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: LEAVE,
  },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1, transition: ARRIVE_FADE },
  hidden: { opacity: 0, transition: LEAVE_FADE },
};

export function rowCollapseOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

export function surfaceCollapseOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SURFACE_VARIANTS;
}
