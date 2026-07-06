'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { wordsOf } from '@/registry/ndeko/lib/words';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { Input } from '@/registry/ndeko/ui/input';

import {
  BRAND,
  CHATS,
  DAYS,
  LIVE_ID,
  LIVE_TITLE,
  NEW_ID,
  type Day,
} from './data';
import { isBusy, type ChatState } from './session';

const TITLE_WORDS = 5;

export type RowStatus = 'running' | 'waiting';

export type SidebarRow = {
  id: string;
  title: string;
  day: Day;
  status?: RowStatus;
};

function shortTitleOf(text: string) {
  const words = wordsOf(text);
  const kept = words.slice(0, TITLE_WORDS);
  return kept.join(' ');
}

function liveStatusOf(state: ChatState): RowStatus | undefined {
  if (state.stage === 'asking') {
    return 'waiting';
  }
  if (isBusy(state.stage)) {
    return 'running';
  }
  return undefined;
}

/** The chat the person is in sits first of its day: the new chat, then the one that holds the run, then the older ones. */
export function rowsOf(state: ChatState): SidebarRow[] {
  const rows: SidebarRow[] = [];
  if (state.newLines.length > 0) {
    const title = shortTitleOf(state.newLines[0]);
    rows.push({ id: NEW_ID, title, day: 'Today' });
  }
  if (state.question !== null) {
    const status = liveStatusOf(state);
    rows.push({ id: LIVE_ID, title: LIVE_TITLE, day: 'Today', status });
  }
  for (const chat of CHATS) {
    rows.push({ id: chat.id, title: chat.title, day: chat.day });
  }
  return rows;
}

function needleOf(query: string) {
  const trimmed = query.trim();
  return trimmed.toLowerCase();
}

function matchesQuery(title: string, query: string) {
  const needle = needleOf(query);
  if (needle === '') {
    return true;
  }
  const lowered = title.toLowerCase();
  return lowered.includes(needle);
}

function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const needle = needleOf(query);
  const lowered = title.toLowerCase();
  const index = lowered.indexOf(needle);
  const hasMatch = needle !== '' && index >= 0;
  if (!hasMatch) {
    return <>{title}</>;
  }
  const end = index + needle.length;

  return (
    <>
      {title.slice(0, index)}
      <mark className='bg-primary/15 rounded-[3px] text-inherit'>
        {title.slice(index, end)}
      </mark>
      {title.slice(end)}
    </>
  );
}

const ROW =
  'hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-start text-[13px] outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-inset';

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.07] font-medium';
  }
  return undefined;
}

function currentOf(isActive: boolean): 'page' | undefined {
  if (isActive) {
    return 'page';
  }
  return undefined;
}

const STATUS_DOT: Record<RowStatus, string> = {
  running: 'bg-info',
  waiting: 'bg-warning',
};

const STATUS_WORD: Record<RowStatus, string> = {
  running: 'Running',
  waiting: 'Waiting on you',
};

type ChatRowProps = {
  row: SidebarRow;
  query: string;
  isActive: boolean;
  onOpen: (id: string) => void;
};

function ChatRow({ row, query, isActive, onOpen }: ChatRowProps) {
  function open() {
    onOpen(row.id);
  }

  return (
    <button
      type='button'
      aria-current={currentOf(isActive)}
      onClick={open}
      className={cn(ROW, rowToneOf(isActive))}
    >
      <span className='min-w-0 flex-1 truncate'>
        <HighlightedTitle title={row.title} query={query} />
      </span>
      {row.status && (
        <span className='flex shrink-0 items-center'>
          <span
            aria-hidden='true'
            className={cn('size-1.5 rounded-full', STATUS_DOT[row.status])}
          />
          <span className='sr-only'>{STATUS_WORD[row.status]}</span>
        </span>
      )}
    </button>
  );
}

type SearchFieldProps = {
  value: string;
  onChange: (text: string) => void;
};

function SearchField({ value, onChange }: SearchFieldProps) {
  const hasQuery = value !== '';

  function clear() {
    onChange('');
  }

  /** The first Escape empties the field. A second one is left to the sheet, which closes. */
  function clearFromKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape' || !hasQuery) {
      return;
    }
    event.stopPropagation();
    clear();
  }

  return (
    <div className='relative'>
      <SearchIcon
        aria-hidden='true'
        className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2'
      />
      <Input
        type='search'
        size='sm'
        aria-label='Search chats'
        placeholder='Search chats'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={clearFromKeys}
        className='ps-8 pe-7'
      />
      {hasQuery && (
        <button
          type='button'
          aria-label='Clear the search'
          onClick={clear}
          className='text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-ring/25 absolute end-1.5 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
        >
          <XIcon className='size-3' />
        </button>
      )}
    </div>
  );
}

type AppSidebarProps = {
  rows: SidebarRow[];
  activeId: string;
  search: string;
  onSearch: (text: string) => void;
  onOpen: (id: string) => void;
  onNewChat: () => void;
  className?: string;
};

export function AppSidebar({
  rows,
  activeId,
  search,
  onSearch,
  onOpen,
  onNewChat,
  className,
}: AppSidebarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const shown = rows.filter((row) => matchesQuery(row.title, search));
  const hasNoMatch = shown.length === 0;

  function clearSearch() {
    onSearch('');
  }

  return (
    <div className={cn('flex min-h-0 w-full flex-col gap-3', className)}>
      <div className='flex flex-col gap-2'>
        <div className='flex h-9 items-center gap-2 px-1.5'>
          <CompanyMark seed={BRAND.name} className='size-6 rounded-md' />
          <span className='text-[13px] font-semibold'>{BRAND.name}</span>
        </div>
        <Button
          type='button'
          variant='outline'
          data-new-chat
          onClick={onNewChat}
          className='w-full justify-start'
        >
          <PlusIcon />
          New chat
        </Button>
        <SearchField value={search} onChange={onSearch} />
      </div>
      <nav
        aria-label='Chats'
        className='-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1'
      >
        {DAYS.map((day) => {
          const ofDay = shown.filter((row) => row.day === day);
          if (ofDay.length === 0) {
            return null;
          }
          return (
            <section key={day} className='flex flex-col gap-0.5'>
              <h2 className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
                {day}
              </h2>
              <ul className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {ofDay.map((row) => (
                    <motion.li
                      key={row.id}
                      className='-mx-1 overflow-hidden px-1'
                      {...rowPresence}
                    >
                      <ChatRow
                        row={row}
                        query={search}
                        isActive={row.id === activeId}
                        onOpen={onOpen}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })}
        {hasNoMatch && (
          <div className='flex flex-col items-start gap-1.5 px-2 text-xs'>
            <p className='text-muted-foreground'>
              No chat matches &quot;{search.trim()}&quot;
            </p>
            <Button
              type='button'
              variant='link'
              size='sm'
              onClick={clearSearch}
              className='h-6 px-0'
            >
              Clear the search
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
}
