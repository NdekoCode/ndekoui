'use client';

import { memo, useId, useState } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { PlusIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import {
  GROUP_WORD,
  GROUPS,
  PALETTE,
  pressKeyOf,
  type PaletteEntry,
  type PaletteGroup,
} from './catalog';
import { modelOf } from './data';
import { LogicTile, MarkTile } from './node-tile';
import { toolOf } from './tools';

/** A row is positioned, so the word kept for screen readers inside it stays inside it. */
const ROW =
  'group/entry relative hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 text-start outline-none transition-[background-color,scale] duration-150 ease-(--ease-out-strong) focus-visible:ring-[3px] focus-visible:ring-inset active:scale-[0.97]';

function matchStartOf(text: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return -1;
  }
  const haystack = text.toLowerCase();
  return haystack.indexOf(needle);
}

function matches(entry: PaletteEntry, query: string) {
  const isSearching = query.trim() !== '';
  if (!isSearching) {
    return true;
  }
  return matchStartOf(entry.label, query) >= 0;
}

type MatchedTextProps = {
  text: string;
  query: string;
};

/** The part of a name that answers the search is marked, so it is clear why the entry stayed. */
function MatchedText({ text, query }: MatchedTextProps) {
  const start = matchStartOf(text, query);
  if (start < 0) {
    return text;
  }
  const needle = query.trim();
  const end = start + needle.length;

  return (
    <>
      {text.slice(0, start)}
      <mark className='bg-primary/15 text-foreground rounded-[3px]'>
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function EntryTile({ entry }: { entry: PaletteEntry }) {
  if (entry.group === 'models') {
    const model = modelOf(entry.modelId);
    return <BrandTile brand={model.brand} />;
  }
  if (entry.group === 'tools') {
    const tool = toolOf(entry.toolId);
    return <MarkTile mark={tool.mark} size='md' />;
  }
  return <LogicTile logic={entry.logic} size='md' />;
}

function hintOf(entry: PaletteEntry) {
  if (entry.group === 'logic') {
    return entry.hint;
  }
  return null;
}

type EntryRowProps = {
  entry: PaletteEntry;
  query: string;
  isPressed: boolean;
  onPick: (entry: PaletteEntry) => void;
};

function EntryRow({ entry, query, isPressed, onPick }: EntryRowProps) {
  const hint = hintOf(entry);

  return (
    <button
      type='button'
      onClick={() => onPick(entry)}
      className={cn(ROW, pressedQuietOf(isPressed))}
    >
      <EntryTile entry={entry} />
      <span className='shrink-0 text-[13px] font-medium'>
        <span className='sr-only'>Add </span>
        <MatchedText text={entry.label} query={query} />
      </span>
      <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
        {hint}
      </span>
      <PlusIcon className='text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/entry:opacity-100 group-focus-visible/entry:opacity-100' />
    </button>
  );
}

type GroupListProps = {
  group: PaletteGroup;
  entries: PaletteEntry[];
  query: string;
  pressed: string | null;
  onPick: (entry: PaletteEntry) => void;
};

function GroupList({ group, entries, query, pressed, onPick }: GroupListProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className='flex flex-col'>
      <h3
        id={titleId}
        className='text-muted-foreground flex h-6 items-center px-1.5 text-xs font-medium'
      >
        {GROUP_WORD[group]}
      </h3>
      <ul className='flex flex-col'>
        {entries.map((entry) => (
          <li key={entry.id}>
            <EntryRow
              entry={entry}
              query={query}
              isPressed={pressed === pressKeyOf(entry.id)}
              onPick={onPick}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

type PaletteProps = {
  /** Where a picked step goes, as a line under the title: "After Track the parcel". */
  placement: string;
  pressed: string | null;
  onPick: (entry: PaletteEntry) => void;
  className?: string;
};

/** The steps a flow can be made of. It draws again only when the search, the press or the placement changes. */
export const Palette = memo(function Palette({
  placement,
  pressed,
  onPick,
  className,
}: PaletteProps) {
  const [query, setQuery] = useState('');
  const found = PALETTE.filter((entry) => matches(entry, query));
  const hasQuery = query !== '';
  const hasNothing = found.length === 0;

  function clear() {
    setQuery('');
  }

  /** Enter in the search adds the first step it found. */
  function pickFirstFromKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    const first = found[0];
    const isPick = event.key === 'Enter' && hasQuery;
    if (isPick && first) {
      event.preventDefault();
      onPick(first);
    }
  }

  return (
    <div className={cn('flex min-h-0 w-full flex-col gap-2', className)}>
      <div className='flex flex-col px-1.5'>
        <h2 className='text-[13px] font-semibold'>Add a step</h2>
        <p className='text-muted-foreground truncate text-xs'>{placement}</p>
      </div>
      <div className='relative shrink-0'>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2' />
        <Input
          type='search'
          value={query}
          aria-label='Search the steps'
          placeholder='Search steps'
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={pickFirstFromKeys}
          className='ps-7 pe-8'
        />
        {hasQuery && (
          <button
            type='button'
            aria-label='Clear the search'
            onClick={clear}
            className='text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-ring/25 absolute end-1 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
          >
            <XIcon className='size-3.5' />
          </button>
        )}
      </div>
      <div className='relative -mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-1'>
        {GROUPS.map((group) => {
          const entries = found.filter((entry) => entry.group === group);
          if (entries.length === 0) {
            return null;
          }
          return (
            <GroupList
              key={group}
              group={group}
              entries={entries}
              query={query}
              pressed={pressed}
              onPick={onPick}
            />
          );
        })}
        {hasNothing && (
          <div className='flex flex-col items-start gap-2 px-1.5 py-2'>
            <p className='text-muted-foreground text-[13px] break-words'>
              {`No step matches "${query.trim()}"`}
            </p>
            <Button type='button' variant='outline' size='sm' onClick={clear}>
              Clear the search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
