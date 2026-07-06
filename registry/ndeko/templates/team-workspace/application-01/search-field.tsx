'use client';

import { useEffect, useRef } from 'react';

import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { Swap } from './motion-parts';

const TYPING_TARGETS = 'input, textarea, select, [contenteditable="true"]';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest(TYPING_TARGETS));
}

function hasModifier(event: KeyboardEvent) {
  const isCommand = event.metaKey || event.ctrlKey;
  return isCommand || event.altKey;
}

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;

  useEffect(() => {
    function focusOnSlash(event: KeyboardEvent) {
      if (event.key !== '/') {
        return;
      }
      if (hasModifier(event)) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', focusOnSlash);
    return () => document.removeEventListener('keydown', focusOnSlash);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    if (hasValue) {
      onChange('');
      return;
    }
    inputRef.current?.blur();
  }

  function clear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className={cn('relative', className)}>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        type='search'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className='ps-8 pe-9'
      />
      <Swap
        swapKey={String(hasValue)}
        className='absolute end-1.5 top-1/2 -translate-y-1/2'
      >
        {hasValue && (
          <button
            type='button'
            onClick={clear}
            aria-label='Clear search'
            className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex size-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
          >
            <XIcon className='size-3.5' />
          </button>
        )}
        {!hasValue && <Kbd className='me-0.5'>/</Kbd>}
      </Swap>
    </div>
  );
}
