'use client';

import { useId } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { SECTION } from './data';

type SearchFieldProps = {
  query: string;
  listId: string;
  isClearPressed: boolean;
  onType: (value: string) => void;
  onClear: () => void;
};

export function SearchField({
  query,
  listId,
  isClearPressed,
  onType,
  onClear,
}: SearchFieldProps) {
  const inputId = useId();
  const hasQuery = query !== '';

  function clearOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && hasQuery) {
      event.preventDefault();
      onClear();
    }
  }

  return (
    <div className='relative'>
      <label htmlFor={inputId} className='sr-only'>
        {SECTION.searchLabel}
      </label>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2' />
      <Input
        id={inputId}
        type='search'
        size='lg'
        autoComplete='off'
        spellCheck={false}
        placeholder={SECTION.searchPlaceholder}
        aria-controls={listId}
        value={query}
        onChange={(event) => onType(event.target.value)}
        onKeyDown={clearOnEscape}
        className='ps-9 pe-10'
      />
      {hasQuery && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Clear the search'
          onClick={onClear}
          className={cn(
            'text-muted-foreground absolute end-1 top-1/2 -translate-y-1/2',
            pressedQuietOf(isClearPressed)
          )}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
