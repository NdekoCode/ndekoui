'use client';

import { useState } from 'react';
import { ProgressiveBlur } from '@/components/core/progressive-blur';
import { motion } from 'motion/react';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

const REVEAL_TRANSITION = { duration: 0.2, ease: EASE_OUT_STRONG };

function revealStateOf(isHover: boolean) {
  if (isHover) {
    return 'visible';
  }
  return 'hidden';
}

export function ProgressiveBlurHover() {
  const [isHover, setIsHover] = useState(false);
  const revealState = revealStateOf(isHover);

  return (
    <div
      className='relative my-4 aspect-square h-[300px] overflow-hidden rounded-xl'
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div
        role='img'
        aria-label='Harbour at dusk by Kofi Boateng: a pier, two boats and a setting sun, in flat shapes.'
        className='bg-success/10 absolute inset-0'
      >
        <div className='bg-success/40 absolute top-16 right-12 size-28 rounded-full' />
        <div className='bg-success/25 absolute bottom-28 left-0 h-10 w-full' />
        <div className='bg-success/35 absolute bottom-0 left-0 h-28 w-full' />
        <div className='bg-success/60 absolute bottom-24 left-10 h-3 w-40 rounded-full' />
        <div className='bg-success/50 absolute bottom-28 left-16 h-6 w-12 rounded-md' />
      </div>
      <ProgressiveBlur
        className='pointer-events-none absolute bottom-0 left-0 h-[75%] w-full'
        blurIntensity={0.5}
        animate={revealState}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={REVEAL_TRANSITION}
      />
      <motion.div
        className='absolute bottom-0 left-0'
        animate={revealState}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={REVEAL_TRANSITION}
      >
        <div className='flex flex-col items-start gap-0 px-5 py-4'>
          <p className='text-foreground text-sm font-medium'>Kofi Boateng</p>
          <span className='text-muted-foreground text-sm'>Harbour at dusk</span>
        </div>
      </motion.div>
    </div>
  );
}
