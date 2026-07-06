'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon, SearchIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  INSTANT,
  SPRING,
} from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { CATEGORIES, SITE, type Article } from './data';
import { markedPartsOf, wordsOf } from './match';

const LIST_SHOWN = { opacity: 1, scale: 1 };

const LIST_HIDDEN = { opacity: 0, scale: 0.97 };

const LIST_FADED = { opacity: 0, scale: 1 };

const LIST_ARRIVE: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

const LIST_LEAVE: Transition = { duration: 0.1, ease: EASE_OUT_STRONG };

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

function activeIdOf(listId: string, activeIndex: number, isListed: boolean) {
  const hasActive = activeIndex >= 0;
  if (!isListed || !hasActive) {
    return undefined;
  }
  return optionIdOf(listId, activeIndex);
}

function categoryTitleOf(article: Article) {
  const category = CATEGORIES.find(
    (candidate) => candidate.id === article.category
  );
  return category?.title ?? '';
}

function allResultsLineOf(count: number, query: string) {
  const trimmed = query.trim();
  if (count === 1) {
    return `See the 1 result for “${trimmed}”`;
  }
  return `See all ${count} results for “${trimmed}”`;
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

type HelpSearchProps = {
  query: string;
  isOpen: boolean;
  activeIndex: number;
  suggestions: Article[];
  /** All the articles that match, of which the first few are suggested. */
  matchCount: number;
  pressed: string | null;
  /** While the demonstration plays, the suggestions show without the focus and a click elsewhere leaves them be. */
  isDemonstrating: boolean;
  onType: (value: string) => void;
  onFocus: () => void;
  onMove: (by: 1 | -1) => void;
  onEscape: () => void;
  onClose: () => void;
};

export function HelpSearch({
  query,
  isOpen,
  activeIndex,
  suggestions,
  matchCount,
  pressed,
  isDemonstrating,
  onType,
  onFocus,
  onMove,
  onEscape,
  onClose,
}: HelpSearchProps) {
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
    if (isEnter && isListed) {
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
    <div
      ref={wrapperRef}
      onBlur={closeWhenLeaving}
      className='relative w-full max-w-xl text-start'
    >
      <label htmlFor={inputId} className='sr-only'>
        Search the help center
      </label>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2' />
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
        placeholder='Search payroll, people, taxes'
        value={query}
        onChange={(event) => onType(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeys}
        className='h-12 rounded-xl ps-11 pe-4 md:text-sm'
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
                aria-label='Suggested articles'
                className='flex flex-col'
              >
                {suggestions.map((article, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li key={article.id} role='none'>
                      <a
                        id={optionIdOf(listId, index)}
                        role='option'
                        aria-selected={isActive}
                        href={article.href}
                        tabIndex={-1}
                        onMouseDown={(event) => event.preventDefault()}
                        className='relative isolate flex min-h-11 flex-col justify-center gap-0.5 rounded-lg px-3 py-1.5 outline-none'
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${listId}-highlight`}
                            transition={travelOf(shouldReduceMotion)}
                            className='bg-foreground/[0.06] absolute inset-0 -z-10 rounded-lg'
                          />
                        )}
                        <span className='flex items-center gap-2 text-[13px] font-medium'>
                          <MarkedTitle title={article.title} words={words} />
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {categoryTitleOf(article)}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {!hasSuggestions && (
              <p className='text-muted-foreground px-3 py-3 text-[13px] text-pretty'>
                No article mentions these words yet. Try another word, or write
                to us below.
              </p>
            )}
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pt-2 pb-1.5'>
              {hasSuggestions && (
                <a
                  href={SITE.searchHref}
                  className={cn(
                    'text-primary-ink inline-flex items-center gap-1 rounded-sm text-xs font-medium',
                    FOCUS_RING
                  )}
                >
                  {allResultsLineOf(matchCount, query)}
                  <ArrowRightIcon className='size-3.5' />
                </a>
              )}
              <p
                aria-hidden='true'
                className='text-muted-foreground ms-auto flex items-center gap-1 text-xs'
              >
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
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-escape')
                  )}
                >
                  Esc
                </Kbd>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
