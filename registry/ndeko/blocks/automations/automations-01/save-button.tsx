'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function labelOf(status: SaveStatus, idleLabel: string) {
  if (status === 'saving') {
    return 'Saving';
  }
  if (status === 'saved') {
    return 'Saved';
  }
  return idleLabel;
}

/** While saving, the pill keeps its full colour: it is working, not unavailable. */
function busyClassOf(isBusy: boolean) {
  if (isBusy) {
    return 'data-disabled:opacity-100 disabled:opacity-100';
  }
  return undefined;
}

function glyphOf(status: SaveStatus) {
  if (status === 'saving') {
    return {
      key: 'saving',
      icon: <LoaderCircleIcon className='animate-spin' />,
    };
  }
  if (status === 'saved') {
    return { key: 'saved', icon: <CheckIcon /> };
  }
  return null;
}

type SaveButtonProps = {
  status: SaveStatus;
  idleLabel: string;
  disabled?: boolean;
  onSave: () => void;
};

/** The label becomes its next state and the pill resizes to it. */
export function SaveButton({
  status,
  idleLabel,
  disabled = false,
  onSave,
}: SaveButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = labelOf(status, idleLabel);
  const glyph = glyphOf(status);
  const isBusy = status !== 'idle';
  const isDisabled = disabled || isBusy;
  const busyClass = busyClassOf(isBusy);

  return (
    <Button
      disabled={isDisabled}
      focusableWhenDisabled
      onClick={onSave}
      className={busyClass}
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-1.5'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {glyph && (
            <motion.span
              key={glyph.key}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              {glyph.icon}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={label}
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
    </Button>
  );
}
