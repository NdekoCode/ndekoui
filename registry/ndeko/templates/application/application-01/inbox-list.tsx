'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { InboxIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import type { InboxItem } from './data';
import { InboxRow } from './inbox-row';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const FADE_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

export type InboxActions = {
  onOpen: (itemId: string) => void;
  onToggleRead: (itemId: string) => void;
  onArchive: (itemId: string) => void;
};

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

type InboxListProps = InboxActions & {
  items: InboxItem[];
  listClassName?: string;
};

export function InboxList({
  items,
  listClassName,
  onOpen,
  onToggleRead,
  onArchive,
}: InboxListProps) {
  const hasItems = items.length > 0;

  return (
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
              className={cn('px-1.5 pb-1.5', listClassName)}
            >
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <InboxRow
                    key={item.id}
                    item={item}
                    onOpen={onOpen}
                    onToggleRead={onToggleRead}
                    onArchive={onArchive}
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
  );
}

export function unreadLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'All read';
  }
  return `${unreadCount} unread`;
}
