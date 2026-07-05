'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { CommentField } from './_parts/comment-field';
import {
  draftCommentOf,
  replyWordOf,
  type CommentItem,
} from './_parts/comment-model';
import { CommentBlock, TEXT_ACTION } from './_parts/comment-parts';
import { heightPresenceOf, Swap } from './_parts/motion-parts';

type Thread = {
  comment: CommentItem;
  replies: CommentItem[];
};

const THREADS: Thread[] = [
  {
    comment: {
      id: 'c1',
      authorId: 'sana',
      at: '2026-11-05T08:40:00',
      body: 'Should the export include voided invoices? Finance filters them out by hand today.',
    },
    replies: [
      {
        id: 'c2',
        authorId: 'leo',
        at: '2026-11-05T09:05:00',
        body: 'I would keep them with a Status column, so the totals still match the ledger.',
      },
      {
        id: 'c3',
        authorId: 'tomas',
        at: '2026-11-05T09:22:00',
        body: 'Agreed. @Sana Iqbal can you confirm with finance before Léo adds the column?',
      },
    ],
  },
  {
    comment: {
      id: 'c4',
      authorId: 'mei',
      at: '2026-11-05T10:10:00',
      body: 'The download button can sit next to the date filter, since it reads the same range.',
    },
    replies: [],
  },
];

function foldLabelOf(count: number, showsReplies: boolean) {
  if (showsReplies) {
    return `Hide ${replyWordOf(count)}`;
  }
  return `Show ${count} ${replyWordOf(count)}`;
}

function ReplyRow({ reply }: { reply: CommentItem }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <CommentBlock
        comment={reply}
        avatarClassName='size-6 text-[9px]'
        className='pt-3'
      />
    </motion.li>
  );
}

function ThreadView({ thread }: { thread: Thread }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const [replies, setReplies] = useState(thread.replies);
  const [showsReplies, setShowsReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const repliesId = useId();
  const replyCount = replies.length;
  const hasReplies = replyCount > 0;
  const foldLabel = foldLabelOf(replyCount, showsReplies);

  function postReply(body: string) {
    setReplies((current) => [...current, draftCommentOf(body)]);
    setShowsReplies(true);
    setIsReplying(false);
  }

  return (
    <li className='py-3'>
      <CommentBlock comment={thread.comment} />
      <div className='mt-1 flex items-center gap-3 ps-10'>
        <button
          type='button'
          aria-expanded={isReplying}
          onClick={() => setIsReplying(true)}
          className={TEXT_ACTION}
        >
          Reply
        </button>
        {hasReplies && (
          <button
            type='button'
            aria-expanded={showsReplies}
            aria-controls={repliesId}
            onClick={() => setShowsReplies((current) => !current)}
            className={TEXT_ACTION}
          >
            <ChevronDownIcon
              className={cn(
                'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
                showsReplies && 'rotate-180'
              )}
            />
            <AnimatedSize as='span' axis='width'>
              <Swap swapKey={foldLabel}>{foldLabel}</Swap>
            </AnimatedSize>
          </button>
        )}
      </div>
      <div id={repliesId} className='ps-10'>
        <AnimatePresence initial={false}>
          {showsReplies && (
            <motion.ul key='replies' {...presence} className='overflow-hidden'>
              <AnimatePresence initial={false}>
                {replies.map((reply) => (
                  <ReplyRow key={reply.id} reply={reply} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {isReplying && (
            <motion.div
              key='reply-field'
              {...presence}
              className='-mx-1 overflow-hidden px-1 pb-1'
            >
              <CommentField
                autoFocus
                placeholder='Write a reply'
                submitLabel='Reply'
                onSubmit={postReply}
                onCancel={() => setIsReplying(false)}
                className='pt-3'
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

export default function Comment01() {
  return (
    <section aria-label='Comments' className='w-full max-w-md'>
      <h3 className='text-sm font-medium'>Comments</h3>
      <ul className='mt-1'>
        {THREADS.map((thread) => (
          <ThreadView key={thread.comment.id} thread={thread} />
        ))}
      </ul>
    </section>
  );
}
