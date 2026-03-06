// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type StreamMode = 'typewriter' | 'fade';

type TextSource = string | AsyncIterable<string>;

type StreamSegment = {
  text: string;
  index: number;
};

type UseTextStreamOptions = {
  textStream: TextSource;
  /** From 1, slowest, to 100, fastest. */
  speed?: number;
  mode?: StreamMode;
  onComplete?: () => void;
  onError?: (error: unknown) => void;
  /** Milliseconds between two revealed pieces; overrides `speed`. */
  segmentDelay?: number;
  /** Characters revealed at a time in typewriter mode; overrides `speed`. */
  characterChunkSize?: number;
};

type UseTextStreamResult = {
  displayedText: string;
  segments: StreamSegment[];
  isComplete: boolean;
  isPaused: boolean;
  reset: () => void;
  startStreaming: () => void;
  pause: () => void;
  resume: () => void;
};

const WORD_PIECES = /\s+|\S+\s*/g;

function clampedSpeedOf(speed: number) {
  const atLeastOne = Math.max(1, speed);
  return Math.min(100, atLeastOne);
}

function delayOf(speed: number, segmentDelay: number | undefined) {
  if (typeof segmentDelay === 'number') {
    return Math.max(0, segmentDelay);
  }
  const normalized = clampedSpeedOf(speed);
  const delay = Math.round(100 / Math.sqrt(normalized));
  return Math.max(1, delay);
}

function chunkSizeOf(speed: number, characterChunkSize: number | undefined) {
  if (typeof characterChunkSize === 'number') {
    return Math.max(1, characterChunkSize);
  }
  const normalized = clampedSpeedOf(speed);
  if (normalized < 25) {
    return 1;
  }
  const size = Math.round((normalized - 25) / 10);
  return Math.max(1, size);
}

function wordsOf(text: string) {
  return text.match(WORD_PIECES) ?? [];
}

