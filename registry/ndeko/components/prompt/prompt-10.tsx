'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import {
  EllipsisIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { Marked, includesQuery } from './_parts/marked';
import { countOf } from './_parts/words';

export type Conversation = {
  id: string;
  title: string;
  /** The last message, searched along with the title. */
  preview: string;
  updatedAt: number;
  isPinned: boolean;
};

type GroupId = 'pinned' | 'today' | 'yesterday' | 'week' | 'older';

const GROUP_ORDER: GroupId[] = [
  'pinned',
  'today',
  'yesterday',
  'week',
  'older',
];

const GROUP_LABEL: Record<GroupId, string> = {
  pinned: 'Pinned',
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Previous 7 days',
  older: 'Older',
};

const DAY_MS = 24 * 60 * 60 * 1000;

type Entry =
  | { kind: 'heading'; key: string; label: string }
  | { kind: 'row'; key: string; conversation: Conversation; group: GroupId };

type RowMode = 'view' | 'rename' | 'confirm';

function dayOf(time: number) {
  return Math.floor(time / DAY_MS);
}

function groupOf(conversation: Conversation, now: number): GroupId {
  if (conversation.isPinned) {
    return 'pinned';
  }
  const age = dayOf(now) - dayOf(conversation.updatedAt);
  if (age <= 0) {
    return 'today';
  }
  if (age === 1) {
    return 'yesterday';
  }
  if (age <= 7) {
    return 'week';
  }
  return 'older';
}

function matchesConversation(conversation: Conversation, query: string) {
  const text = `${conversation.title} ${conversation.preview}`;
  return includesQuery(text, query);
}

function byGroupThenRecent(now: number) {
  return function compare(first: Conversation, second: Conversation) {
    const firstGroup = GROUP_ORDER.indexOf(groupOf(first, now));
    const secondGroup = GROUP_ORDER.indexOf(groupOf(second, now));
    const groupOrder = firstGroup - secondGroup;
    if (groupOrder !== 0) {
      return groupOrder;
    }
    return second.updatedAt - first.updatedAt;
  };
}

/** Headings and rows in one list, so a pinned row glides to its new group instead of jumping. */
function entriesOf(conversations: Conversation[], now: number, query: string) {
  const matching = conversations.filter((conversation) =>
    matchesConversation(conversation, query)
  );
  const sorted = [...matching].sort(byGroupThenRecent(now));
  const entries: Entry[] = [];
  let lastGroup: GroupId | null = null;
  for (const conversation of sorted) {
    const group = groupOf(conversation, now);
    if (group !== lastGroup) {
      entries.push({
        kind: 'heading',
        key: `heading-${group}`,
        label: GROUP_LABEL[group],
      });
      lastGroup = group;
    }
    entries.push({ kind: 'row', key: conversation.id, conversation, group });
  }
  return entries;
}

function rowsOf(entries: Entry[]) {
  const rows: Conversation[] = [];
  for (const entry of entries) {
    if (entry.kind === 'row') {
      rows.push(entry.conversation);
    }
  }
  return rows;
}

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground';
}

function pinLabelOf(isPinned: boolean) {
  if (isPinned) {
    return 'Unpin';
  }
  return 'Pin';
}

type RenameFieldProps = {
  title: string;
  onEnd: (title: string | null) => void;
};

/** Mounted for each rename, so it starts from the current title; Enter or leaving saves, Escape keeps the old one. */
function RenameField({ title, onEnd }: RenameFieldProps) {
  const [draft, setDraft] = useState(title);
  const isDone = useRef(false);

  function end(next: string | null) {
    if (isDone.current) {
      return;
    }
    isDone.current = true;
    onEnd(next);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      end(draft);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      end(null);
    }
  }

  return (
    <input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeys}
      onBlur={() => end(draft)}
      onFocus={(event) => event.currentTarget.select()}
      aria-label='Rename the chat'
      autoFocus
      className='bg-card hairline-ring ring-ring/40 focus-visible:ring-ring/25 relative h-7 w-full min-w-0 rounded-md px-2 text-[13px] outline-none focus-visible:ring-[3px]'
    />
  );
}

type ConversationRowProps = {
  conversation: Conversation;
  group: GroupId;
  query: string;
  isActive: boolean;
  isTabStop: boolean;
  mode: RowMode;
  highlightId: string;
  onSelect: (id: string) => void;
  onKeys: (event: React.KeyboardEvent<HTMLButtonElement>, id: string) => void;
  onStartRename: (id: string) => void;
  onEndRename: (id: string, title: string | null) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: (id: string) => void;
  onDelete: (id: string) => void;
  onPinChange: (id: string, isPinned: boolean) => void;
};

