'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { useRef } from 'react';

import { Safari } from '@/components/core/safari';

import { LivingWall } from './living-wall';

const SCROLL_OFFSET = ['start end', 'start 0.3'] as const;

function RisingFrame({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: [...SCROLL_OFFSET],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);

  return (
    <div ref={frameRef} className='[perspective:1600px]'>
      <motion.div
        style={{ scale, rotateX, y, transformOrigin: 'center top' }}
        className='will-change-transform'
      >
        {children}
      </motion.div>
    </div>
  );
}

function StageWindow() {
  return (
    <Safari
      url='ui.ndekocode.dev/components'
      mode='simple'
      label='The component catalogue, live'
      className='shadow-[0_32px_80px_-32px_rgb(30_27_75/0.35)]'
    >
      <LivingWall className='rounded-none bg-transparent pt-4' />
    </Safari>
  );
}

/** The catalogue in a browser window that straightens and grows as it scrolls into place. */
export function ProductStage() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <StageWindow />;
  }

  return (
    <RisingFrame>
      <StageWindow />
    </RisingFrame>
  );
}
