'use client';

import { Fragment, useEffect, useState } from 'react';

import { wordsOf } from './words';

const SHOWN_WORD =
  'relative opacity-100 transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

/** The count starts again only when the component mounts: a round that plays again has to mount it again. */
export function useRevealedCount(
  total: number,
  isRunning: boolean,
  stepMs: number
) {
  const [count, setCount] = useState(0);
  const isTicking = isRunning && count < total;

  useEffect(() => {
    if (!isTicking) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + 1));
    }, stepMs);
    return () => clearInterval(timer);
  }, [isTicking, total, stepMs]);

  return count;
}

export function shownCountOf(
  isStreaming: boolean,
  count: number,
  total: number
) {
  if (isStreaming) {
    return count;
  }
  return total;
}

/**
 * A word that waits keeps its place without ink, so a paragraph has its final height from its first
 * word and nothing under it moves while it streams. Text that is not streaming carries no transition.
 */
export function inkClassOf(isStreaming: boolean, isShown: boolean) {
  if (!isStreaming) {
    return undefined;
  }
  if (isShown) {
    return SHOWN_WORD;
  }
  return 'invisible opacity-0';
}

export function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

export function StreamCaret() {
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/50 absolute start-full top-[0.2em] ms-0.5 h-[1em] w-0.5 animate-pulse rounded-full'
    />
  );
}

type StreamedWordsProps = {
  words: readonly string[];
  shown: number;
  isStreaming: boolean;
};

export function StreamedWords({
  words,
  shown,
  isStreaming,
}: StreamedWordsProps) {
  const lastShown = shown - 1;

  return (
    <>
      {words.map((word, index) => {
        const isShown = index < shown;
        const hasCaret = isStreaming && index === lastShown;
        return (
          <Fragment key={index}>
            {leadingSpaceOf(index)}
            <span className={inkClassOf(isStreaming, isShown)}>
              {word}
              {hasCaret && <StreamCaret />}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}

type StreamedTextProps = {
  text: string;
  isStreaming: boolean;
  isActive: boolean;
  wordMs: number;
};

/** Only this text re-renders while it streams. */
export function StreamedText({
  text,
  isStreaming,
  isActive,
  wordMs,
}: StreamedTextProps) {
  const words = wordsOf(text);
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(words.length, isRunning, wordMs);
  const shown = shownCountOf(isStreaming, count, words.length);

  return (
    <StreamedWords words={words} shown={shown} isStreaming={isStreaming} />
  );
}
