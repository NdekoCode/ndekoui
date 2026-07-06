'use client';

import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';

import { wordsOf } from './use-word-stream';

type WrappingRollProps = {
  text: string;
  /** The words roll up when it grows and down when it falls. */
  value?: number;
  className?: string;
};

/**
 * A sentence that rolls and still wraps on a narrow piece. A `WordRoll` keeps all it holds on one
 * line, so each word gets its own and the line breaks between them.
 */
export function WrappingRoll({ text, value, className }: WrappingRollProps) {
  const words = wordsOf(text);

  return (
    <span className={cn('block', className)}>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true' className='flex flex-wrap gap-x-[0.25em]'>
        {words.map((word, index) => (
          <WordRoll key={index} text={word} value={value} />
        ))}
      </span>
    </span>
  );
}