function charactersOf(text: string, chunkSize: number) {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += chunkSize) {
    const chunk = text.slice(start, start + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

function piecesOf(text: string, mode: StreamMode, chunkSize: number) {
  if (mode === 'fade') {
    return wordsOf(text);
  }
  return charactersOf(text, chunkSize);
}

function toSegments(pieces: string[]) {
  return pieces.map((text, index) => ({ text, index }));
}

function completionOf(
  isFixedText: boolean,
  isFixedTextDone: boolean,
  isIterableDone: boolean
) {
  if (isFixedText) {
    return isFixedTextDone;
  }
  return isIterableDone;
}

function textOf(source: TextSource) {
  if (typeof source === 'string') {
    return source;
  }
  return '';
}

/** Fade mode reveals whole words, typewriter mode reveals characters. */
function useTextStream({
  textStream,
  speed = 20,
  mode = 'typewriter',
  onComplete,
  onError,
  segmentDelay,
  characterChunkSize,
}: UseTextStreamOptions): UseTextStreamResult {
  const [source, setSource] = useState(textStream);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [isIterableDone, setIsIterableDone] = useState(false);
  const [runId, setRunId] = useState(0);

  if (source !== textStream) {
    setSource(textStream);
    setRevealedCount(0);
    setIsPaused(false);
    setStreamedText('');
    setIsIterableDone(false);
  }

  const isFixedText = typeof source === 'string';
  const fixedText = textOf(source);
  const delay = delayOf(speed, segmentDelay);
  const chunkSize = chunkSizeOf(speed, characterChunkSize);
  const pieces = useMemo(
    () => piecesOf(fixedText, mode, chunkSize),
    [fixedText, mode, chunkSize]
  );
  const pieceCount = pieces.length;
  const isFixedTextDone = revealedCount >= pieceCount;
  const isIdle = isPaused || isFixedTextDone;

  useEffect(() => {
    if (!isFixedText) {
      return;
    }
    if (isIdle) {
      return;
    }
    const timer = setInterval(() => {
      setRevealedCount((count) => Math.min(count + 1, pieceCount));
    }, delay);
    return () => clearInterval(timer);
  }, [isFixedText, isIdle, delay, pieceCount, runId]);

  const reportError = useEffectEvent((error: unknown) => {
    onError?.(error);
  });

  useEffect(() => {
    if (typeof source === 'string') {
      return;
    }
    let isActive = true;

    async function follow(stream: AsyncIterable<string>) {
      try {
        for await (const chunk of stream) {
          if (!isActive) {
            return;
          }
          setStreamedText((text) => text + chunk);
        }
      } catch (error) {
        if (isActive) {
          reportError(error);
        }
      }
      if (isActive) {
        setIsIterableDone(true);
      }
    }

    follow(source);

    return () => {
      isActive = false;
    };
  }, [source]);

  const visiblePieces = useMemo(() => {
    if (isFixedText) {
      return pieces.slice(0, revealedCount);
    }
    return piecesOf(streamedText, mode, chunkSize);
  }, [isFixedText, pieces, revealedCount, streamedText, mode, chunkSize]);

  const displayedText = visiblePieces.join('');
  const segments = useMemo(() => toSegments(visiblePieces), [visiblePieces]);
  const isComplete = completionOf(isFixedText, isFixedTextDone, isIterableDone);
  const hasContent = displayedText.length > 0;
  const shouldNotify = isComplete && hasContent;

  const notifyComplete = useEffectEvent(() => {
    onComplete?.();
  });

  useEffect(() => {
    if (shouldNotify) {
      notifyComplete();
    }
  }, [shouldNotify, runId]);

  function reset() {
    setRevealedCount(0);
    setIsPaused(false);
    setStreamedText('');
    setIsIterableDone(false);
  }

  function startStreaming() {
    reset();
    setRunId((id) => id + 1);
  }

  function pause() {
    setIsPaused(true);
  }

  function resume() {
    setIsPaused(false);
  }

  return {
    displayedText,
    segments,
    isComplete,
    isPaused,
    reset,
    startStreaming,
    pause,
    resume,
  };
}

const DEFAULT_FADE_MS = 150;

type ResponseStreamSegmentsProps = {
  segments: StreamSegment[];
  /** How long each word takes to fade in, in milliseconds. */
  fadeDuration?: number;
  className?: string;
};

function ResponseStreamSegments({
  segments,
  fadeDuration = DEFAULT_FADE_MS,
  className,
}: ResponseStreamSegmentsProps) {
  const fadeStyle = { transitionDuration: `${fadeDuration}ms` };

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {segments.map((segment) => (
        <span
          key={segment.index}
          style={fadeStyle}
          className='transition-opacity ease-(--ease-out-strong) starting:opacity-0'
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}

type StreamTag = 'div' | 'p' | 'span';

type ResponseStreamProps = Omit<UseTextStreamOptions, 'onError'> & {
  as?: StreamTag;
  className?: string;
  /** Fade mode only: how long each word takes to appear, in milliseconds. */
  fadeDuration?: number;
};

function ResponseStream({
  as = 'div',
  className,
  fadeDuration,
  mode = 'typewriter',
  ...options
}: ResponseStreamProps) {
  const { displayedText, segments } = useTextStream({ mode, ...options });
  const Tag = as;
  const isFade = mode === 'fade';

  return (
    <Tag
      data-slot='response-stream'
      className={cn('whitespace-pre-wrap', className)}
    >
      {isFade && (
        <ResponseStreamSegments
          segments={segments}
          fadeDuration={fadeDuration}
        />
      )}
      {!isFade && displayedText}
    </Tag>
  );
}

export {
  ResponseStream,
  ResponseStreamSegments,
  useTextStream,
  type ResponseStreamProps,
  type StreamMode,
  type StreamSegment,
  type UseTextStreamOptions,
  type UseTextStreamResult,
};