function ConversationRow({
  conversation,
  group,
  query,
  isActive,
  isTabStop,
  mode,
  highlightId,
  onSelect,
  onKeys,
  onStartRename,
  onEndRename,
  onAskDelete,
  onCancelDelete,
  onDelete,
  onPinChange,
}: ConversationRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const tabIndex = tabIndexOf(isTabStop);
  const groupWord = GROUP_LABEL[group];
  const isRenaming = mode === 'rename';
  const isConfirming = mode === 'confirm';
  const isViewing = mode === 'view';
  const showsHighlight = isActive && isViewing;

  function handleConfirmKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancelDelete(conversation.id);
    }
  }

  return (
    <div
      data-row={conversation.id}
      className={cn(
        'group/row relative flex h-8 items-center rounded-md transition-colors duration-150',
        isConfirming && 'bg-destructive/[0.07]'
      )}
    >
      {showsHighlight && (
        <motion.span
          layoutId={highlightId}
          transition={spring}
          aria-hidden='true'
          className='bg-foreground/[0.06] dark:bg-foreground/[0.08] absolute inset-0 rounded-md'
        />
      )}
      {isRenaming && (
        <RenameField
          title={conversation.title}
          onEnd={(title) => onEndRename(conversation.id, title)}
        />
      )}
      {isConfirming && (
        <div
          role='group'
          aria-label={`Delete “${conversation.title}”?`}
          onKeyDown={handleConfirmKeys}
          className='flex w-full min-w-0 items-center gap-1.5 ps-2 pe-0.5'
        >
          <p className='text-destructive-ink min-w-0 flex-1 truncate text-xs'>
            Delete this chat?
          </p>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            data-action='confirm-delete'
            onClick={() => onDelete(conversation.id)}
            className='h-6 px-2'
          >
            Delete
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onCancelDelete(conversation.id)}
            className='h-6 px-2'
          >
            Cancel
          </Button>
        </div>
      )}
      {isViewing && (
        <>
          <button
            type='button'
            data-action='open'
            tabIndex={tabIndex}
            aria-current={currentOf(isActive)}
            aria-keyshortcuts='F2 Delete'
            onClick={() => onSelect(conversation.id)}
            onKeyDown={(event) => onKeys(event, conversation.id)}
            className={cn(
              'focus-visible:ring-ring/25 relative flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md ps-2 pe-8 text-start text-[13px] outline-none focus-visible:ring-[3px]',
              rowToneOf(isActive)
            )}
          >
            {conversation.isPinned && (
              <PinIcon className='text-muted-foreground size-3.5 shrink-0' />
            )}
            <span className='truncate'>
              <Marked text={conversation.title} query={query} />
            </span>
            <span className='sr-only'>, {groupWord}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  tabIndex={tabIndex}
                  data-action='menu'
                  aria-label={`More for “${conversation.title}”`}
                  className='text-muted-foreground absolute end-0.5 size-7 opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100'
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-44'>
              <DropdownMenuItem
                onClick={() =>
                  onPinChange(conversation.id, !conversation.isPinned)
                }
              >
                {conversation.isPinned && <PinOffIcon />}
                {!conversation.isPinned && <PinIcon />}
                {pinLabelOf(conversation.isPinned)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStartRename(conversation.id)}>
                <PencilIcon />
                Rename
                <DropdownMenuShortcut>F2</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => onAskDelete(conversation.id)}
              >
                <TrashIcon />
                Delete
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

function tabIndexOf(isTabStop: boolean) {
  if (isTabStop) {
    return 0;
  }
  return -1;
}

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'page';
  }
  return undefined;
}

function nextFocusOf(key: string, index: number, count: number) {
  if (key === 'ArrowDown') {
    return Math.min(count - 1, index + 1);
  }
  if (key === 'ArrowUp') {
    return Math.max(0, index - 1);
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return count - 1;
  }
  return null;
}

function isDeleteKey(key: string) {
  return key === 'Delete' || key === 'Backspace';
}

/** The row that holds the single tab stop: the focused one if it is still shown, else the active one, else the first. */
function tabStopOf(
  rows: Conversation[],
  focusId: string | null,
  activeId: string
) {
  const isFocusShown = rows.some((row) => row.id === focusId);
  if (isFocusShown) {
    return focusId;
  }
  const isActiveShown = rows.some((row) => row.id === activeId);
  if (isActiveShown) {
    return activeId;
  }
  return rows[0]?.id ?? null;
}

