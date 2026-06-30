'use client';

import { useId, useState } from 'react';

import {
  CheckCheckIcon,
  CheckIcon,
  MailIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { PEOPLE, type Person } from './_parts/people';
import { SenderAvatar, type NotificationKind } from './_parts/sender-avatar';
import { SlidingCount } from './_parts/sliding-count';
import { UnreadDot } from './_parts/unread-dot';

type InboxEntry = {
  id: string;
  kind: NotificationKind;
  sender: Person;
  verb: string;
  target: string;
  suffix?: string;
  excerpt?: string;
  age: string;
  isUnread: boolean;
};

const ENTRIES: InboxEntry[] = [
  {
    id: 'mention',
    kind: 'mention',
    sender: PEOPLE.sana,
    verb: 'mentioned you in',
    target: 'Booking calendar skips a week',
    excerpt: 'Can you check the empty week on the phone layout?',
    age: '4m',
    isUnread: true,
  },
  {
    id: 'assigned',
    kind: 'assigned',
    sender: PEOPLE.mei,
    verb: 'assigned you',
    target: 'Copy for the weekly digest',
    age: '38m',
    isUnread: true,
  },
  {
    id: 'comment',
    kind: 'comment',
    sender: PEOPLE.leo,
    verb: 'commented on',
    target: 'Offline drafts for field notes',
    excerpt: 'Drafts now sync as soon as the tab is back online',
    age: '2h',
    isUnread: true,
  },
  {
    id: 'status',
    kind: 'status',
    sender: PEOPLE.tomas,
    verb: 'moved',
    target: 'Rate limit the share links',
    suffix: ' to In review',
    age: '5h',
    isUnread: false,
  },
  {
    id: 'invite',
    kind: 'invite',
    sender: PEOPLE.amara,
    verb: 'invited you to',
    target: 'Atlas Redesign',
    age: 'Yesterday',
    isUnread: false,
  },
];

const ROW_ACTION =
  'relative z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25';

function unreadLabelOf(count: number) {
  if (count === 0) {
    return 'All read';
  }
  return `${count} unread`;
}

function readToggleLabelOf(entry: InboxEntry) {
  if (entry.isUnread) {
    return 'Mark as read';
  }
  return 'Mark as unread';
}

function withRead(entries: InboxEntry[], entryId: string, isUnread: boolean) {
  return entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, isUnread };
  });
}

function allRead(entries: InboxEntry[]) {
  return entries.map((entry) => ({ ...entry, isUnread: false }));
}

function emphasisOf(isUnread: boolean) {
  if (isUnread) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

type InboxRowProps = {
  entry: InboxEntry;
  onOpen: (entryId: string) => void;
  onToggleRead: (entryId: string) => void;
};

function InboxRow({ entry, onOpen, onToggleRead }: InboxRowProps) {
  const readLabel = readToggleLabelOf(entry);
  const emphasis = emphasisOf(entry.isUnread);

  return (
    <li className='group/row hover:bg-foreground/[0.03] focus-within:bg-foreground/[0.03] relative flex items-start gap-3 rounded-lg py-2.5 ps-4 pe-2.5 transition-colors duration-150'>
      <UnreadDot
        isUnread={entry.isUnread}
        className='absolute start-1.5 top-[1.4rem]'
      />
      <SenderAvatar
        person={entry.sender}
        kind={entry.kind}
        className={cn(
          'transition-opacity duration-200',
          !entry.isUnread && 'opacity-70'
        )}
      />
      <button
        type='button'
        onClick={() => onOpen(entry.id)}
        className='focus-visible:after:ring-ring/25 min-w-0 flex-1 cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px]'
      >
        <span className='text-muted-foreground block text-[13px] leading-5'>
          <span
            className={cn(
              'font-medium transition-colors duration-200',
              emphasis
            )}
          >
            {entry.sender.name}
          </span>{' '}
          {entry.verb}{' '}
          <span
            className={cn(
              'font-medium transition-colors duration-200',
              emphasis
            )}
          >
            {entry.target}
          </span>
          {entry.suffix}
        </span>
        {entry.excerpt && (
          <span className='text-muted-foreground mt-0.5 line-clamp-1 block text-xs'>
            {entry.excerpt}
          </span>
        )}
        <span className='sr-only'>
          , {entry.age}
          {entry.isUnread && ', unread'}
        </span>
      </button>
      <span className='relative flex h-5 shrink-0 items-center'>
        <span
          aria-hidden='true'
          className='text-muted-foreground text-xs tabular-nums transition-opacity duration-150 group-focus-within/row:opacity-0 group-hover/row:opacity-0 pointer-coarse:hidden'
        >
          {entry.age}
        </span>
        <span className='absolute end-0 flex opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:static pointer-coarse:opacity-100'>
          <Tooltip>
            <TooltipTrigger
              aria-label={readLabel}
              onClick={() => onToggleRead(entry.id)}
              className={ROW_ACTION}
            >
              {entry.isUnread && <CheckIcon className='size-3.5' />}
              {!entry.isUnread && <MailIcon className='size-3.5' />}
            </TooltipTrigger>
            <TooltipContent>{readLabel}</TooltipContent>
          </Tooltip>
        </span>
      </span>
    </li>
  );
}

export default function Notification23() {
  const titleId = useId();
  const [entries, setEntries] = useState(ENTRIES);
  const unreadCount = entries.filter((entry) => entry.isUnread).length;
  const hasUnread = unreadCount > 0;

  function open(entryId: string) {
    setEntries((current) => withRead(current, entryId, false));
  }

  function toggleRead(entryId: string) {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    setEntries((current) => withRead(current, entryId, !entry.isUnread));
  }

  function markAllRead() {
    setEntries(allRead);
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border w-full max-w-[26rem] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex h-11 items-center justify-between gap-2 ps-4 pe-2'>
        <div className='flex items-baseline gap-2'>
          <h3 id={titleId} className='text-[13px] leading-none font-semibold'>
            Inbox
          </h3>
          <SlidingCount
            value={unreadCount}
            format={unreadLabelOf}
            className='text-muted-foreground text-xs'
          />
        </div>
        <Button
          variant='ghost'
          size='sm'
          disabled={!hasUnread}
          onClick={markAllRead}
          className='text-muted-foreground'
        >
          <CheckCheckIcon />
          Mark all as read
        </Button>
      </header>
      <ul aria-label='Notifications' className='px-1.5 pb-1.5'>
        {entries.map((entry) => (
          <InboxRow
            key={entry.id}
            entry={entry}
            onOpen={open}
            onToggleRead={toggleRead}
          />
        ))}
      </ul>
    </section>
  );
}
