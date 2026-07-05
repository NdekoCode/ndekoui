'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  LoaderCircleIcon,
  MicIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const SEARCH_DELAY_MS = 500;

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

function searchGlyphOf(isSearching: boolean) {
  if (isSearching) {
    return {
      key: 'searching',
      icon: <LoaderCircleIcon className='size-4 animate-spin' />,
    };
  }
  return { key: 'idle', icon: <SearchIcon className='size-4' /> };
}

export default function Input27() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const glyph = searchGlyphOf(isSearching);

  useEffect(() => {
    if (!isSearching) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsSearching(false);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [query, isSearching]);

  function changeQuery(event: ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.currentTarget.value;
    setQuery(nextQuery);
    setIsSearching(nextQuery !== '');
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Search</FieldLabel>
      <div className='relative'>
        <Input
          className='peer ps-8 pe-8'
          type='search'
          placeholder='Search messages'
          value={query}
          onChange={changeQuery}
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
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
        </span>
        <span className='sr-only' role='status'>
          {isSearching && 'Searching'}
        </span>
        <button
          type='button'
          className={FIELD_BUTTON}
          aria-label='Search by voice'
        >
          <MicIcon className='size-4' />
        </button>
      </div>
    </Field>
  );
}
