'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

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

export default function Badge13() {
  const [isShown, setIsShown] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const removeVariants = removeVariantsOf(shouldReduceMotion);

  function remove() {
    setIsShown(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.span
          key='tag'
          className='inline-flex'
          variants={removeVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={REMOVE_TRANSITION}
        >
          <Badge variant='outline' className='h-7 gap-0 ps-2 pe-0'>
            Research
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-muted-foreground hover:text-foreground rounded-[inherit]'
              aria-label='Remove Research tag'
              onClick={remove}
            >
              <XIcon className='size-3.5' />
            </Button>
          </Badge>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
