'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const EXIT_TRANSITION: Transition = { duration: 0.1, ease: [0.2, 0, 0, 1] };

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT_TRANSITION },
};

const SURFACE = [
  'm-0 rounded-md transition-[box-shadow,background-color] duration-150 ease-(--ease-out-strong)',
  'has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background',
].join(' ');

const OPEN_SURFACE = [
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] dark:ring-foreground/15',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25 has-focus-visible:ring-offset-0',
].join(' ');

const INPUT =
  'h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/75 md:text-[13px] [&::-webkit-search-cancel-button]:appearance-none';

function surfaceClassOf(isOpen: boolean) {
  if (isOpen) {
    return cn(SURFACE, OPEN_SURFACE);
  }
  return SURFACE;
}

type ExpandableSearchProps = {
  className?: string;
  fieldClassName?: string;
};

function ExpandableSearch({
  className,
  fieldClassName,
}: ExpandableSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);
  const isClosed = !isOpen;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      return;
    }
    if (shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [isOpen]);

  function openSearch() {
    setIsOpen(true);
  }

  function updateQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    shouldRestoreFocus.current = true;
    setQuery('');
    setIsOpen(false);
  }

  function closeWhenEmpty() {
    const isEmpty = query.trim() === '';
    if (isEmpty) {
      setIsOpen(false);
    }
  }

  return (
    <AnimatedSize
      axis='width'
      role='search'
      className={cn(surfaceClassOf(isOpen), className)}
      contentClassName='relative flex p-0'
    >
      <AnimatePresence mode='popLayout' initial={false}>
        {isClosed && (
          <motion.div
            key='closed'
            className='flex'
            variants={FADE_VARIANTS}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <Button
              ref={buttonRef}
              variant='ghost'
              size='icon'
              aria-label='Open search'
              onClick={openSearch}
              className='text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0'
            >
              <SearchIcon />
            </Button>
          </motion.div>
        )}
        {isOpen && (
          <motion.div
            key='open'
            className={cn(
              'flex h-8 w-56 items-center gap-2 ps-2 pe-2.5',
              fieldClassName
            )}
            variants={FADE_VARIANTS}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <SearchIcon className='text-muted-foreground/80 size-4 shrink-0' />
            <input
              ref={inputRef}
              type='search'
              value={query}
              onChange={updateQuery}
              onKeyDown={closeOnEscape}
              onBlur={closeWhenEmpty}
              placeholder='Search…'
              aria-label='Search'
              className={INPUT}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSize>
  );
}

export { ExpandableSearch };
