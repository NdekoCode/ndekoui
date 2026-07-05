'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { commentWordOf, type CommentItem } from './_parts/comment-model';
import { CommentBlock } from './_parts/comment-parts';
import { heightPresenceOf, Swap } from './_parts/motion-parts';

const LAST_READ_AT = '2026-11-05T09:30:00';

const COMMENTS: CommentItem[] = [
  {
    id: 'u1',
    authorId: 'sana',
    at: '2026-11-05T08:55:00',
    body: 'I put the column picker behind a setting for now.',
  },
  {
    id: 'u2',
    authorId: 'leo',
    at: '2026-11-05T09:12:00',
    body: 'Thanks, I will turn it on for the billing team only.',
  },
  {
    id: 'u3',
    authorId: 'tomas',
    at: '2026-11-05T10:05:00',
    body: '@Amara Okafor the time zone fix is in review. Dates now follow the account setting.',
  },
  {
    id: 'u4',
    authorId: 'mei',
    at: '2026-11-05T10:40:00',
    body: 'The download button is in. It reads the range from the filter above the table.',
  },
];

function isAfter(at: string, reference: string) {
  return at.localeCompare(reference) > 0;
}

function readStateKeyOf(hasUnread: boolean) {
  if (hasUnread) {
    return 'unread';
  }
  return 'read';
}

function NewMarker({ count }: { count: number }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <p className='flex items-center gap-2 pt-1 pb-2'>
        <span className='bg-primary/10 text-primary-ink dark:bg-primary/20 inline-flex h-5 items-center rounded-full px-2 text-xs font-medium tabular-nums'>
          {count} new
        </span>
        <span className='text-muted-foreground text-xs'>
          since your last visit
        </span>
      </p>
    </motion.li>
  );
}

function rowsOf(
  lastReadAt: string,
  firstUnreadId: string | undefined,
  unreadCount: number
) {
  const rows: React.ReactNode[] = [];
  for (const comment of COMMENTS) {
    const isUnread = isAfter(comment.at, lastReadAt);
    if (comment.id === firstUnreadId) {
      rows.push(<NewMarker key='new-marker' count={unreadCount} />);
    }
    rows.push(
      <li
        key={comment.id}
        className={cn(
          '-mx-2 mb-1 rounded-lg px-2 py-2 transition-colors duration-300',
          isUnread && 'bg-primary/[0.05] dark:bg-primary/[0.08]'
        )}
      >
        <CommentBlock comment={comment} />
        {isUnread && <span className='sr-only'>Unread</span>}
      </li>
    );
  }
  return rows;
}

export default function Comment07() {
  const [lastReadAt, setLastReadAt] = useState(LAST_READ_AT);
  const unread = COMMENTS.filter((comment) => isAfter(comment.at, lastReadAt));
  const unreadCount = unread.length;
  const hasUnread = unreadCount > 0;
  const firstUnreadId = unread[0]?.id;
  const latest = COMMENTS[COMMENTS.length - 1];

  return (
    <section aria-label='Comments' className='w-full max-w-md'>
      <header className='flex min-h-8 items-center justify-between gap-3'>
        <h3 className='text-sm font-medium'>
          Comments{' '}
          <span className='text-muted-foreground font-normal tabular-nums'>
            {COMMENTS.length}
          </span>
        </h3>
        <AnimatedSize as='span' axis='width'>
          <Swap swapKey={readStateKeyOf(hasUnread)}>
            {hasUnread && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setLastReadAt(latest.at)}
              >
                Mark {unreadCount} {commentWordOf(unreadCount)} as read
              </Button>
            )}
            {!hasUnread && (
              <span
                role='status'
                className='text-muted-foreground inline-flex h-7 items-center text-xs'
              >
                All caught up
              </span>
            )}
          </Swap>
        </AnimatedSize>
      </header>
      <ul className='mt-2'>
        <AnimatePresence initial={false}>
          {rowsOf(lastReadAt, firstUnreadId, unreadCount)}
        </AnimatePresence>
      </ul>
    </section>
  );
}
