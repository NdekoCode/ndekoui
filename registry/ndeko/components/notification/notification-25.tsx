'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { BellIcon, CheckCheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { PEOPLE, type Person } from './_parts/people';
import { SenderAvatar, type NotificationKind } from './_parts/sender-avatar';
import { UnreadDot } from './_parts/unread-dot';

type InboxTab = 'all' | 'mentions' | 'invites';

type BellEntry = {
  id: string;
  kind: NotificationKind;
  sender: Person;
  verb: string;
  target: string;
  age: string;
  isUnread: boolean;
};

const ENTRIES: BellEntry[] = [
  {
    id: 'mention-1',
    kind: 'mention',
    sender: PEOPLE.sana,
    verb: 'mentioned you in',
    target: 'Booking calendar skips a week',
    age: '4m',
    isUnread: true,
  },
  {
    id: 'invite-1',
    kind: 'invite',
    sender: PEOPLE.amara,
    verb: 'invited you to',
    target: 'Atlas Redesign',
    age: '20m',
    isUnread: true,
  },
  {
    id: 'comment-1',
    kind: 'comment',
    sender: PEOPLE.leo,
    verb: 'commented on',
    target: 'Offline drafts for field notes',
    age: '1h',
    isUnread: true,
  },
  {
    id: 'mention-2',
    kind: 'mention',
    sender: PEOPLE.tomas,
    verb: 'mentioned you in',
    target: 'Expiry of shared links',
    age: '3h',
    isUnread: false,
  },
  {
    id: 'assigned-1',
    kind: 'assigned',
    sender: PEOPLE.mei,
    verb: 'assigned you',
    target: 'Copy for the weekly digest',
    age: 'Yesterday',
    isUnread: false,
  },
  {
    id: 'invite-2',
    kind: 'invite',
    sender: PEOPLE.jonas,
    verb: 'invited you to',
    target: 'Platform guild',
    age: 'Mon',
    isUnread: false,
  },
];

const TABS: { value: InboxTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'invites', label: 'Invites' },
];

const FADE_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function isInboxTab(value: unknown): value is InboxTab {
  return TABS.some((tab) => tab.value === value);
}

function belongsTo(entry: BellEntry, tab: InboxTab) {
  if (tab === 'mentions') {
    return entry.kind === 'mention';
  }
  if (tab === 'invites') {
    return entry.kind === 'invite';
  }
  return true;
}

function entriesOf(entries: BellEntry[], tab: InboxTab) {
  return entries.filter((entry) => belongsTo(entry, tab));
}

function unreadCountOf(entries: BellEntry[]) {
  return entries.filter((entry) => entry.isUnread).length;
}

function bellLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'Notifications, nothing unread';
  }
  if (unreadCount === 1) {
    return 'Notifications, 1 unread';
  }
  return `Notifications, ${unreadCount} unread`;
}

function tabLabelOf(label: string, unreadCount: number) {
  if (unreadCount === 0) {
    return label;
  }
  return `${label}, ${unreadCount} unread`;
}

function withRead(entries: BellEntry[], entryId: string) {
  return entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, isUnread: false };
  });
}

function allRead(entries: BellEntry[]) {
  return entries.map((entry) => ({ ...entry, isUnread: false }));
}

