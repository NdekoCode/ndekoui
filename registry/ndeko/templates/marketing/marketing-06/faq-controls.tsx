'use client';

import { useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import type { TopicCount, TopicFilter } from './faq-model';

type FaqSearchProps = {
  id: string;
  value: string;
  onChange: (query: string) => void;
};

export function FaqSearch({ id, value, onChange }: FaqSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = value !== '';

  function clearOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    const clears = event.key === 'Escape' && hasQuery;
    if (clears) {
      event.preventDefault();
      onChange('');
    }
  }

  /** The cross leaves with the search it cleared, so its field takes the focus back. */
  function clear() {
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className='relative w-full @2xl:max-w-xs'>
      <label htmlFor={id} className='sr-only'>
        Search the questions
      </label>
      <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        id={id}
        type='search'
        size='lg'
        autoComplete='off'
        spellCheck={false}
        placeholder='Search the questions'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={clearOnEscape}
        className='ps-8 pe-8'
      />
      {hasQuery && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Clear the search'
          onClick={clear}
          className='text-muted-foreground absolute end-1 top-1/2 size-7 -translate-y-1/2'
        >
          <XIcon className='size-3.5' />
        </Button>
      )}
    </div>
  );
}

type TopicChipsProps = {
  counts: TopicCount[];
  topic: TopicFilter;
  pressed: string | null;
  onPick: (topic: TopicFilter) => void;
};

export function TopicChips({
  counts,
  topic,
  pressed,
  onPick,
}: TopicChipsProps) {
  return (
    <div
      role='group'
      aria-label='Topics'
      className='flex flex-wrap items-center gap-2'
    >
      {counts.map((entry) => {
        const isPicked = entry.id === topic;
        const isEmpty = entry.count === 0;

        function pick() {
          onPick(entry.id);
        }

        return (
          <button
            key={entry.id}
            type='button'
            aria-pressed={isPicked}
            disabled={isEmpty}
            onClick={pick}
            className={cn(
              'bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-[background-color,color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
              FOCUS_RING,
              pressedQuietOf(pressed === `topic-${entry.id}`)
            )}
          >
            {entry.label}
            <MotionNumber value={entry.count} className='text-xs opacity-70' />
          </button>
        );
      })}
    </div>
  );
}
