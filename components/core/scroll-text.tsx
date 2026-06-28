'use client';
import { cn } from '@/lib/utils';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from 'motion/react';
import { useRef, type RefObject } from 'react';
import { motionElementOf } from './motion-elements';

export type ScrollTextMode = 'word' | 'character' | 'highlight';

export type ScrollTextTag =
  'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote' | 'div' | 'span';

type ScrollOffset = UseScrollOptions['offset'];

type Range = [number, number];

type Word = {
  text: string;
  trailingSpace: string;
  characters: string[];
  firstCharacter: number;
};

const DEFAULT_OFFSET: ScrollOffset = ['start 0.85', 'end 0.5'];

const DIMMED_OPACITY = 0.18;

const SPACE_AFTER_WORD = /^(\S+)(\s*)$/;

function graphemesOf(text: string) {
  const canSegment = typeof Intl.Segmenter === 'function';
  if (!canSegment) {
    return Array.from(text);
  }
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const segments = Array.from(segmenter.segment(text));
  return segments.map((segment) => segment.segment);
}

function wordsOf(text: string) {
  const tokens = text.match(/\S+\s*/g) ?? [];
  const words: Word[] = [];
  let characterCount = 0;

  for (const token of tokens) {
    const match = SPACE_AFTER_WORD.exec(token);
    const wordText = match?.[1] ?? token;
    const trailingSpace = match?.[2] ?? '';
    const characters = graphemesOf(wordText);
    words.push({
      text: wordText,
      trailingSpace,
      characters,
      firstCharacter: characterCount,
    });
    characterCount += characters.length;
  }

  return { words, characterCount };
}

function rangeOf(index: number, total: number): Range {
  const nextIndex = index + 1;
  const start = index / total;
  const end = nextIndex / total;
  return [start, end];
}

function revealStyleOf(isStatic: boolean | null, opacity: MotionValue<number>) {
  if (isStatic) {
    return undefined;
  }
  return { opacity };
}

function fillStyleOf(isStatic: boolean | null, scaleX: MotionValue<number>) {
  if (isStatic) {
    return undefined;
  }
  return { scaleX };
}

function RevealSpan({
  progress,
  range,
  isStatic,
  children,
}: {
  progress: MotionValue<number>;
  range: Range;
  isStatic: boolean | null;
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, range, [DIMMED_OPACITY, 1]);

  return (
    <motion.span style={revealStyleOf(isStatic, opacity)}>
      {children}
    </motion.span>
  );
}

function HighlightSpan({
  progress,
  range,
  isStatic,
  children,
}: {
  progress: MotionValue<number>;
  range: Range;
  isStatic: boolean | null;
  children: React.ReactNode;
}) {
  const scaleX = useTransform(progress, range, [0, 1]);

  return (
    <span className='relative'>
      <motion.span
        className='bg-primary/15 absolute inset-x-0 inset-y-[0.1em] -z-10 origin-left'
        style={fillStyleOf(isStatic, scaleX)}
      />
      {children}
    </span>
  );
}

export type ScrollTextProps = {
  children: string;
  mode?: ScrollTextMode;
  as?: ScrollTextTag;
  offset?: ScrollOffset;
  containerRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export function ScrollText({
  children,
  mode = 'word',
  as = 'p',
  offset = DEFAULT_OFFSET,
  containerRef,
  className,
}: ScrollTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset,
  });
  const MotionComponent = motionElementOf(as) as typeof motion.p;
  const { words, characterCount } = wordsOf(children);
  const wordCount = words.length;

  function renderWord(word: Word, wordIndex: number) {
    const key = `${wordIndex}-${word.text}`;

    if (mode === 'highlight') {
      return (
        <HighlightSpan
          key={key}
          progress={scrollYProgress}
          range={rangeOf(wordIndex, wordCount)}
          isStatic={shouldReduceMotion}
        >
          {word.text}
          {word.trailingSpace}
        </HighlightSpan>
      );
    }

    if (mode === 'character') {
      return (
        <span key={key}>
          {word.characters.map((character, characterIndex) => {
            const globalIndex = word.firstCharacter + characterIndex;
            return (
              <RevealSpan
                key={characterIndex}
                progress={scrollYProgress}
                range={rangeOf(globalIndex, characterCount)}
                isStatic={shouldReduceMotion}
              >
                {character}
              </RevealSpan>
            );
          })}
          {word.trailingSpace}
        </span>
      );
    }

    return (
      <RevealSpan
        key={key}
        progress={scrollYProgress}
        range={rangeOf(wordIndex, wordCount)}
        isStatic={shouldReduceMotion}
      >
        {word.text}
        {word.trailingSpace}
      </RevealSpan>
    );
  }

  return (
    <MotionComponent ref={ref} className={cn('isolate', className)}>
      <span className='sr-only'>{children}</span>
      <span aria-hidden='true'>{words.map(renderWord)}</span>
    </MotionComponent>
  );
}
