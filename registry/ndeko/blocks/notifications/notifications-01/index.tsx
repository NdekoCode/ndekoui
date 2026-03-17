'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useState } from 'react';

import {
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  InboxIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import {
  ASSIGNED_TASKS,
  INBOX,
  TEAM_KEY,
  WORKSPACE_NAME,
  type InboxItem,
} from './data';
import { IssueTypeGem } from './inbox-glyphs';
import { InboxRow } from './inbox-row';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const DOT_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

const FADE_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

function dotScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.4;
}

function bellLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'Inbox, nothing unread';
  }
  if (unreadCount === 1) {
    return 'Inbox, 1 unread';
  }
  return `Inbox, ${unreadCount} unread`;
}

function unreadLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'All read';
  }
  return `${unreadCount} unread`;
}

function withRead(items: InboxItem[], itemId: string, isUnread: boolean) {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return { ...item, isUnread };
  });
}

function InboxEmpty() {
  return (
    <div className='flex flex-col items-center px-6 py-10 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <InboxIcon />
      </span>
      <p className='mt-3 text-sm font-medium'>No notifications</p>
      <p className='text-muted-foreground mt-1 max-w-64 text-[13px] text-balance'>
        Mentions, assignments and comments on your tasks arrive here
      </p>
    </div>
  );
}

export default function Notifications01() {
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState<InboxItem[]>(INBOX);
  const unreadCount = items.filter((item) => item.isUnread).length;
  const hasUnread = unreadCount > 0;
  const hasItems = items.length > 0;
  const dotScale = dotScaleOf(shouldReduceMotion);

  function markRead(itemId: string) {
    setItems((current) => withRead(current, itemId, false));
  }

  function toggleRead(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setItems((current) => withRead(current, itemId, !item.isUnread));
  }

  function archive(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function markAllRead() {
    setItems((current) =>
      current.map((item) => ({ ...item, isUnread: false }))
    );
  }

  return (
    <div className='bg-background text-foreground flex min-h-svh flex-col'>
      <header className='hairline-b border-border flex h-11 shrink-0 items-center justify-between gap-3 px-3 sm:px-5'>
        <nav
          aria-label='Breadcrumb'
          className='flex min-w-0 items-center gap-1.5 text-[13px]'
        >
          <span className='text-muted-foreground'>{WORKSPACE_NAME}</span>
          <ChevronRightIcon className='text-muted-foreground size-3.5' />
          <span className='truncate font-medium'>My issues</span>
        </nav>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={bellLabelOf(unreadCount)}
              />
            }
          >
            <BellIcon />
            <AnimatePresence initial={false}>
              {hasUnread && (
                <motion.span
                  key='dot'
                  aria-hidden='true'
                  initial={{ opacity: 0, scale: dotScale }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: dotScale }}
                  transition={DOT_TRANSITION}
                  className='bg-primary ring-background absolute top-1 right-1 size-2 rounded-full ring-2'
                />
              )}
            </AnimatePresence>
          </PopoverTrigger>
          <PopoverContent
            align='end'
            className='w-[26rem] max-w-[calc(100vw-1rem)] p-0'
          >
            <div className='flex h-11 items-center justify-between gap-2 ps-4 pe-2'>
              <div className='flex items-baseline gap-2'>
                <PopoverTitle className='text-[13px] leading-none font-semibold'>
                  Inbox
                </PopoverTitle>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {unreadLabelOf(unreadCount)}
                </span>
              </div>
              <Button
                variant='ghost'
                size='sm'
                disabled={!hasUnread}
                onClick={markAllRead}
                className='text-muted-foreground'
              >
                <CheckIcon />
                Mark all as read
              </Button>
            </div>
            <AnimatedSize>
              <div className='relative'>
                <AnimatePresence mode='popLayout' initial={false}>
                  {hasItems && (
                    <motion.ul
                      key='list'
                      aria-label='Notifications'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={FADE_TRANSITION}
                      className='max-h-[24rem] overflow-y-auto px-1.5 pb-1.5'
                    >
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <InboxRow
                            key={item.id}
                            item={item}
                            onOpen={markRead}
                            onToggleRead={toggleRead}
                            onArchive={archive}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                  )}
                  {!hasItems && (
                    <motion.div
                      key='empty'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={FADE_TRANSITION}
                    >
                      <InboxEmpty />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimatedSize>
          </PopoverContent>
        </Popover>
      </header>
      <main className='mx-auto w-full max-w-2xl px-4 py-8 sm:px-6'>
        <h1 className='text-sm font-semibold'>My issues</h1>
        <p className='text-muted-foreground text-xs'>
          Assigned to you in {WORKSPACE_NAME} Web
        </p>
        <ul className='bg-card hairline-ring ring-border hairline-divide-y divide-border mt-4 overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          {ASSIGNED_TASKS.map((task) => (
            <li
              key={task.number}
              className='flex h-11 items-center gap-3 px-3 text-[13px]'
            >
              <IssueTypeGem type={task.type} />
              <span className='text-muted-foreground w-14 shrink-0 text-xs tabular-nums'>
                {TEAM_KEY}-{task.number}
              </span>
              <span className='min-w-0 flex-1 truncate'>{task.title}</span>
              <span className='text-muted-foreground hidden text-xs sm:inline'>
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
