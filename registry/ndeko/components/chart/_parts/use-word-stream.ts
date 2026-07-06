'use client';

import { useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type StreamStatus = 'idle' | 'thinking' | 'streaming' | 'done';

export type WordStream = {
  status: StreamStatus;
  words: readonly string[];
  /** How many of the words have arrived. */
  shown: number;
};

type StreamTiming = {
  /** Milliseconds before the first word. */
  thinkMs?: number;
  /** Milliseconds between two words. */
  wordMs?: number;
};

const IDLE: WordStream = { status: 'idle', words: [], shown: 0 };

export function wordsOf(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

/** A text that is already there, with nothing left to arrive. */
export function arrivedStreamOf(text: string): WordStream {
  const words = wordsOf(text);
  return { status: 'done', words, shown: words.length };
}

export function textOf(stream: WordStream) {
  return stream.words.join(' ');
}

/** What a screen reader hears: the whole text once it has arrived, never each word on its way. */
export function spokenStreamOf(stream: WordStream) {
  if (stream.status === 'done') {
    return textOf(stream);
  }
  return '';
}

function withShown(shown: number) {
  return function reveal(current: WordStream): WordStream {
    return { ...current, shown };
  };
}

function withStatus(status: StreamStatus) {
  return function advance(current: WordStream): WordStream {
    return { ...current, status };
  };
}

/**
 * A text that arrives the way a model writes it: a moment of thought, then word after word. A real
 * product replaces it with its own stream and keeps the same `WordStream` shape.
 */
export function useWordStream(initial: WordStream = IDLE) {
  const [stream, setStream] = useState(initial);
  const { schedule, clearAll } = useTimeouts();

  function start(
    text: string,
    { thinkMs = 900, wordMs = 55 }: StreamTiming = {}
  ) {
    clearAll();
    const words = wordsOf(text);
    setStream({ status: 'thinking', words, shown: 0 });
    schedule(() => setStream(withStatus('streaming')), thinkMs);
    for (let shown = 1; shown <= words.length; shown += 1) {
      const elapsed = shown * wordMs;
      schedule(() => setStream(withShown(shown)), thinkMs + elapsed);
    }
    const streamMs = words.length * wordMs;
    const lastWordAt = thinkMs + streamMs;
    const settleMs = wordMs * 2;
    schedule(() => setStream(withStatus('done')), lastWordAt + settleMs);
  }

  function show(next: WordStream) {
    clearAll();
    setStream(next);
  }

  return { stream, start, show };
}
