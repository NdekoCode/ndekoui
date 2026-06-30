'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import {
  INBOX,
  WORKSPACE_NAME,
  type InboxFilter,
  type InboxItem,
} from './data';
import { InboxList } from './inbox-list';
import { NotificationDetail } from './notification-detail';

type Archived = { item: InboxItem; index: number };

type Replies = Record<string, string[]>;

const FIRST_ID = INBOX[0].id;
const UNDO_VISIBLE_MS = 6000;

const PILL_ARRIVE: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };
const PILL_LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

function withRead(items: InboxItem[], itemId: string, isUnread: boolean) {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return { ...item, isUnread };
  });
}

function allRead(items: InboxItem[]) {
  return items.map((item) => ({ ...item, isUnread: false }));
}

function isVisible(
  item: InboxItem,
  filter: InboxFilter,
  selectedId: string | null
) {
  if (filter === 'mentions') {
    return item.kind === 'mention';
  }
  if (filter === 'unread') {
    const isSelected = item.id === selectedId;
    return item.isUnread || isSelected;
  }
  return true;
}

function neighbourOf(visible: InboxItem[], itemId: string) {
  const index = visible.findIndex((item) => item.id === itemId);
  const nextIndex = index + 1;
  const next = visible[nextIndex];
  if (next) {
    return next.id;
  }
  const previousIndex = index - 1;
  const previous = visible[previousIndex];
  if (previous) {
    return previous.id;
  }
  return null;
}

function withInserted(items: InboxItem[], archived: Archived) {
  const before = items.slice(0, archived.index);
  const after = items.slice(archived.index);
  return [...before, archived.item, ...after];
}

function unreadLabelOf(count: number) {
  if (count === 0) {
    return 'Nothing unread';
  }
  return `${count} unread`;
}

function pillOffsetOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return 8;
}

function useUndoTimer(onElapsed: () => void) {
  const timer = useRef<number | null>(null);
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function restart() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onElapsedRef.current();
    }, UNDO_VISIBLE_MS);
  }

  return restart;
}

export default function Notifications04() {
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState(() => withRead(INBOX, FIRST_ID, false));
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(FIRST_ID);
  const [isDetailOpenOnPhone, setIsDetailOpenOnPhone] = useState(false);
  const [replies, setReplies] = useState<Replies>({});
  const [archived, setArchived] = useState<Archived | null>(null);
  const visibleItems = items.filter((item) =>
    isVisible(item, filter, selectedId)
  );
  const found = items.find((item) => item.id === selectedId);
  const selected = found ?? null;
  const unreadCount = items.filter((item) => item.isUnread).length;
  const replyKey = selectedId ?? '';
  const storedReplies = replies[replyKey];
  const selectedReplies = storedReplies ?? [];
  const pillOffset = pillOffsetOf(shouldReduceMotion);

  function forgetArchived() {
    setArchived(null);
  }

  const restartUndoTimer = useUndoTimer(forgetArchived);

  function select(itemId: string) {
    setSelectedId(itemId);
    setItems((current) => withRead(current, itemId, false));
    setIsDetailOpenOnPhone(true);
  }

  function toggleRead(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setItems((current) => withRead(current, itemId, !item.isUnread));
  }

  function archive(itemId: string) {
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return;
    }
    const isSelected = itemId === selectedId;
    if (isSelected) {
      const neighbourId = neighbourOf(visibleItems, itemId);
      setSelectedId(neighbourId);
    }
    setArchived({ item: items[index], index });
    setItems((current) => current.filter((item) => item.id !== itemId));
    restartUndoTimer();
  }

  function undoArchive() {
    if (!archived) {
      return;
    }
    setItems((current) => withInserted(current, archived));
    setSelectedId(archived.item.id);
    setArchived(null);
  }

  function markAllRead() {
    setItems(allRead);
  }

  function reply(itemId: string, text: string) {
    setReplies((current) => {
      const stored = current[itemId];
      const previous = stored ?? [];
      return { ...current, [itemId]: [...previous, text] };
    });
  }

  function backToList() {
    setIsDetailOpenOnPhone(false);
  }

  return (
    <div className='bg-background text-foreground flex h-svh min-h-[32rem] w-full flex-col'>
      <header className='hairline-b border-border flex h-11 shrink-0 items-center justify-between gap-3 px-3 sm:px-5'>
        <nav
          aria-label='Breadcrumb'
          className='flex min-w-0 items-center gap-1.5 text-[13px]'
        >
          <span className='text-muted-foreground'>{WORKSPACE_NAME}</span>
          <ChevronRightIcon className='text-muted-foreground size-3.5' />
          <span className='font-medium'>Inbox</span>
        </nav>
        <p className='text-muted-foreground text-xs tabular-nums'>
          {unreadLabelOf(unreadCount)}
        </p>
      </header>
      <div className='flex min-h-0 flex-1'>
        <section
          aria-label='Notifications'
          className={cn(
            'hairline-r border-border relative min-h-0 w-full flex-col md:flex md:w-[23rem] md:shrink-0',
            isDetailOpenOnPhone && 'hidden',
            !isDetailOpenOnPhone && 'flex'
          )}
        >
          <InboxList
            items={visibleItems}
            filter={filter}
            unreadCount={unreadCount}
            selectedId={selectedId}
            onFilterChange={setFilter}
            onSelect={select}
            onArchive={archive}
            onMarkAllRead={markAllRead}
          />
          <AnimatePresence initial={false}>
            {archived && (
              <motion.div
                key={archived.item.id}
                role='status'
                initial={{ opacity: 0, y: pillOffset }}
                animate={{ opacity: 1, y: 0, transition: PILL_ARRIVE }}
                exit={{ opacity: 0, y: pillOffset, transition: PILL_LEAVE }}
                className='surface-raised absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full py-1 ps-4 pe-1 text-[13px]'
              >
                <span className='min-w-0 flex-1 truncate'>
                  Archived{' '}
                  <span className='text-muted-foreground tabular-nums'>
                    {archived.item.task.key}
                  </span>
                </span>
                <Button size='sm' variant='ghost' onClick={undoArchive}>
                  <RotateCcwIcon />
                  Undo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <section
          aria-label='Selected notification'
          className={cn(
            'min-h-0 min-w-0 flex-1 md:block',
            isDetailOpenOnPhone && 'block',
            !isDetailOpenOnPhone && 'hidden'
          )}
        >
          <NotificationDetail
            item={selected}
            replies={selectedReplies}
            onBack={backToList}
            onToggleRead={toggleRead}
            onArchive={archive}
            onReply={reply}
          />
        </section>
      </div>
    </div>
  );
}
