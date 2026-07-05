'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WordRotate } from '@/components/core/word-rotate';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const CITIES = ['Lisbon', 'Nairobi', 'Osaka', 'Toronto'];

const SWAP_EASE: [number, number, number, number] = [0.2, 0, 0, 1];

const SWAP = { duration: 0.15, ease: SWAP_EASE };

const ICON_HIDDEN = { opacity: 0, scale: 0.6, filter: 'blur(2px)' };

const ICON_SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' };

const ICON_FADED = { opacity: 0 };

const ICON_VISIBLE = { opacity: 1 };

function hiddenIconOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ICON_FADED;
  }
  return ICON_HIDDEN;
}

function shownIconOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ICON_VISIBLE;
  }
  return ICON_SHOWN;
}

function ControlIcon({ isPaused }: { isPaused: boolean }) {
  if (isPaused) {
    return <PlayIcon />;
  }
  return <PauseIcon />;
}

export function WordRotatePause() {
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hidden = hiddenIconOf(shouldReduceMotion);

  return (
    <div className='flex items-center gap-3'>
      <p className='text-foreground text-lg font-medium'>
        Shipping from <WordRotate words={CITIES} paused={isPaused} />
      </p>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label='Pause the city names'
        aria-pressed={isPaused}
        onClick={() => setIsPaused((current) => !current)}
      >
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={String(isPaused)}
            initial={hidden}
            animate={shownIconOf(shouldReduceMotion)}
            exit={hidden}
            transition={SWAP}
            className='flex'
          >
            <ControlIcon isPaused={isPaused} />
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
}
