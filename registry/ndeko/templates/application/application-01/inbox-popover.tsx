'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useState } from 'react';

import { BellIcon, CheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import type { InboxItem } from './data';
import { InboxList, unreadLabelOf, type InboxActions } from './inbox-list';

const DOT_TRANSITION: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };

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

type InboxPopoverProps = InboxActions & {
  items: InboxItem[];
  onMarkAllRead: () => void;
};

export function InboxPopover({
  items,
  onMarkAllRead,
  onOpen,
  onToggleRead,
  onArchive,
}: InboxPopoverProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = items.filter((item) => item.isUnread).length;
  const hasUnread = unreadCount > 0;
  const dotScale = dotScaleOf(shouldReduceMotion);

  function openItem(itemId: string) {
    setIsOpen(false);
    onOpen(itemId);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            onClick={onMarkAllRead}
            className='text-muted-foreground'
          >
            <CheckIcon />
            Mark all as read
          </Button>
        </div>
        <InboxList
          items={items}
          listClassName='max-h-[24rem] overflow-y-auto'
          onOpen={openItem}
          onToggleRead={onToggleRead}
          onArchive={onArchive}
        />
      </PopoverContent>
    </Popover>
  );
}
