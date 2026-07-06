'use client';

import { Fragment, useEffect, useState } from 'react';

import { leadingSpaceOf, wordsOf } from '@/registry/ndeko/lib/words';

const SHOWN_WORD =
  'relative opacity-100 transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

const WAITING_WORD = 'invisible opacity-0';

const ARRIVING_WORD =
  'transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

/**
 * Counts up to `total`, `perStep` at a time every `stepMs`, while `isRunning`. The count starts again
 * only when the component mounts: a round that plays again has to mount it again.
 */
export function useRevealedCount(
  total: number,
  isRunning: boolean,
  stepMs: number,
  perStep = 1
) {
  const [count, setCount] = useState(0);
  const isTicking = isRunning && count < total;

  useEffect(() => {
    if (!isTicking) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + perStep));
    }, stepMs);
    return () => clearInterval(timer);
  }, [isTicking, total, stepMs, perStep]);

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
  return WAITING_WORD;
}

/** Sits after the last word that arrived, inside that word, which `inkClassOf` makes `relative`. */
export function StreamCaret() {
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/50 absolute start-full top-[0.2em] ms-0.5 h-[1em] w-0.5 animate-pulse rounded-full'
    />
  );
}

function TrailingCaret() {
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/50 inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]'
    />
  );
}

type WordsProps = {
  words: readonly string[];
  shown: number;
  isStreaming: boolean;
};

function KeptWords({ words, shown, isStreaming }: WordsProps) {
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

/** Each word fades in as it mounts, so a line that grows settles word by word with no script per frame. */
function GrowingWords({ words, shown, isStreaming }: WordsProps) {
  const arrived = words.slice(0, shown);

  return (
    <>
      {arrived.map((word, index) => (
        <span key={index} className={ARRIVING_WORD}>
          {word}{' '}
        </span>
      ))}
      {isStreaming && <TrailingCaret />}
    </>
  );
}

export type StreamedWordsProps = {
  words: readonly string[];
  /** How many of the words have arrived. */
  shown: number;
  /** More words are coming: a caret follows the last one that arrived. */
  isStreaming?: boolean;
  /**
   * True lays every word out from the start, so nothing under the text moves while it streams and a
   * text that is not streaming shows all its words. False lets the line grow as its words arrive.
   */
  keepsPlace?: boolean;
  className?: string;
};

export function StreamedWords({
  words,
  shown,
  isStreaming = false,
  keepsPlace = true,
  className,
}: StreamedWordsProps) {
  if (keepsPlace) {
    return (
      <span className={className}>
        <KeptWords words={words} shown={shown} isStreaming={isStreaming} />
      </span>
    );
  }
  return (
    <span className={className}>
      <GrowingWords words={words} shown={shown} isStreaming={isStreaming} />
    </span>
  );
}

type StreamedTextProps = {
  text: string;
  isStreaming: boolean;
  /** False off screen and in a hidden tab: the text holds where it is. */
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

function arrivingInkOf(isStreaming: boolean) {
  if (isStreaming) {
    return ARRIVING_WORD;
  }
  return undefined;
}

function arrivalDelayOf(isStreaming: boolean, index: number, wordMs: number) {
  if (!isStreaming) {
    return undefined;
  }
  const delay = index * wordMs;
  return { transitionDelay: `${delay}ms` };
}

type StreamedInkProps = {
  text: string;
  /** True for a text that has just been written: its words fade in one after the other. */
  isStreaming: boolean;
  wordMs: number;
};

/**
 * Every word is in the page from the start, so the paragraph has its final height at once and a
 * screen reader gets the whole text. Only the ink arrives, each word through its own delay, so
 * nothing ticks in script while the text arrives.
 */
export function StreamedInk({ text, isStreaming, wordMs }: StreamedInkProps) {
  // Split on spaces only: the line breaks of a text shown with `whitespace-pre-line` stay inside their words.
  const words = text.split(' ');

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={index}>
          {leadingSpaceOf(index)}
          <span
            style={arrivalDelayOf(isStreaming, index, wordMs)}
            className={arrivingInkOf(isStreaming)}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </>
  );
}
