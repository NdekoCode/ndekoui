'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  INSTANT,
  SPRING,
} from '@/registry/ndeko/lib/motion-presets';

import { TYPE_GLYPH, type IndexedPage } from './data';
import { markedPartsOf } from './search';

const ROW_SHOWN = { opacity: 1 };

const ROW_HIDDEN = { opacity: 0 };

const ROW_LEAVE: Transition = { duration: 0.1, ease: EASE_OUT_STRONG };

function rowMotionOf(shouldReduceMotion: boolean): Transition {
  if (shouldReduceMotion) {
    return { duration: 0.15, layout: INSTANT };
  }
  return { duration: 0.2, ease: EASE_OUT_STRONG, layout: SPRING };
}

function travelOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

export function optionIdOf(listId: string, index: number) {
  return `${listId}-${index}`;
}

function Marked({ text, words }: { text: string; words: string[] }) {
  const parts = markedPartsOf(text, words);

  return (
    <>
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
    </>
  );
}

function Trail({ trail }: { trail: string[] }) {
  return (
    <span className='text-muted-foreground flex min-w-0 items-center gap-1 text-xs'>
      {trail.map((step, index) => (
        <span key={step} className='flex min-w-0 items-center gap-1'>
          {index > 0 && <ChevronRightIcon className='size-3 shrink-0' />}
          <span className='truncate'>{step}</span>
        </span>
      ))}
    </span>
  );
}

type ResultListProps = {
  listId: string;
  results: IndexedPage[];
  words: string[];
  activeIndex: number;
};

/** The input keeps the focus; the arrows walk a highlight through these rows. */
export function ResultList({
  listId,
  results,
  words,
  activeIndex,
}: ResultListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const layoutKey = results.map((page) => page.id).join(' ');

  return (
    <ul
      id={listId}
      role='listbox'
      aria-label='Results'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <AnimatePresence mode='popLayout' initial={false}>
        {results.map((page, index) => {
          const Glyph = TYPE_GLYPH[page.type];
          const isActive = index === activeIndex;
          return (
            <motion.li
              key={page.id}
              role='none'
              layout
              layoutDependency={layoutKey}
              initial={ROW_HIDDEN}
              animate={ROW_SHOWN}
              exit={{ opacity: 0, transition: ROW_LEAVE }}
              transition={rowMotionOf(shouldReduceMotion)}
            >
              <a
                id={optionIdOf(listId, index)}
                role='option'
                aria-selected={isActive}
                href={page.href}
                tabIndex={-1}
                className='hover:bg-foreground/[0.03] relative isolate flex items-start gap-3 rounded-lg p-3 transition-colors duration-100 outline-none'
              >
                {isActive && (
                  <motion.span
                    layoutId={`${listId}-highlight`}
                    transition={travelOf(shouldReduceMotion)}
                    className='bg-foreground/[0.06] absolute inset-0 -z-10 rounded-lg'
                  />
                )}
                <span className='keycap-3d flex size-8 shrink-0 items-center justify-center rounded-lg'>
                  <Glyph className='text-muted-foreground size-4' />
                </span>
                <span className='flex min-w-0 flex-1 flex-col gap-1'>
                  <Trail trail={page.trail} />
                  <span className='text-[13px] font-medium text-pretty'>
                    <Marked text={page.title} words={words} />
                  </span>
                  <span className='text-muted-foreground line-clamp-2 text-xs leading-5 text-pretty'>
                    <Marked text={page.excerpt} words={words} />
                  </span>
                </span>
              </a>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
