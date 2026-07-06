'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { BellIcon, CheckIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { AGENTS } from './data';
import type { NotificationEntry } from './session';

const DOT_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

function dotScaleOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.4;
}

function bellLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'Notifications, nothing unread';
  }
  return `Notifications, ${unreadCount} unread`;
}

function unreadLineOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'All read';
  }
  return `${unreadCount} unread`;
}

function NotificationRow({ note }: { note: NotificationEntry }) {
  const agent = AGENTS[note.agentId];
  const color = seriesColorOf(agent.series);

  return (
    <li className='flex items-start gap-2.5 rounded-lg px-2 py-2'>
      <MeshTile seed={agent.name} color={color} size='lg' />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='text-[13px] leading-5 text-pretty'>{note.text}</p>
        <p className='text-muted-foreground text-xs'>{note.age}</p>
      </div>
      {note.isUnread && (
        <span
          aria-hidden='true'
          className='bg-primary mt-2 size-1.5 shrink-0 rounded-full'
        />
      )}
      {note.isUnread && <span className='sr-only'>Unread</span>}
    </li>
  );
}

type NotificationMenuProps = {
  notifications: NotificationEntry[];
  onReadAll: () => void;
};

export function NotificationMenu({
  notifications,
  onReadAll,
}: NotificationMenuProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const unreadCount = notifications.filter((note) => note.isUnread).length;
  const hasUnread = unreadCount > 0;
  const dotScale = dotScaleOf(shouldReduceMotion);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={bellLabelOf(unreadCount)}
            className='text-muted-foreground'
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
              className='bg-primary ring-background absolute end-1 top-1 size-2 rounded-full ring-2'
            />
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[24rem] max-w-[calc(100vw-1rem)] p-0'
      >
        <div className='flex h-11 items-center justify-between gap-2 ps-4 pe-2'>
          <div className='flex items-baseline gap-2'>
            <PopoverTitle className='text-[13px] leading-none font-semibold'>
              Notifications
            </PopoverTitle>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {unreadLineOf(unreadCount)}
            </span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            disabled={!hasUnread}
            onClick={onReadAll}
            className='text-muted-foreground'
          >
            <CheckIcon />
            Mark all as read
          </Button>
        </div>
        <ul
          aria-label='Notifications'
          className='max-h-[22rem] overflow-y-auto px-1.5 pb-1.5'
        >
          {notifications.map((note) => (
            <NotificationRow key={note.id} note={note} />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