function BellRow({
  entry,
  onOpen,
}: {
  entry: BellEntry;
  onOpen: (entryId: string) => void;
}) {
  return (
    <li>
      <button
        type='button'
        onClick={() => onOpen(entry.id)}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 relative flex w-full cursor-pointer items-start gap-3 rounded-lg py-2 ps-4 pe-2.5 text-left outline-none focus-visible:ring-[3px]'
      >
        <UnreadDot
          isUnread={entry.isUnread}
          className='absolute start-1.5 top-[1.15rem]'
        />
        <SenderAvatar
          person={entry.sender}
          kind={entry.kind}
          surfaceClassName='bg-popover'
        />
        <span className='min-w-0 flex-1'>
          <span
            className={cn(
              'block text-[13px] leading-5 transition-colors duration-200',
              !entry.isUnread && 'text-muted-foreground'
            )}
          >
            <span className='font-medium'>{entry.sender.name}</span>{' '}
            <span className='text-muted-foreground'>{entry.verb}</span>{' '}
            <span className='font-medium'>{entry.target}</span>
          </span>
          <span className='text-muted-foreground block text-xs tabular-nums'>
            {entry.age}
            {entry.isUnread && <span className='sr-only'>, unread</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

type InboxPanelProps = {
  entries: BellEntry[];
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  onOpen: (entryId: string) => void;
  onMarkAllRead: () => void;
};

/** The content of the bell: one component, drawn inline in the preview and inside the real popover. */
function InboxPanel({
  entries,
  tab,
  onTabChange,
  onOpen,
  onMarkAllRead,
}: InboxPanelProps) {
  const hasUnread = unreadCountOf(entries) > 0;
  const visibleEntries = entriesOf(entries, tab);

  function changeTab(value: unknown) {
    if (isInboxTab(value)) {
      onTabChange(value);
    }
  }

  return (
    <div className='flex flex-col'>
      <div className='flex h-11 items-center justify-between gap-2 ps-4 pe-2'>
        <p className='text-[13px] font-semibold'>Notifications</p>
        <Button
          variant='ghost'
          size='sm'
          disabled={!hasUnread}
          onClick={onMarkAllRead}
          className='text-muted-foreground'
        >
          <CheckCheckIcon />
          Mark all as read
        </Button>
      </div>
      <Tabs value={tab} onValueChange={changeTab} className='gap-1'>
        <TabsList
          variant='segmented'
          aria-label='Filter notifications'
          className='mx-3'
        >
          {TABS.map((item) => {
            const tabEntries = entriesOf(entries, item.value);
            const unread = unreadCountOf(tabEntries);
            const hasCount = unread > 0;
            return (
              <TabsTab
                key={item.value}
                value={item.value}
                aria-label={tabLabelOf(item.label, unread)}
              >
                {item.label}
                {hasCount && (
                  <span
                    aria-hidden='true'
                    className='bg-foreground/[0.07] text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-[5px] px-1 text-[11px] tabular-nums'
                  >
                    {unread}
                  </span>
                )}
              </TabsTab>
            );
          })}
        </TabsList>
      </Tabs>
      <AnimatedSize>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.ul
              key={tab}
              aria-label='Notifications'
              variants={FADE_VARIANTS}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={FADE_TRANSITION}
              className='max-h-[22rem] overflow-y-auto px-1.5 pt-1 pb-1.5'
            >
              {visibleEntries.map((entry) => (
                <BellRow key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </div>
  );
}

export default function Notification25() {
  const [entries, setEntries] = useState(ENTRIES);
  const [tab, setTab] = useState<InboxTab>('all');
  const unreadCount = unreadCountOf(entries);
  const hasUnread = unreadCount > 0;

  function open(entryId: string) {
    setEntries((current) => withRead(current, entryId));
  }

  function markAllRead() {
    setEntries(allRead);
  }

  const panel = (
    <InboxPanel
      entries={entries}
      tab={tab}
      onTabChange={setTab}
      onOpen={open}
      onMarkAllRead={markAllRead}
    />
  );

  return (
    <div className='flex w-full max-w-[26rem] flex-col items-end gap-2'>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label={bellLabelOf(unreadCount)}
            />
          }
        >
          <BellIcon />
          <UnreadDot
            isUnread={hasUnread}
            className='ring-card absolute top-1.5 right-1.5 size-2 ring-2'
          />
        </PopoverTrigger>
        <PopoverContent
          align='end'
          className='w-[26rem] max-w-[calc(100vw-1rem)] p-0'
        >
          {panel}
        </PopoverContent>
      </Popover>
      <div className='surface-raised w-full rounded-xl'>{panel}</div>
    </div>
  );
}
