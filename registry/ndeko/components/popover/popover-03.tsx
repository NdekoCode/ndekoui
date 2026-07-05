'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { BellIcon } from '@/registry/ndeko/lib/icons';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

type Notification = {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  isUnread: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    user: 'Chris Tompson',
    action: 'requested review on',
    target: 'PR #42: Feature implementation',
    timestamp: '15 minutes ago',
    isUnread: true,
  },
  {
    id: 2,
    user: 'Emma Davis',
    action: 'shared',
    target: 'New component library',
    timestamp: '45 minutes ago',
    isUnread: true,
  },
  {
    id: 3,
    user: 'James Wilson',
    action: 'assigned you to',
    target: 'API integration task',
    timestamp: '4 hours ago',
    isUnread: false,
  },
  {
    id: 4,
    user: 'Alex Morgan',
    action: 'replied to your comment in',
    target: 'Authentication flow',
    timestamp: '12 hours ago',
    isUnread: false,
  },
  {
    id: 5,
    user: 'Sarah Chen',
    action: 'commented on',
    target: 'Dashboard redesign',
    timestamp: '2 days ago',
    isUnread: false,
  },
  {
    id: 6,
    user: 'Noah Patel',
    action: 'mentioned you in',
    target: 'Launch page open graph image',
    timestamp: '2 weeks ago',
    isUnread: false,
  },
];

const MAX_SHOWN_COUNT = 99;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const POP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function popVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return POP_VARIANTS;
}

function notificationsLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'Open notifications';
  }
  if (unreadCount === 1) {
    return 'Open notifications, 1 unread';
  }
  return `Open notifications, ${unreadCount} unread`;
}

function shownCountOf(unreadCount: number) {
  return Math.min(unreadCount, MAX_SHOWN_COUNT);
}

function overflowMarkOf(unreadCount: number) {
  if (unreadCount > MAX_SHOWN_COUNT) {
    return '+';
  }
  return undefined;
}

function initialsOf(name: string) {
  const words = name.split(' ');
  const letters = words.map((word) => word.charAt(0));
  return letters.join('');
}

function markAsRead(notification: Notification) {
  return { ...notification, isUnread: false };
}

export default function Popover03() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const shouldReduceMotion = usePrefersReducedMotion();
  const popVariants = popVariantsOf(shouldReduceMotion);
  const unreadCount = notifications.filter(
    (notification) => notification.isUnread
  ).length;
  const hasUnread = unreadCount > 0;
  const shownCount = shownCountOf(unreadCount);
  const overflowMark = overflowMarkOf(unreadCount);

  function markAllAsRead() {
    setNotifications((current) => current.map(markAsRead));
  }

  function markOneAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) => {
        if (notification.id !== id) {
          return notification;
        }
        return markAsRead(notification);
      })
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label={notificationsLabelOf(unreadCount)}
          />
        }
      >
        <BellIcon />
        <AnimatePresence initial={false}>
          {hasUnread && (
            <motion.span
              key='unread-count'
              className='absolute -top-2 left-full -translate-x-1/2'
              variants={popVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <Badge className='bg-primary text-primary-foreground min-w-5 overflow-hidden px-1 tabular-nums'>
                <MotionNumber value={shownCount} suffix={overflowMark} />
              </Badge>
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-1'>
        <div className='flex items-baseline justify-between gap-4 px-3 py-2'>
          <PopoverTitle>Notifications</PopoverTitle>
          <Button
            variant='link'
            size='sm'
            onClick={markAllAsRead}
            disabled={!hasUnread}
            focusableWhenDisabled
            className='h-auto p-0 text-xs'
          >
            Mark all as read
          </Button>
        </div>
        <ul className='flex flex-col'>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className='has-focus-visible:bg-foreground/5 hover:bg-foreground/5 relative flex items-start gap-3 rounded-md px-3 py-2 transition-colors duration-150'
            >
              <Avatar className='size-9' aria-hidden='true'>
                <AvatarFallback>{initialsOf(notification.user)}</AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <button
                  type='button'
                  onClick={() => markOneAsRead(notification.id)}
                  className='text-muted-foreground text-left outline-none after:absolute after:inset-0'
                >
                  <span className='text-foreground font-medium'>
                    {notification.user}
                  </span>{' '}
                  {notification.action}{' '}
                  <span className='text-foreground font-medium'>
                    {notification.target}
                  </span>
                  .
                </button>
                <span className='text-muted-foreground text-xs'>
                  {notification.timestamp}
                </span>
              </div>
              <span className='flex size-1.5 shrink-0 self-center'>
                <AnimatePresence initial={false}>
                  {notification.isUnread && (
                    <motion.span
                      key='unread'
                      className='bg-primary size-1.5 rounded-full'
                      variants={popVariants}
                      initial='enter'
                      animate='visible'
                      exit='exit'
                      transition={SWAP_TRANSITION}
                    >
                      <span className='sr-only'>Unread</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
