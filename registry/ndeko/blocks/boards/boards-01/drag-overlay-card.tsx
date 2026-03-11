'use client';

import {
  motion,
  type MotionValue,
  type Transition,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';

import { TaskCardBody } from './card-parts';
import type { Task } from './data';

const VELOCITY_RANGE = [-1400, 0, 1400];

const TILT_RANGE = [-5, 0, 5];

const TILT_SPRING = { stiffness: 380, damping: 26, mass: 0.6 };

const LIFT: Transition = { type: 'spring', bounce: 0, duration: 0.25 };

const INSTANT: Transition = { duration: 0 };

function liftOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LIFT;
}

function liftScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 1.02;
}

type OverlayCardProps = {
  task: Task;
  dragX: MotionValue<number>;
};

/** The card under the pointer: it leans with the speed of the drag and settles on a spring when the pointer slows. */
export function OverlayCard({ task, dragX }: OverlayCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const velocity = useVelocity(dragX);
  const tiltTarget = useTransform(velocity, VELOCITY_RANGE, TILT_RANGE, {
    clamp: true,
  });
  const tilt = useSpring(tiltTarget, TILT_SPRING);
  const noTilt = useTransform(tilt, () => 0);
  let rotate = tilt;
  if (shouldReduceMotion) {
    rotate = noTilt;
  }

  return (
    <motion.div
      style={{ rotate }}
      initial={{ scale: 1 }}
      animate={{ scale: liftScaleOf(shouldReduceMotion) }}
      transition={liftOf(shouldReduceMotion)}
      className='surface-raised cursor-grabbing rounded-lg'
    >
      <TaskCardBody task={task} />
    </motion.div>
  );
}
