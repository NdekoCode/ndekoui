'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { Fragment, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { leadingSpaceOf, wordsOf } from '@/registry/ndeko/lib/words';

import type { Loop } from './loops';
import { useLoops } from './use-loops';

const LETTER_STEP_MS = 70;

const GLINT_RISE_MS = 140;

const GLINT_FALL_MS = 260;

/** How far the light lifts a letter towards the text colour: a soft shimmer, short of a flash. */
const GLINT_PEAK = 0.85;

const PASS_REST_MS = 900;

const SINE_EASING = 'cubic-bezier(0.37, 0, 0.63, 1)';

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

const ARRIVING = { opacity: 0, y: 4, filter: 'blur(2px)' };

const SHOWN = { opacity: 1, y: 0, filter: 'blur(0px)', transition: ENTER };

const LEAVING = { opacity: 0, y: -4, filter: 'blur(2px)', transition: EXIT };

const FADING_IN = { opacity: 0 };

const FADED_IN = { opacity: 1, transition: ENTER };

const FADING_OUT = { opacity: 0, transition: EXIT };

function presenceOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { initial: FADING_IN, animate: FADED_IN, exit: FADING_OUT };
  }
  return { initial: ARRIVING, animate: SHOWN, exit: LEAVING };
}

function periodOf(letterCount: number) {
  const sweep = letterCount * LETTER_STEP_MS;
  const glint = GLINT_RISE_MS + GLINT_FALL_MS;
  return sweep + glint + PASS_REST_MS;
}

function glintKeyframesOf(periodMs: number): Keyframe[] {
  const litAt = GLINT_RISE_MS / periodMs;
  const goneAt = (GLINT_RISE_MS + GLINT_FALL_MS) / periodMs;
  return [
    { opacity: 0, offset: 0, easing: SINE_EASING },
    { opacity: GLINT_PEAK, offset: litAt, easing: SINE_EASING },
    { opacity: 0, offset: goneAt },
    { opacity: 0, offset: 1 },
  ];
}

/** A soft light passes over the letters one after the other: each one brightens towards the text colour and fades back. */
function glintLoopsOf(root: HTMLElement): Loop[] {
  const glints = Array.from(root.querySelectorAll('[data-glint]'));
  const periodMs = periodOf(glints.length);
  const keyframes = glintKeyframesOf(periodMs);
  return glints.map((element, index) => ({
    element,
    keyframes,
    timing: {
      duration: periodMs,
      delay: index * LETTER_STEP_MS,
      iterations: Infinity,
    },
  }));
}

type WordProps = {
  word: string;
};

/** A word never breaks inside itself; each letter carries its own light over it. */
function Word({ word }: WordProps) {
  const letters = Array.from(word);
  return (
    <span className='whitespace-nowrap'>
      {letters.map((letter, index) => (
        <span key={index} className='relative inline-block'>
          {letter}
          <span
            data-glint=''
            className='text-foreground pointer-events-none absolute inset-0 opacity-0 select-none'
          >
            {letter}
          </span>
        </span>
      ))}
    </span>
  );
}

type ShimmerTextProps = {
  text: string;
  canLoop: boolean;
  isPlaying: boolean;
};

function ShimmerText({ text, canLoop, isPlaying }: ShimmerTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = wordsOf(text);

  useLoops(ref, { canLoop, isPlaying, create: glintLoopsOf });

  return (
    <span ref={ref} className='block'>
      {words.map((word, index) => (
        <Fragment key={index}>
          {leadingSpaceOf(index)}
          <Word word={word} />
        </Fragment>
      ))}
    </span>
  );
}

function toneOf(isDone: boolean) {
  if (isDone) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

type ShimmerLabelProps = {
  text: string;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  className?: string;
};

/**
 * The words of a status, muted while the work runs, with a light that passes over them letter by
 * letter (opacity only), and in the text colour once it is done. A new label rises in as the old
 * one leaves. The words are drawn for the eye: the status that holds them says them once.
 */
export function ShimmerLabel({
  text,
  isDone,
  canLoop,
  isPlaying,
  className,
}: ShimmerLabelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = presenceOf(shouldReduceMotion);

  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative block min-w-0 transition-colors duration-200',
        toneOf(isDone),
        className
      )}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span key={text} className='block' {...presence}>
          <ShimmerText text={text} canLoop={canLoop} isPlaying={isPlaying} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
