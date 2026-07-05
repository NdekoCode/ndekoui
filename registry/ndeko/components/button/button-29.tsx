'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  MinusIcon,
  PlusIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeXIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MIN_VOLUME = 0;
const MAX_VOLUME = 6;
const INITIAL_VOLUME = 3;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function volumeGlyphOf(volume: number) {
  if (volume === MIN_VOLUME) {
    return { key: 'muted', icon: <VolumeXIcon className='opacity-60' /> };
  }
  if (volume < 3) {
    return { key: 'low', icon: <VolumeIcon className='opacity-60' /> };
  }
  if (volume < 5) {
    return { key: 'medium', icon: <Volume1Icon className='opacity-60' /> };
  }
  return { key: 'high', icon: <Volume2Icon className='opacity-60' /> };
}

export default function Button29() {
  const labelId = useId();
  const [volume, setVolume] = useState(INITIAL_VOLUME);
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = volumeGlyphOf(volume);
  const isMuted = volume === MIN_VOLUME;
  const isAtMax = volume === MAX_VOLUME;

  function decreaseVolume() {
    setVolume((current) => {
      const lower = current - 1;
      return Math.max(MIN_VOLUME, lower);
    });
  }

  function increaseVolume() {
    setVolume((current) => {
      const higher = current + 1;
      return Math.min(MAX_VOLUME, higher);
    });
  }

  return (
    <div
      className='inline-flex items-center'
      role='group'
      aria-labelledby={labelId}
    >
      <span id={labelId} className='sr-only'>
        Volume control
      </span>
      <Button
        variant='outline'
        size='icon'
        aria-label='Decrease volume'
        onClick={decreaseVolume}
        disabled={isMuted}
        focusableWhenDisabled
      >
        <MinusIcon />
      </Button>
      <div
        className='flex items-center gap-2 px-3 text-[13px] font-medium tabular-nums'
        aria-live='polite'
      >
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={glyph.key}
              className='flex'
              variants={iconVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {glyph.icon}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className='flex' aria-hidden='true'>
          <MotionNumber value={volume} />
        </span>
        <span className='sr-only'>Current volume is {volume}</span>
      </div>
      <Button
        variant='outline'
        size='icon'
        aria-label='Increase volume'
        onClick={increaseVolume}
        disabled={isAtMax}
        focusableWhenDisabled
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
