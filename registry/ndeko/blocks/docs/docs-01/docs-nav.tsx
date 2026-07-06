'use client';

import { useId, useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { DOCS, NAV } from './data';
import { itemsMatching, markedPartsOf, wordsOf } from './match';

function currentOf(isCurrent: boolean): 'page' | undefined {
  if (isCurrent) {
    return 'page';
  }
  return undefined;
}

function Marked({ text, words }: { text: string; words: string[] }) {
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

type DocsNavProps = {
  query: string;
  pressed: string | null;
  onSearch: (query: string) => void;
  /** Called when a page is picked, so a sheet that holds the list can close. */
  onPick?: () => void;
};

export function DocsNav({ query, pressed, onSearch, onPick }: DocsNavProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const baseId = useId();
  const words = wordsOf(query);
  const isSearching = words.length > 0;
  const hasQuery = query !== '';
  const sections = NAV.map((section) => ({
    section,
    items: itemsMatching(section.items, words),
  }));
  const shown = sections.filter((entry) => entry.items.length > 0);
  const isEmpty = isSearching && shown.length === 0;

  function clearOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    const clears = event.key === 'Escape' && hasQuery;
    if (!clears) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onSearch('');
  }

  /** The clear control leaves with the search it cleared, so its field takes the focus back. */
  function clearSearch() {
    onSearch('');
    inputRef.current?.focus();
  }

  /** The empty state leaves with the search too: a keyboard goes back to the field. */
  function showEveryPage(event: React.MouseEvent<HTMLButtonElement>) {
    onSearch('');
    const isFromKeyboard = event.currentTarget.matches(':focus-visible');
    if (isFromKeyboard) {
      inputRef.current?.focus();
    }
  }

  return (
    <nav aria-label='Documentation' className='flex flex-col gap-5'>
      <div className='relative'>
        <label htmlFor={searchId} className='sr-only'>
          Search the docs
        </label>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
        <Input
          ref={inputRef}
          id={searchId}
          type='search'
          autoComplete='off'
          spellCheck={false}
          placeholder='Search the docs'
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          onKeyDown={clearOnEscape}
          className='ps-8 pe-8'
        />
        {hasQuery && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Clear the search'
            onClick={clearSearch}
            className={cn(
              'text-muted-foreground absolute end-1 top-1/2 size-6 -translate-y-1/2',
              pressedQuietOf(pressed === 'nav-clear')
            )}
          >
            <XIcon className='size-3.5' />
          </Button>
        )}
      </div>

      {shown.map(({ section, items }) => {
        const titleId = `${baseId}-${section.id}`;
        return (
          <section
            key={section.id}
            aria-labelledby={titleId}
            className='flex flex-col gap-1'
          >
            <h3 className='text-muted-foreground flex items-center justify-between gap-2 px-2 text-xs font-medium'>
              <span id={titleId}>{section.title}</span>
              <MotionNumber value={items.length} className='tabular-nums' />
            </h3>
            <ul className='flex flex-col'>
              {items.map((item) => {
                const isCurrent = item.id === DOCS.currentId;
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      aria-current={currentOf(isCurrent)}
                      onClick={onPick}
                      className={cn(
                        'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground block rounded-md px-2 py-1.5 text-[13px] transition-colors duration-100',
                        isCurrent && 'bg-foreground/[0.06] text-foreground',
                        FOCUS_RING
                      )}
                    >
                      <Marked text={item.title} words={words} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {isEmpty && (
        <div className='flex flex-col items-start gap-2 px-2'>
          <p className='text-muted-foreground text-[13px] text-pretty'>
            No page title holds “{query.trim()}”.
          </p>
          <button
            type='button'
            onClick={showEveryPage}
            className={cn(
              'text-primary-ink rounded-sm text-xs font-medium underline-offset-4 hover:underline',
              FOCUS_RING
            )}
          >
            Show every page
          </button>
        </div>
      )}
    </nav>
  );
}
