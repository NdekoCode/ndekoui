'use client';

import {
  type MotionProps,
  type Transition,
  useReducedMotion,
} from 'motion/react';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const HEIGHT_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

export const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

/** Rows that join or leave a list open and close their own height, so what follows slides. */
export function useHeightPresence() {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}
