'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/core/disclosure';
import { CompassIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const contentVariants = {
  collapsed: { opacity: 0, y: 0 },
  expanded: { opacity: 1, y: 0 },
};

const transition = {
  type: 'spring' as const,
  stiffness: 26.7,
  damping: 4.1,
  mass: 0.2,
};

function tileVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      collapsed: { scale: 1, filter: 'blur(0px)' },
      expanded: { scale: 1, filter: 'blur(3px)' },
    };
  }
  return {
    collapsed: { scale: 1, filter: 'blur(0px)' },
    expanded: { scale: 1.1, filter: 'blur(3px)' },
  };
}

function variantOf(isOpen: boolean) {
  if (isOpen) {
    return 'expanded';
  }
  return 'collapsed';
}

export function DisclosureCard() {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tileVariants = tileVariantsOf(shouldReduceMotion);

  return (
    <div className='relative h-[350px] w-[290px] overflow-hidden rounded-xl'>
      <div onClick={() => setIsOpen(!isOpen)}>
        <motion.div
          role='img'
          aria-label='Ridge trail at sunrise'
          className='bg-success/10 pointer-events-none flex h-[350px] w-full items-start gap-3 p-5 select-none'
          animate={variantOf(isOpen)}
          variants={tileVariants}
          transition={transition}
        >
          <span className='gem-plate grid size-9 place-items-center rounded-lg [--gem:var(--success)]'>
            <CompassIcon className='size-4' />
          </span>
          <span className='flex flex-col'>
            <span className='text-foreground text-sm font-medium'>
              Vell ridge
            </span>
            <span className='text-muted-foreground text-xs'>
              2,000 m, day two
            </span>
          </span>
        </motion.div>
      </div>
      <Disclosure
        onOpenChange={setIsOpen}
        open={isOpen}
        className='surface-raised absolute right-0 bottom-0 left-0 rounded-xl px-4 pt-2'
        variants={contentVariants}
        transition={transition}
      >
        <DisclosureTrigger>
          <button
            className='text-foreground w-full pb-2 text-left text-sm font-medium'
            type='button'
            onClick={() => setIsOpen(!isOpen)}
          >
            Fernhill Outdoor Club
          </button>
        </DisclosureTrigger>
        <DisclosureContent>
          <div className='text-muted-foreground flex flex-col pb-4 text-[13px]'>
            <p className='text-foreground'>Spring trail series</p>
            <p className='line-clamp-3'>
              Twelve runners, three days on the Vell ridge at 2,000 metres. The
              series follows the club through fog, scree and one very long
              descent, with pacing notes from the coaches after each stage.
            </p>
            <Button variant='outline' size='sm' className='mt-3 w-full'>
              Read the trail guide
            </Button>
          </div>
        </DisclosureContent>
      </Disclosure>
    </div>
  );
}
