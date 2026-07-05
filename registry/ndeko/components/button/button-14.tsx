'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SAVE_DURATION_MS = 1000;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  shown: { opacity: 1, filter: 'blur(0px)' },
  hidden: { opacity: 0, filter: 'blur(2px)' },
};

const SPINNER_VARIANTS: Variants = {
  shown: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function spinnerVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SPINNER_VARIANTS;
}

function labelStateOf(isSaving: boolean) {
  if (isSaving) {
    return 'hidden';
  }
  return 'shown';
}

export default function Button14() {
  const [isSaving, setIsSaving] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const spinnerVariants = spinnerVariantsOf(shouldReduceMotion);

  useEffect(() => {
    if (!isSaving) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsSaving(false);
    }, SAVE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isSaving]);

  function startSaving() {
    setIsSaving(true);
  }

  return (
    <Button
      onClick={startSaving}
      disabled={isSaving}
      focusableWhenDisabled
      className='data-disabled:opacity-100'
    >
      <motion.span
        variants={labelVariants}
        initial={false}
        animate={labelStateOf(isSaving)}
        transition={SWAP_TRANSITION}
      >
        Save changes
      </motion.span>
      <AnimatePresence initial={false}>
        {isSaving && (
          <motion.span
            key='spinner'
            className='absolute inset-0 flex items-center justify-center'
            variants={spinnerVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            transition={SWAP_TRANSITION}
          >
            <LoaderIcon className='animate-spin' />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
