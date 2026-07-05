'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { CommentField } from './_parts/comment-field';
import { draftCommentOf } from './_parts/comment-model';
import { CommentMeta, CommentText, PersonAvatar } from './_parts/comment-parts';
import { ENTER, heightPresenceOf } from './_parts/motion-parts';
import { personOf } from './_parts/people';
import { NOW } from './_parts/time';

type Entry = {
  id: string;
  authorId: string;
  at: string;
  /** Empty while the author is still typing. */
  body: string | null;
};

type Reply = {
  authorId: string;
  body: string;
};

const FIRST_TYPING_MS = 3200;

const TYPING_STARTS_AFTER_MS = 900;

const TYPING_LASTS_MS = 2600;

const DOT_DELAYS = [0, 0.15, 0.3];

const FIRST_ENTRIES: Entry[] = [
  {
    id: 'w1',
    authorId: 'leo',
    at: '2026-11-05T10:31:00',
    body: 'Totals row is done. Anyone against bold for that last line?',
  },
  {
    id: 'w2',
    authorId: 'sana',
    at: NOW,
    body: null,
  },
];

const FIRST_REPLY = 'Bold is fine, finance prints it anyway.';

const LATER_REPLIES: Reply[] = [
  {
    authorId: 'tomas',
    body: 'Thanks, I will check it on the October file after lunch.',
  },
  {
    authorId: 'leo',
    body: 'Noted. I will fold that into the totals row change.',
  },
];

function TypingDots() {
  const shouldReduceMotion = usePrefersReducedMotion();
  if (shouldReduceMotion) {
    return (
      <span aria-hidden='true' className='flex gap-1'>
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className='bg-muted-foreground/60 size-1.5 rounded-full'
          />
        ))}
      </span>
    );
  }
  return (
    <span aria-hidden='true' className='flex gap-1'>
      {DOT_DELAYS.map((delay) => (
        <motion.span
          key={delay}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.2,
            delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          className='bg-muted-foreground size-1.5 rounded-full'
        />
      ))}
    </span>
  );
}

function contentKeyOf(entry: Entry) {
  if (entry.body === null) {
    return `${entry.id}-typing`;
  }
  return `${entry.id}-comment`;
}

/** One row that holds the typing state, then becomes the comment once it is sent. */
function EntryRow({ entry }: { entry: Entry }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const person = personOf(entry.authorId);
  const isTyping = entry.body === null;

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex gap-3 py-2'>
        <PersonAvatar person={person} />
        <AnimatedSize className='min-w-0 flex-1'>
          <motion.div
            key={contentKeyOf(entry)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ENTER}
          >
            {isTyping && (
              <p className='text-muted-foreground flex min-h-7 items-center gap-2 text-xs'>
                <TypingDots />
                {person.firstName} is typing
              </p>
            )}
            {entry.body !== null && (
              <>
                <div className='flex min-h-7 items-center'>
                  <CommentMeta comment={{ ...entry, body: entry.body }} />
                </div>
                <CommentText body={entry.body} />
              </>
            )}
          </motion.div>
        </AnimatedSize>
      </div>
    </motion.li>
  );
}

function withBody(entries: Entry[], entryId: string, body: string) {
  return entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, body };
  });
}

export default function Comment08() {
  const [entries, setEntries] = useState(FIRST_ENTRIES);
  const [repliesUsed, setRepliesUsed] = useState(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  function later(run: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, delay);
    timers.current.add(timer);
  }

  useEffect(() => {
    const pending = timers.current;
    const timer = setTimeout(() => {
      pending.delete(timer);
      setEntries((current) => withBody(current, 'w2', FIRST_REPLY));
    }, FIRST_TYPING_MS);
    pending.add(timer);
    return () => {
      pending.forEach((item) => clearTimeout(item));
      pending.clear();
    };
  }, []);

  function answer(reply: Reply, replyIndex: number) {
    const typingId = `reply-${replyIndex}`;
    const typing: Entry = {
      id: typingId,
      authorId: reply.authorId,
      at: NOW,
      body: null,
    };
    later(() => {
      setEntries((current) => [...current, typing]);
      later(() => {
        setEntries((current) => withBody(current, typingId, reply.body));
      }, TYPING_LASTS_MS);
    }, TYPING_STARTS_AFTER_MS);
  }

  function post(body: string) {
    const comment = draftCommentOf(body);
    setEntries((current) => [...current, comment]);
    const reply = LATER_REPLIES[repliesUsed];
    if (!reply) {
      return;
    }
    setRepliesUsed((current) => current + 1);
    answer(reply, repliesUsed);
  }

  return (
    <section aria-label='Comments' className='w-full max-w-md'>
      <h3 className='text-sm font-medium'>Comments</h3>
      <ul aria-live='polite' className='mt-1'>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>
      </ul>
      <CommentField
        placeholder='Write a comment'
        onSubmit={post}
        className='mt-2'
      />
    </section>
  );
}
