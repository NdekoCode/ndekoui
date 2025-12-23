'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { EclipseIcon, XIcon } from '@/registry/ndeko/lib/icons';
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

export default function Banner08() {
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
          <div className='flex gap-2 px-4 py-3 @xl:items-center @xl:py-2'>
            <div className='flex grow gap-3 @xl:items-center @xl:justify-center'>
              <StatusOrb
                tone='brand'
                size='sm'
                glyph={<EclipseIcon strokeWidth={2.25} />}
              />
              <div className='flex flex-col justify-between gap-3 @xl:flex-row @xl:items-center'>
                <p className='py-0.5 text-[13px] leading-5'>
                  Saved views are live. Keep your filters and reopen them in one
                  click.
                </p>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm'>Learn more</Button>
                </div>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon-sm'
              className='-my-0.5 -me-2 @xl:my-0'
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
