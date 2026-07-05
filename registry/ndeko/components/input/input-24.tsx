'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useRef, useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CircleXIcon } from '@/registry/ndeko/lib/icons';
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

export default function Input24() {
  const [projectName, setProjectName] = useState('Q3 launch plan');
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const hasValue = projectName !== '';

  function changeProjectName(event: ChangeEvent<HTMLInputElement>) {
    setProjectName(event.currentTarget.value);
  }

  function clearProjectName() {
    setProjectName('');
    inputRef.current?.focus();
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Project name</FieldLabel>
      <div className='relative'>
        <Input
          ref={inputRef}
          className='pe-8'
          placeholder='Name your project'
          value={projectName}
          onChange={changeProjectName}
        />
        <AnimatePresence initial={false}>
          {hasValue && (
            <motion.button
              key='clear'
              type='button'
              className={FIELD_BUTTON}
              onClick={clearProjectName}
              aria-label='Clear project name'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <CircleXIcon className='size-4' />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </Field>
  );
}
