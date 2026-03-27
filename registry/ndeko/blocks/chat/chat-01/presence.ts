import type { MotionProps, Transition } from 'motion/react';

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

const ROW_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

export function rowPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return ROW_PRESENCE;
}

export function fadePresence() {
  return FADE_PRESENCE;
}
