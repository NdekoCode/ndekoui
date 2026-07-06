'use client';

import { motion, type MotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

/** Enough to read as a screen leaning back; with the scale, its near edge never gets wider than the page. */
const TILT_DEGREES = 16;

const TILT_SCALE = 0.9;

const FLAT = { rotateX: 0, scale: 1 };

type Tilt = {
  rotateX: MotionValue<number>;
  scale: MotionValue<number>;
};

function styleOf(shouldReduceMotion: boolean, tilt: Tilt) {
  if (shouldReduceMotion) {
    return FLAT;
  }
  return tilt;
}

type TiltFrameProps = {
  /** From 0 at the top of the hero to 1 once the page scrolled past the stretch that flattens it. */
  progress: MotionValue<number>;
  children: ReactNode;
};

/**
 * Holds the product view tilted back in 3D and lays it flat as the progress runs. The values are
 * written to the element by the animation library, so a scroll never renders the view again.
 */
export function TiltFrame({ progress, children }: TiltFrameProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rotateX = useTransform(progress, [0, 1], [TILT_DEGREES, 0]);
  const scale = useTransform(progress, [0, 1], [TILT_SCALE, 1]);
  const tilt: Tilt = { rotateX, scale };
  const style = styleOf(shouldReduceMotion, tilt);

  return (
    <div className='[perspective:1600px]'>
      <motion.div style={style} className='origin-top'>
        {children}
      </motion.div>
    </div>
  );
}
