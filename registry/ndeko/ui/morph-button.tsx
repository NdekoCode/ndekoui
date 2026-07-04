'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';

import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

export type MorphState = 'idle' | 'busy' | 'done';

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

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

type Glyph = { key: string; icon: React.ReactNode };

function glyphOf(state: MorphState, idleIcon: React.ReactNode): Glyph | null {
  if (state === 'busy') {
    return {
      key: 'busy',
      icon: <LoaderCircleIcon className='animate-spin' />,
    };
  }
  if (state === 'done') {
    return { key: 'done', icon: <CheckIcon /> };
  }
  if (idleIcon) {
    return { key: 'idle', icon: idleIcon };
  }
  return null;
}

/** While busy or done, the pill keeps its full colour: it is working, not unavailable. */
function busyClassOf(isBusy: boolean) {
  if (isBusy) {
    return 'data-disabled:opacity-100 disabled:opacity-100';
  }
  return undefined;
}

type MorphButtonProps = Omit<ButtonProps, 'children'> & {
  state: MorphState;
  labels: Record<MorphState, string>;
  idleIcon?: React.ReactNode;
};

export function MorphButton({
  state,
  labels,
  idleIcon,
  disabled,
  className,
  ...props
}: MorphButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = variantsOf(shouldReduceMotion);
  const label = labels[state];
  const glyph = glyphOf(state, idleIcon);
  const isBusy = state !== 'idle';
  const isDisabled = disabled || isBusy;

  return (
    <Button
      disabled={isDisabled}
      focusableWhenDisabled
      className={cn(busyClassOf(isBusy), className)}
      {...props}
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
