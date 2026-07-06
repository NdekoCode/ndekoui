'use client';

import { type MotionValue } from 'motion/react';
import { Fragment } from 'react';

import { leadingSpaceOf, wordsOf } from '@/registry/ndeko/lib/words';
import { cn } from '@/registry/ndeko/lib/utils';

import { useSteps } from './use-steps';

const LIT_BY = 0.7;

function toneOf(isLit: boolean) {
  if (isLit) {
    return 'text-foreground';
  }
  return 'text-foreground/50';
}

type LitCaptionProps = {
  id: string;
  text: string;
  progress: MotionValue<number>;
};

/** Every word is in the page from the start, so it reads whole to anyone who cannot see it light. */
export function LitCaption({ id, text, progress }: LitCaptionProps) {
  const words = wordsOf(text);
  const lit = useSteps(progress, words.length, LIT_BY);

  return (
    <p
      id={id}
      className='text-lg leading-snug font-medium text-pretty sm:text-2xl lg:text-[1.75rem]'
    >
      {words.map((word, index) => (
        <Fragment key={index}>
          {leadingSpaceOf(index)}
          <span
            className={cn(
              'transition-colors duration-300 ease-(--ease-out-strong)',
              toneOf(index < lit)
            )}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
