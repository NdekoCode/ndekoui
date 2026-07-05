'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

const REMOVE_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const REMOVE_VARIANTS: Variants = {
  shown: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
};

function removeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return REMOVE_VARIANTS;
}

export default function Badge12() {
  const [isShown, setIsShown] = useState(true);
  const shouldReduceMotion = usePrefersReducedMotion();
  const removeVariants = removeVariantsOf(shouldReduceMotion);

  function remove() {
    setIsShown(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.span
          key='badge'
          className='inline-flex'
          variants={removeVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={REMOVE_TRANSITION}
        >
          <Badge className='gap-0'>
            Design
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-primary-ink/60 hover:text-primary-ink -me-1.5 size-5 rounded-[inherit] hover:bg-transparent'
              aria-label='Remove Design'
              onClick={remove}
            >
              <XIcon className='size-3' />
            </Button>
          </Badge>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
