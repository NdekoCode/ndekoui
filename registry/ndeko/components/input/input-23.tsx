'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { EyeIcon, EyeOffIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

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

function inputTypeOf(isVisible: boolean) {
  if (isVisible) {
    return 'text';
  }
  return 'password';
}

function visibilityGlyphOf(isVisible: boolean) {
  if (isVisible) {
    return { key: 'hide', icon: <EyeOffIcon className='size-4' /> };
  }
  return { key: 'show', icon: <EyeIcon className='size-4' /> };
}

export default function Input23() {
  const inputId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const glyph = visibilityGlyphOf(isVisible);

  function toggleVisibility() {
    setIsVisible((current) => !current);
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Password</FieldLabel>
      <div className='relative'>
        <Input
          id={inputId}
          className='pe-8'
          type={inputTypeOf(isVisible)}
          placeholder='At least 8 characters'
        />
        <button
          type='button'
          className={FIELD_BUTTON}
          onClick={toggleVisibility}
          aria-label='Show password'
          aria-pressed={isVisible}
          aria-controls={inputId}
        >
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={glyph.key}
              className='flex'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {glyph.icon}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </Field>
  );
}
