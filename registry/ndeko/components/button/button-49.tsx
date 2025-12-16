'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function toggleLabelOf(isExpanded: boolean) {
  if (isExpanded) {
    return 'Show less';
  }
  return 'Show more';
}

export default function Button49() {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const label = toggleLabelOf(isExpanded);

  function toggleExpanded() {
    setIsExpanded((current) => !current);
  }

  return (
    <Button
      variant='ghost'
      className='gap-1'
      onClick={toggleExpanded}
      aria-expanded={isExpanded}
    >
      <AnimatedSize axis='width' as='span' contentClassName='relative flex'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={label}
            className='flex'
            variants={labelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
      <ChevronDownIcon className='-me-1 transition-[rotate] duration-200 ease-(--ease-out-strong) group-aria-expanded/button:rotate-180' />
    </Button>
  );
}
