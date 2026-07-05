'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';

type ReplayButtonProps = {
  isShown: boolean;
  onReplay: () => void;
  label?: string;
};

export function ReplayButton({
  isShown,
  onReplay,
  label = 'Replay the run',
}: ReplayButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = risePresenceOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.span key='replay' className='inline-flex' {...presence}>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onReplay}
            className='text-muted-foreground'
          >
            <RotateCcwIcon />
            {label}
          </Button>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
