import type { Transition, Variants } from 'motion/react';

export const SWAP_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const TRAVEL_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const ENTER: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const LEAVE: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const ICON_SWAP: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const LABEL_SWAP: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const HEIGHT_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden', transition: LEAVE },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: ENTER,
    transitionEnd: { overflow: 'visible' },
  },
};

const FADE_PRESENCE: Variants = {
  hidden: { opacity: 0, transition: LEAVE },
  shown: { opacity: 1, transition: ENTER },
};

const CHIP_PRESENCE: Variants = {
  hidden: { opacity: 0, scale: 0.9, transition: LEAVE },
  shown: { opacity: 1, scale: 1, transition: ENTER },
};

export type SwapKind = 'icon' | 'label';

export function swapVariantsOf(
  shouldReduceMotion: boolean | null,
  kind: SwapKind = 'icon'
) {
  if (shouldReduceMotion) {
    return FADE;
  }
  if (kind === 'label') {
    return LABEL_SWAP;
  }
  return ICON_SWAP;
}

/** A row that joins or leaves a list: its height opens or collapses, so what follows slides instead of jumping. */
export function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

export function chipVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return CHIP_PRESENCE;
}

export function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL_SPRING;
}
