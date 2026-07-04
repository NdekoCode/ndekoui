import type { MotionProps, Transition } from 'motion/react';

export const EASE_OUT_STRONG: [number, number, number, number] = [
  0.23, 1, 0.32, 1,
];

export const EASE_IN_OUT_STRONG: [number, number, number, number] = [
  0.77, 0, 0.175, 1,
];

export const SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

export const SLOW_SPRING: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.5,
};

export const INSTANT: Transition = { duration: 0 };

export const FADE: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

export function springOf(shouldReduceMotion: boolean | null): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

export function slowSpringOf(shouldReduceMotion: boolean | null): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SLOW_SPRING;
}

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

const ROW_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const RISE_PRESENCE: PresenceProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6, transition: EXIT },
  transition: SPRING,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

/** A row added to or removed from a list: its height and opacity change, its spacing sits inside it. */
export function rowPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return ROW_PRESENCE;
}

export function risePresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return RISE_PRESENCE;
}

export function fadePresence() {
  return FADE_PRESENCE;
}
