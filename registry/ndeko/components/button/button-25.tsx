'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { BellIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

const INITIAL_UNREAD_COUNT = 3;
const MAX_SHOWN_COUNT = 99;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const BADGE_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function badgeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BADGE_VARIANTS;
}

function notificationsLabelOf(unreadCount: number) {
  if (unreadCount === 0) {
    return 'Notifications';
  }
  if (unreadCount === 1) {
    return 'Notifications, 1 unread';
  }
  return `Notifications, ${unreadCount} unread`;
}

function badgeTextOf(unreadCount: number) {
  if (unreadCount > MAX_SHOWN_COUNT) {
    return `${MAX_SHOWN_COUNT}+`;
  }
  return String(unreadCount);
}

export default function Button25() {
  const [unreadCount, setUnreadCount] = useState(INITIAL_UNREAD_COUNT);
  const shouldReduceMotion = usePrefersReducedMotion();
  const badgeVariants = badgeVariantsOf(shouldReduceMotion);
  const hasUnread = unreadCount > 0;

  function markAllAsRead() {
    setUnreadCount(0);
  }

  return (
    <Button
      variant='outline'
      size='icon'
      onClick={markAllAsRead}
      aria-label={notificationsLabelOf(unreadCount)}
    >
      <BellIcon />
      <AnimatePresence initial={false}>
        {hasUnread && (
          <motion.span
            key='unread-count'
            className='absolute -top-2 left-full -translate-x-1/2'
            variants={badgeVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <Badge className='bg-primary text-primary-foreground min-w-5 px-1 tabular-nums'>
              {badgeTextOf(unreadCount)}
            </Badge>
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
