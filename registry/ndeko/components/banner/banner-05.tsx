'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ArrowRightIcon, EclipseIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const COLLAPSE_TRANSITION: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };
const DISMISS_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const COLLAPSE_VARIANTS: Variants = {
  shown: { height: 'auto', opacity: 1 },
  hidden: { height: 0, opacity: 0, transition: DISMISS_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1 },
  hidden: { opacity: 0, transition: DISMISS_TRANSITION },
};

function collapseVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return COLLAPSE_VARIANTS;
}

export default function Banner05() {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const collapseVariants = collapseVariantsOf(shouldReduceMotion);

  function dismiss() {
    setIsVisible(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key='banner'
          className='bg-primary/[0.06] hairline-ring ring-primary/15 dark:bg-primary/10 @container w-full overflow-hidden rounded-xl'
          variants={collapseVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={COLLAPSE_TRANSITION}
        >
          <div className='flex gap-2 px-4 py-3'>
            <div className='flex grow gap-3'>
              <StatusOrb
                tone='brand'
                size='sm'
                glyph={<EclipseIcon strokeWidth={2.25} />}
              />
              <div className='flex grow flex-col justify-between gap-2 py-0.5 @xl:flex-row'>
                <p className='text-[13px] leading-5'>
                  Saved views are here: keep your filters and reopen them in one
                  click.
                </p>
                <a
                  href='#'
                  className={cn(
                    'group text-primary-ink inline-flex w-fit items-center gap-1 rounded-sm text-[13px] leading-5 font-medium whitespace-nowrap',
                    FOCUS_RING
                  )}
                >
                  Learn more
                  <ArrowRightIcon className='size-4 opacity-60 transition-transform group-hover:translate-x-0.5' />
                </a>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon-sm'
              className='-my-0.5 -me-2'
              aria-label='Dismiss banner'
              onClick={dismiss}
            >
              <XIcon className='opacity-60' />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
