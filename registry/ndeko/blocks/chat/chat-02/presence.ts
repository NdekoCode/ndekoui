import type { MotionProps, Transition } from 'motion/react';

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

const SETTLE_PRESENCE: PresenceProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: EXIT },
  transition: ENTER,
};

const RISE_PRESENCE: PresenceProps = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

export const LAYOUT_SPRING: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

export const INSTANT: Transition = { duration: 0 };

export function settlePresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return SETTLE_PRESENCE;
}

export function risePresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return RISE_PRESENCE;
}

export function layoutTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LAYOUT_SPRING;
}
