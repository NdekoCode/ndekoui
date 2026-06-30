'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useId } from 'react';

import {
  ArchiveIcon,
  CheckCheckIcon,
  InboxIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import {
  DAY_LABELS,
  DAY_ORDER,
  type DayGroup,
  type InboxFilter,
  type InboxItem,
} from './data';
import { IssueTypeGem, SenderAvatar } from './glyphs';
import { rowCollapseOf, UnreadDot } from './motion-parts';

const ROW_SELECTOR = '[data-inbox-row]';

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mentions', label: 'Mentions' },
];

const EMPTY_COPY: Record<InboxFilter, { title: string; text: string }> = {
  all: {
    title: 'Your inbox is empty',
    text: 'Mentions, assignments and changes on your tasks arrive here',
  },
  unread: {
    title: 'You are all caught up',
    text: 'Everything in your inbox has been read',
  },
  mentions: {
    title: 'No mentions',
    text: 'When someone writes your name, it shows up here',
  },
};

const ROW_ACTION =
  'relative z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25';

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function isInboxFilter(value: unknown): value is InboxFilter {
  return FILTERS.some((filter) => filter.value === value);
}

function stepOf(key: string) {
  if (key === 'ArrowDown') {
    return 1;
  }
  if (key === 'ArrowUp') {
    return -1;
  }
  return 0;
}

/** Up and down move between rows, like a mail list; Tab still walks every control. */
function moveRowFocus(event: React.KeyboardEvent<HTMLDivElement>) {
  const step = stepOf(event.key);
  if (step === 0) {
    return;
  }
  const rows = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(ROW_SELECTOR)
  );
  if (rows.length === 0) {
    return;
  }
  event.preventDefault();
  const active = document.activeElement;
  const current = rows.findIndex((row) => row === active);
  const target = current + step;
  const lastIndex = rows.length - 1;
  const clamped = Math.max(0, target);
  const next = Math.min(lastIndex, clamped);
  rows[next].focus();
}

function senderLineOf(item: InboxItem) {
  if (item.kind === 'mention') {
    return `${item.sender.name} mentioned you`;
  }
  if (item.kind === 'comment') {
    return `${item.sender.name} commented`;
  }
  if (item.kind === 'assigned') {
    return `${item.sender.name} assigned it to you`;
  }
  return `${item.sender.name} changed the status`;
}

function itemsOfDay(items: InboxItem[], day: DayGroup) {
  return items.filter((item) => item.day === day);
}

/** Only the Unread tab carries a count, so only it needs a spoken label. */
function tabLabelOf(filter: InboxFilter, unreadCount: number) {
  if (filter !== 'unread') {
    return undefined;
  }
  if (unreadCount === 0) {
    return 'Unread';
  }
  return `Unread, ${unreadCount}`;
}

type RowProps = {
  item: InboxItem;
  isSelected: boolean;
  indicatorId: string;
  onSelect: (itemId: string) => void;
  onArchive: (itemId: string) => void;
};

function InboxRow({
  item,
  isSelected,
  indicatorId,
  onSelect,
  onArchive,
}: RowProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <div className='group/row relative flex items-start gap-3 rounded-lg py-2.5 ps-4 pe-2.5'>
        {isSelected && (
          <motion.span
            layoutId={indicatorId}
            aria-hidden='true'
            transition={travelOf(shouldReduceMotion)}
            className='bg-foreground/[0.05] absolute inset-0 rounded-lg'
          />
        )}
        <UnreadDot
          isUnread={item.isUnread}
          className='absolute start-1.5 top-[1.15rem]'
        />
        <SenderAvatar person={item.sender} kind={item.kind} />
        <button
          type='button'
          data-inbox-row=''
          aria-current={isSelected}
          onClick={() => onSelect(item.id)}
          className='focus-visible:after:ring-ring/25 min-w-0 flex-1 cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px]'
        >
          <span className='flex min-w-0 items-center gap-1.5'>
            <IssueTypeGem type={item.task.type} />
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {item.task.key}
            </span>
            <span
              className={cn(
                'truncate text-[13px] font-medium transition-colors duration-200',
                !item.isUnread && 'text-muted-foreground'
              )}
            >
              {item.task.title}
            </span>
          </span>
          <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
            {senderLineOf(item)}
          </span>
          <span className='sr-only'>
            , {item.time}
            {item.isUnread && ', unread'}
          </span>
        </button>
        <span className='relative flex h-5 shrink-0 items-center'>
          <span
            aria-hidden='true'
            className='text-muted-foreground text-xs tabular-nums transition-opacity duration-150 group-focus-within/row:opacity-0 group-hover/row:opacity-0 pointer-coarse:hidden'
          >
            {item.time}
          </span>
          <span className='absolute end-0 flex opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:static pointer-coarse:opacity-100'>
            <Tooltip>
              <TooltipTrigger
                aria-label={`Archive ${item.task.key}`}
                onClick={() => onArchive(item.id)}
                className={ROW_ACTION}
              >
                <ArchiveIcon className='size-3.5' />
              </TooltipTrigger>
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>
          </span>
        </span>
      </div>
    </motion.li>
  );
}

