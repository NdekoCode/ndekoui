'use client';

import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { useState } from 'react';

export function stepOf(progress: number, steps: number, finishAt: number) {
  const share = progress / finishAt;
  const reached = Math.floor(share * steps + 0.0001);
  return Math.min(steps, Math.max(0, reached));
}

/**
 * A chapter's progress changes many times a second, and what it draws changes a few times. This
 * reads the progress as a whole number of steps, so a piece renders only when it reaches the next
 * one. The last 10 to 30 per cent of a chapter is left for its picture to hold.
 */
export function useSteps(
  progress: MotionValue<number>,
  steps: number,
  finishAt = 0.9
) {
  const [step, setStep] = useState(0);

  useMotionValueEvent(progress, 'change', (latest) => {
    setStep(stepOf(latest, steps, finishAt));
  });

  return step;
}
