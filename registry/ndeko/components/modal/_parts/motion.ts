import type { Transition, Variants } from 'motion/react';

export const SWAP_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const MORPH_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

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

const FADE_SWAP: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const ROW_PRESENCE: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: PRESENCE_OUT,
  },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: PRESENCE_IN,
    transitionEnd: { overflow: 'visible' },
  },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

const CHIP_PRESENCE: Variants = {
  hidden: { opacity: 0, scale: 0.9, transition: PRESENCE_OUT },
  shown: { opacity: 1, scale: 1, transition: PRESENCE_IN },
};

export type SwapKind = 'icon' | 'label';

export function swapVariantsOf(
  shouldReduceMotion: boolean | null,
  kind: SwapKind = 'icon'
) {
  if (shouldReduceMotion) {
    return FADE_SWAP;
  }
  if (kind === 'label') {
    return LABEL_SWAP;
  }
  return ICON_SWAP;
}

/** A row added to or removed from a list: its height opens or collapses, so the rows after it slide. */
export function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

export function chipVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return CHIP_PRESENCE;
}

export function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH_SPRING;
}