type DaySectionProps = {
  day: DayGroup;
  items: InboxItem[];
  selectedId: string | null;
  indicatorId: string;
  onSelect: (itemId: string) => void;
  onArchive: (itemId: string) => void;
};

function DaySection({
  day,
  items,
  selectedId,
  indicatorId,
  onSelect,
  onArchive,
}: DaySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const headingId = useId();

  return (
    <motion.section
      aria-labelledby={headingId}
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <h3
        id={headingId}
        className='text-muted-foreground flex items-center gap-1.5 px-3 pt-3 pb-1 text-xs'
      >
        {DAY_LABELS[day]}
        <span className='text-muted-foreground/75 tabular-nums'>
          {items.length}
        </span>
      </h3>
      <ul>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              indicatorId={indicatorId}
              onSelect={onSelect}
              onArchive={onArchive}
            />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

function EmptyInbox({
  filter,
  onShowAll,
}: {
  filter: InboxFilter;
  onShowAll: () => void;
}) {
  const copy = EMPTY_COPY[filter];
  const isFiltered = filter !== 'all';

  return (
    <div className='flex flex-col items-center px-6 py-12 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <InboxIcon />
      </span>
      <p className='mt-3 text-sm font-medium'>{copy.title}</p>
      <p className='text-muted-foreground mt-1 max-w-64 text-[13px] text-balance'>
        {copy.text}
      </p>
      {isFiltered && (
        <Button
          size='sm'
          variant='outline'
          onClick={onShowAll}
          className='mt-4'
        >
          Show all notifications
        </Button>
      )}
    </div>
  );
}

type InboxListProps = {
  items: InboxItem[];
  filter: InboxFilter;
  unreadCount: number;
  selectedId: string | null;
  onFilterChange: (filter: InboxFilter) => void;
  onSelect: (itemId: string) => void;
  onArchive: (itemId: string) => void;
  onMarkAllRead: () => void;
};

export function InboxList({
  items,
  filter,
  unreadCount,
  selectedId,
  onFilterChange,
  onSelect,
  onArchive,
  onMarkAllRead,
}: InboxListProps) {
  const shouldReduceMotion = useReducedMotion();
  const indicatorId = useId();
  const hasUnread = unreadCount > 0;
  const isEmpty = items.length === 0;
  const days = DAY_ORDER.filter((day) => itemsOfDay(items, day).length > 0);

  function changeFilter(value: unknown) {
    if (isInboxFilter(value)) {
      onFilterChange(value);
    }
  }

  function showAll() {
    onFilterChange('all');
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex items-center justify-between gap-2 px-3 pt-3 pb-1'>
        <Tabs value={filter} onValueChange={changeFilter}>
          <TabsList variant='segmented' aria-label='Filter notifications'>
            {FILTERS.map((option) => {
              const isUnreadTab = option.value === 'unread';
              const showsCount = isUnreadTab && hasUnread;
              return (
                <TabsTab
                  key={option.value}
                  value={option.value}
                  aria-label={tabLabelOf(option.value, unreadCount)}
                >
                  {option.label}
                  {showsCount && (
                    <span
                      aria-hidden='true'
                      className='bg-foreground/[0.07] text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-[5px] px-1 text-[11px] tabular-nums'
                    >
                      {unreadCount}
                    </span>
                  )}
                </TabsTab>
              );
            })}
          </TabsList>
        </Tabs>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Mark all as read'
                disabled={!hasUnread}
                onClick={onMarkAllRead}
                className='text-muted-foreground'
              />
            }
          >
            <CheckCheckIcon />
          </TooltipTrigger>
          <TooltipContent>Mark all as read</TooltipContent>
        </Tooltip>
      </div>
      <div
        onKeyDown={moveRowFocus}
        className='min-h-0 flex-1 overflow-y-auto px-2 pb-2'
      >
        <AnimatePresence initial={false}>
          {days.map((day) => (
            <DaySection
              key={day}
              day={day}
              items={itemsOfDay(items, day)}
              selectedId={selectedId}
              indicatorId={indicatorId}
              onSelect={onSelect}
              onArchive={onArchive}
            />
          ))}
          {isEmpty && (
            <motion.div
              key={`empty-${filter}`}
              variants={rowCollapseOf(shouldReduceMotion)}
              initial='hidden'
              animate='shown'
              exit='hidden'
              className='overflow-hidden'
            >
              <EmptyInbox filter={filter} onShowAll={showAll} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