function resultsLineOf(query: string, count: number) {
  const trimmed = query.trim();
  if (trimmed === '') {
    return '';
  }
  if (count === 0) {
    return `No chat matches “${trimmed}”`;
  }
  return countOf(count, 'chat');
}

export type ConversationListProps = {
  conversations: Conversation[];
  activeId: string;
  /** The time the groups are counted from: Today, Yesterday, Previous 7 days. */
  now: number;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPinChange: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  className?: string;
};

export function ConversationList({
  conversations,
  activeId,
  now,
  onSelect,
  onRename,
  onPinChange,
  onDelete,
  className,
}: ConversationListProps) {
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const searchId = useId();
  const highlightId = useId();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);
  const rowTransition = { ...rowPresence.transition, layout: spring };
  const entries = entriesOf(conversations, now, query);
  const rows = rowsOf(entries);
  const tabStopId = tabStopOf(rows, focusId, activeId);
  const isEmpty = rows.length === 0;
  const hasQuery = query !== '';
  const results = resultsLineOf(query, rows.length);
  const message = announcementOrResults(announcement, results);

  function focusRow(id: string, action: string) {
    setFocusId(id);
    requestAnimationFrame(() => {
      const selector = `[data-row="${id}"] [data-action="${action}"]`;
      const target = listRef.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function modeOf(id: string): RowMode {
    if (renamingId === id) {
      return 'rename';
    }
    if (confirmingId === id) {
      return 'confirm';
    }
    return 'view';
  }

  function startRename(id: string) {
    setConfirmingId(null);
    setRenamingId(id);
    setFocusId(id);
  }

  function endRename(id: string, title: string | null) {
    setRenamingId(null);
    const trimmed = title?.trim() ?? '';
    const hasTitle = trimmed !== '';
    if (hasTitle) {
      onRename(id, trimmed);
      setAnnouncement(`Renamed to ${trimmed}`);
    }
    focusRow(id, 'open');
  }

  function askDelete(id: string) {
    setRenamingId(null);
    setConfirmingId(id);
    setFocusId(id);
    setAnnouncement('Delete this chat? Enter deletes it, Escape keeps it');
    focusRow(id, 'confirm-delete');
  }

  function cancelDelete(id: string) {
    setConfirmingId(null);
    setAnnouncement('Kept the chat');
    focusRow(id, 'open');
  }

  function remove(id: string) {
    const index = rows.findIndex((row) => row.id === id);
    const neighbour = rows[index + 1] ?? rows[index - 1];
    const removed = rows[index];
    const wasActive = id === activeId;
    setConfirmingId(null);
    onDelete(id);
    setAnnouncement(`Deleted “${removed?.title ?? ''}”`);
    if (!neighbour) {
      return;
    }
    if (wasActive) {
      onSelect(neighbour.id);
    }
    focusRow(neighbour.id, 'open');
  }

  function changePin(id: string, isPinned: boolean) {
    onPinChange(id, isPinned);
    setAnnouncement(pinMessageOf(isPinned));
    focusRow(id, 'open');
  }

  function select(id: string) {
    setFocusId(id);
    onSelect(id);
  }

  function handleRowKeys(
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: string
  ) {
    if (event.key === 'F2') {
      event.preventDefault();
      startRename(id);
      return;
    }
    if (isDeleteKey(event.key)) {
      event.preventDefault();
      askDelete(id);
      return;
    }
    const index = rows.findIndex((row) => row.id === id);
    const nextIndex = nextFocusOf(event.key, index, rows.length);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const next = rows[nextIndex];
    focusRow(next.id, 'open');
  }

  function clearSearch() {
    setQuery('');
  }

  return (
    <nav
      aria-label='Chat history'
      className={cn('flex flex-col gap-2', className)}
    >
      <div className='relative'>
        <label htmlFor={searchId} className='sr-only'>
          Search chats
        </label>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
        <Input
          id={searchId}
          type='search'
          size='sm'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search chats'
          className='ps-8 pe-8'
        />
        {hasQuery && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Clear the search'
            onClick={clearSearch}
            className='text-muted-foreground absolute end-0.5 top-1/2 size-6 -translate-y-1/2'
          >
            <XIcon className='size-3.5' />
          </Button>
        )}
      </div>
      <ul ref={listRef} aria-label='Chats' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.li
              key={entry.key}
              role={roleOf(entry)}
              layout='position'
              className='overflow-hidden'
              {...rowPresence}
              transition={rowTransition}
            >
              {entry.kind === 'heading' && (
                <p
                  aria-hidden='true'
                  className='text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium'
                >
                  {entry.label}
                </p>
              )}
              {entry.kind === 'row' && (
                <ConversationRow
                  conversation={entry.conversation}
                  group={entry.group}
                  query={query}
                  isActive={entry.conversation.id === activeId}
                  isTabStop={entry.conversation.id === tabStopId}
                  mode={modeOf(entry.conversation.id)}
                  highlightId={highlightId}
                  onSelect={select}
                  onKeys={handleRowKeys}
                  onStartRename={startRename}
                  onEndRename={endRename}
                  onAskDelete={askDelete}
                  onCancelDelete={cancelDelete}
                  onDelete={remove}
                  onPinChange={changePin}
                />
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div key='empty' className='overflow-hidden' {...rowPresence}>
            <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col items-center gap-2.5 rounded-lg px-3 py-5 text-center'>
              <p className='text-muted-foreground text-[13px] text-balance'>
                {emptyLineOf(query)}
              </p>
              {hasQuery && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={clearSearch}
                >
                  Clear the search
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LiveRegion message={message} />
    </nav>
  );
}

function roleOf(entry: Entry) {
  if (entry.kind === 'heading') {
    return 'presentation';
  }
  return undefined;
}

function emptyLineOf(query: string) {
  const trimmed = query.trim();
  if (trimmed === '') {
    return 'No chats yet';
  }
  return `No chat matches “${trimmed}”`;
}

function announcementOrResults(announcement: string, results: string) {
  if (results !== '') {
    return results;
  }
  return announcement;
}

function pinMessageOf(isPinned: boolean) {
  if (isPinned) {
    return 'Pinned. It moved to the Pinned group';
  }
  return 'Unpinned. It went back to its day';
}

const HOUR_MS = 60 * 60 * 1000;

/** A fixed afternoon, so the groups read the same in every catalogue visit. */
const NOW = Date.UTC(2026, 2, 18, 15, 0);

const CONVERSATIONS: Conversation[] = [
  {
    id: 'vendor-review',
    title: 'Q3 vendor review',
    preview: 'Six lines were billed above the list price',
    updatedAt: NOW - 2 * DAY_MS,
    isPinned: true,
  },
  {
    id: 'style-guide',
    title: 'Writing style guide',
    preview: 'Keep vendor emails under 150 words',
    updatedAt: NOW - 5 * DAY_MS,
    isPinned: true,
  },
  {
    id: 'credit-request',
    title: 'Brightmoor credit request',
    preview: 'Draft ready, 186 words',
    updatedAt: NOW - 4 * HOUR_MS,
    isPinned: false,
  },
  {
    id: 'shipping-terms',
    title: 'Shipping terms compared',
    preview: 'Brightmoor ships within 3 working days',
    updatedAt: NOW - 6 * HOUR_MS,
    isPinned: false,
  },
  {
    id: 'csv-import',
    title: 'Fix the invoice CSV import',
    preview: 'The SKU column was missing',
    updatedAt: NOW - 7 * HOUR_MS,
    isPinned: false,
  },
  {
    id: 'refund-policy',
    title: 'Refund policy summary',
    preview: 'Store credit only, within 14 days',
    updatedAt: NOW - 1 * DAY_MS,
    isPinned: false,
  },
  {
    id: 'onboarding',
    title: 'Onboarding email draft',
    preview: 'Welcome to Atlas, here is your first week',
    updatedAt: NOW - 1 * DAY_MS - 3 * HOUR_MS,
    isPinned: false,
  },
  {
    id: 'roadmap',
    title: 'Atlas roadmap questions',
    preview: 'Billing settings move to the account page',
    updatedAt: NOW - 3 * DAY_MS,
    isPinned: false,
  },
  {
    id: 'pricing-copy',
    title: 'Pricing page copy',
    preview: 'One plan, billed monthly or yearly',
    updatedAt: NOW - 4 * DAY_MS,
    isPinned: false,
  },
  {
    id: 'offsite',
    title: 'Team offsite agenda',
    preview: 'Half a day for the roadmap',
    updatedAt: NOW - 6 * DAY_MS,
    isPinned: false,
  },
];

export default function Prompt10() {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState('credit-request');

  function update(id: string, patch: Partial<Conversation>) {
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== id) {
          return conversation;
        }
        return { ...conversation, ...patch };
      })
    );
  }

  function rename(id: string, title: string) {
    update(id, { title });
  }

  function changePin(id: string, isPinned: boolean) {
    update(id, { isPinned });
  }

  function remove(id: string) {
    setConversations((current) =>
      current.filter((conversation) => conversation.id !== id)
    );
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-[19rem] flex-col rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        now={NOW}
        onSelect={setActiveId}
        onRename={rename}
        onPinChange={changePin}
        onDelete={remove}
      />
    </div>
  );
}
