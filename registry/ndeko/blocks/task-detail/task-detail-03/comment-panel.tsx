'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import type { TaskComment } from './data';
import { heightPresenceOf } from './motion-parts';
import { CommentText, PersonAvatar } from './work-glyphs';
import { actorNameOf, personOf, relativeTimeOf } from './work-model';

function CommentRow({ comment }: { comment: TaskComment }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex gap-3 py-2'>
        <PersonAvatar
          person={personOf(comment.authorId)}
          className='size-7 text-[10px]'
        />
        <div className='min-w-0 flex-1'>
          <p className='flex min-h-7 items-center gap-1.5 text-[13px]'>
            <span className='truncate font-medium'>
              {actorNameOf(comment.authorId)}
            </span>
            <span aria-hidden='true' className='text-muted-foreground'>
              ·
            </span>
            <time
              dateTime={comment.at}
              className='text-muted-foreground shrink-0 text-xs tabular-nums'
            >
              {relativeTimeOf(comment.at)}
            </time>
          </p>
          <CommentText body={comment.body} />
        </div>
      </div>
    </motion.li>
  );
}

export function CommentPanel({ comments }: { comments: TaskComment[] }) {
  const isEmpty = comments.length === 0;

  return (
    <div>
      {isEmpty && (
        <p className='text-muted-foreground py-4 text-center text-[13px]'>
          No comments yet. Write the first one below
        </p>
      )}
      <ul>
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
