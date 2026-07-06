import { cn } from '@/registry/ndeko/lib/utils';

import { PHRASES } from './data';

function caretClassOf(isLive: boolean) {
  if (isLive) {
    return 'animate-pulse';
  }
  return undefined;
}

type TypedPhraseProps = {
  phrase: string;
  typed: string;
  hasCaret: boolean;
  /** The caret only pulses while the hero is on screen. */
  isLive: boolean;
};

/**
 * Every phrase sits invisible in one grid cell, so the block always has the width and height of
 * the longest one, and the live phrase is laid out whole with the part not typed yet hidden, so
 * its lines break where they will break once it is typed. The caret takes no width.
 */
export function TypedPhrase({
  phrase,
  typed,
  hasCaret,
  isLive,
}: TypedPhraseProps) {
  const rest = phrase.slice(typed.length);

  return (
    <span className='text-primary-ink inline-grid text-start'>
      {PHRASES.map((candidate) => (
        <span
          key={candidate}
          aria-hidden='true'
          className='invisible col-start-1 row-start-1'
        >
          {candidate}
        </span>
      ))}
      <span aria-hidden='true' className='col-start-1 row-start-1'>
        {typed}
        {hasCaret && (
          <span className='relative inline-block w-0 align-baseline'>
            <span
              className={cn(
                'absolute start-0 top-[0.14em] h-[0.9em] w-[0.06em] rounded-full bg-current',
                caretClassOf(isLive)
              )}
            />
          </span>
        )}
        <span className='invisible'>{rest}</span>
      </span>
    </span>
  );
}
