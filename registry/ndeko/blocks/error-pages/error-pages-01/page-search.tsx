'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon, SearchIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG, SPRING } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { SitePage } from './data';
import { markedPartsOf, wordsOf } from './match';

const LIST_SHOWN = { opacity: 1, scale: 1 };

const LIST_HIDDEN = { opacity: 0, scale: 0.97 };

const LIST_FADED = { opacity: 0, scale: 1 };

const LIST_ARRIVE: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

const LIST_LEAVE: Transition = { duration: 0.1, ease: EASE_OUT_STRONG };

const INSTANT: Transition = { duration: 0 };

const KEY_MOTION = 'transition-[scale] duration-150';

function listStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return LIST_FADED;
  }
  return LIST_HIDDEN;
}

function travelOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

function optionIdOf(listId: string, index: number) {
  return `${listId}-${index}`;
}

function activeIdOf(listId: string, activeIndex: number, isShown: boolean) {
  const hasActive = activeIndex >= 0;
  if (!isShown || !hasActive) {
    return undefined;
  }
  return optionIdOf(listId, activeIndex);
}

function MarkedTitle({ title, words }: { title: string; words: string[] }) {
  const parts = markedPartsOf(title, words);

  return (
    <span className='min-w-0 truncate'>
      {parts.map((part) => {
        if (part.isMatch) {
          return (
            <mark
              key={part.key}
              className='bg-primary/15 text-foreground rounded-[3px]'
            >
              {part.text}
            </mark>
          );
        }
        return <span key={part.key}>{part.text}</span>;
      })}
    </span>
  );
}

type PageSearchProps = {
  query: string;
  isOpen: boolean;
  activeIndex: number;
  suggestions: SitePage[];
  pressed: string | null;
  /** While the demonstration plays, the list shows without the focus and a click elsewhere leaves it be. */
  isDemonstrating: boolean;
  onType: (value: string) => void;
  onFocus: () => void;
  onMove: (by: 1 | -1) => void;
  onEscape: () => void;
  onClose: () => void;
};

export function PageSearch({
  query,
  isOpen,
  activeIndex,
  suggestions,
  pressed,
  isDemonstrating,
  onType,
  onFocus,
  onMove,
  onEscape,
  onClose,
}: PageSearchProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();
  const words = wordsOf(query);
  const hasWords = words.length > 0;
  const isShown = isOpen && hasWords;
  const hasSuggestions = suggestions.length > 0;
  const isListed = isShown && hasSuggestions;
  const activeId = activeIdOf(listId, activeIndex, isListed);
  const listensOutside = isShown && !isDemonstrating;

  useEffect(() => {
    if (!listensOutside) {
      return;
    }
    function closeFromOutside(event: PointerEvent) {
      const wrapper = wrapperRef.current;
      const target = event.target;
      const isInside = target instanceof Node && wrapper?.contains(target);
      if (!isInside) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', closeFromOutside);
    return () => document.removeEventListener('pointerdown', closeFromOutside);
  }, [listensOutside, onClose]);

  function openActive() {
    let index = activeIndex;
    if (index < 0) {
      index = 0;
    }
    const optionId = optionIdOf(listId, index);
    const option = document.getElementById(optionId);
    option?.click();
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onMove(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onMove(-1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
      return;
    }
    const isEnter = event.key === 'Enter';
    const opens = isEnter && isListed;
    if (opens) {
      event.preventDefault();
      openActive();
    }
  }

  function closeWhenLeaving(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    const staysInside =
      next instanceof Node && event.currentTarget.contains(next);
    if (!staysInside) {
      onClose();
    }
  }

  return (
    <div ref={wrapperRef} onBlur={closeWhenLeaving} className='relative w-full'>
      <label htmlFor={inputId} className='sr-only'>
        Search Larchway
      </label>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2' />
      <Input
        id={inputId}
        type='search'
        role='combobox'
        autoComplete='off'
        spellCheck={false}
        aria-autocomplete='list'
        aria-expanded={isListed}
        aria-controls={listId}
        aria-activedescendant={activeId}
        placeholder='Search routes, guides and help'
        value={query}
        onChange={(event) => onType(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeys}
        className='h-11 rounded-xl ps-10 pe-3 md:text-sm'
      />
      <AnimatePresence initial={false}>
        {isShown && (
          <motion.div
            key='suggestions'
            initial={listStartOf(shouldReduceMotion)}
            animate={LIST_SHOWN}
            exit={{
              ...listStartOf(shouldReduceMotion),
              transition: LIST_LEAVE,
            }}
            transition={LIST_ARRIVE}
            className='surface-raised absolute inset-x-0 top-full z-20 mt-2 flex origin-top flex-col rounded-xl p-1'
          >
            {hasSuggestions && (
              <ul
                id={listId}
                role='listbox'
                aria-label='Suggested pages'
                className='flex flex-col'
              >
                {suggestions.map((page, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={page.id} role='none'>
                      <a
                        id={optionIdOf(listId, index)}
                        role='option'
                        aria-selected={isActive}
                        href={page.href}
                        tabIndex={-1}
                        onMouseDown={(event) => event.preventDefault()}
                        className='relative isolate flex h-10 items-center gap-3 rounded-lg px-2.5 text-[13px] outline-none'
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${listId}-highlight`}
                            transition={travelOf(shouldReduceMotion)}
                            className='bg-foreground/[0.06] absolute inset-0 -z-10 rounded-lg'
                          />
                        )}
                        <span className='text-muted-foreground w-16 shrink-0 text-xs'>
                          {page.section}
                        </span>
                        <MarkedTitle title={page.title} words={words} />
                        <ArrowRightIcon
                          className={cn(
                            'text-muted-foreground ms-auto size-3.5 shrink-0 opacity-0 transition-opacity duration-150',
                            isActive && 'opacity-100'
                          )}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {!hasSuggestions && (
              <p className='text-muted-foreground px-2.5 py-3 text-[13px] text-pretty'>
                No page matches these words. Try one place or one activity, such
                as dolomites or huts.
              </p>
            )}
            <p
              aria-hidden='true'
              className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 pt-2 pb-1.5 text-xs'
            >
              <span className='inline-flex items-center gap-1'>
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-up')
                  )}
                >
                  ↑
                </Kbd>
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-down')
                  )}
                >
                  ↓
                </Kbd>
                move
              </span>
              <span className='inline-flex items-center gap-1'>
                <Kbd>Enter</Kbd>
                opens
              </span>
              <span className='inline-flex items-center gap-1'>
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-escape')
                  )}
                >
                  Esc
                </Kbd>
                closes
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
