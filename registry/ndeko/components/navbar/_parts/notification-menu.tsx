'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { BellIcon } from '@/registry/ndeko/lib/icons';
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

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const EXIT_TRANSITION: Transition = { duration: 0.1, ease: [0.2, 0, 0, 1] };

const POP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.6,
    filter: 'blur(2px)',
    transition: EXIT_TRANSITION,
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT_TRANSITION },
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

function markAsRead(notification: Notification) {
  return { ...notification, isUnread: false };
}

function NotificationMenu() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const shouldReduceMotion = useReducedMotion();
  const popVariants = popVariantsOf(shouldReduceMotion);
  const unreadCount = notifications.filter(
    (notification) => notification.isUnread
  ).length;
  const hasUnread = unreadCount > 0;

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
            variant='ghost'
            size='icon'
            aria-label={notificationsLabelOf(unreadCount)}
            className='text-muted-foreground'
          />
        }
      >
        <BellIcon />
        <AnimatePresence initial={false}>
          {hasUnread && (
            <motion.span
              key='unread-dot'
              aria-hidden='true'
              className='bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full'
              variants={popVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            />
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-1'>
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

export { NotificationMenu };
