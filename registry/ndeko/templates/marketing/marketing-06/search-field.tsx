'use client';

import { useRef } from 'react';

import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

type SearchFieldProps = {
  id: string;
  value: string;
  label: string;
  placeholder: string;
  size?: 'default' | 'lg';
  onChange: (query: string) => void;
  onEnter: () => void;
};

export function SearchField({
  id,
  value,
  label,
  placeholder,
  size = 'default',
  onChange,
  onEnter,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = value !== '';

  function pressKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onEnter();
      return;
    }
    const clears = event.key === 'Escape' && hasQuery;
    if (clears) {
      event.preventDefault();
      event.stopPropagation();
      onChange('');
    }
  }

  /** The cross leaves with the search it cleared, so its field takes the focus back. */
  function clear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className='relative'>
      <label htmlFor={id} className='sr-only'>
        {label}
      </label>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        id={id}
        type='search'
        size={size}
        autoComplete='off'
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={pressKey}
        className='ps-8 pe-8'
      />
      {hasQuery && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Clear the search'
          onClick={clear}
          className='text-muted-foreground absolute end-1 top-1/2 size-6 -translate-y-1/2'
        >
          <XIcon className='size-3.5' />
        </Button>
      )}
    </div>
  );
}
