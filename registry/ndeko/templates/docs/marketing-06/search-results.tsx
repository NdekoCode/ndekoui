'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { nounOf } from '@/registry/ndeko/lib/words';

import { markedPartsOf, searchOf, wordsOf, type SearchResult } from './search';

export function Marked({ text, words }: { text: string; words: string[] }) {
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

function hrefOf(result: SearchResult) {
  const { entry } = result;
  if (entry.headingId === null) {
    return `#${entry.pageId}`;
  }
  return `#${entry.pageId}-${entry.headingId}`;
}

type SearchResultsProps = {
  query: string;
  pressed: string | null;
  onOpen: (result: SearchResult) => void;
  onClear: () => void;
};

export function SearchResults({
  query,
  pressed,
  onOpen,
  onClear,
}: SearchResultsProps) {
  const words = wordsOf(query);
  const results = searchOf(query);
  const hasResults = results.length > 0;
  const hasWords = words.length > 0;
  const noun = nounOf(results.length, 'result');

  if (!hasWords) {
    return null;
  }
  if (!hasResults) {
    return (
      <div className='flex flex-col items-start gap-2'>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          No page holds “{query.trim()}”.
        </p>
        <button
          type='button'
          onClick={onClear}
          className={cn(
            'text-primary-ink rounded-sm text-xs font-medium underline-offset-4 hover:underline',
            FOCUS_RING
          )}
        >
          Clear the search
        </button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <p className='text-muted-foreground flex items-baseline gap-1 px-2 text-xs'>
        <MotionNumber value={results.length} />
        {noun}
      </p>
      <ul aria-label='Search results' className='flex flex-col'>
        {results.map((result, index) => {
          const { entry } = result;

          function open(event: React.MouseEvent<HTMLAnchorElement>) {
            event.preventDefault();
            onOpen(result);
          }

          return (
            <li key={entry.key}>
              <a
                href={hrefOf(result)}
                onClick={open}
                className={cn(
                  'hover:bg-foreground/[0.04] flex flex-col gap-0.5 rounded-lg px-2 py-2 text-start transition-colors duration-100',
                  FOCUS_RING,
                  pressedQuietOf(pressed === `result-${index}`)
                )}
              >
                <span className='text-[13px] leading-5 font-medium'>
                  <Marked text={entry.title} words={words} />
                </span>
                <span className='text-muted-foreground text-xs'>
                  {entry.crumb}
                </span>
                <span className='text-muted-foreground text-xs leading-5 text-pretty'>
                  <Marked text={result.snippet} words={words} />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
