'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { CommentComposer } from './comment-composer';
import { NOW, type TaskComment, type WorkEvent } from './data';
import { ENTER, EXIT, heightPresenceOf, RollingCount } from './motion-parts';
import { CommentText, EventGlyph, PersonAvatar } from './work-glyphs';
import { actorNameOf, clockOf, personOf, relativeTimeOf } from './work-model';

export type Typing = {
  id: string;
  authorId: string;
};

type CommentItem = {
  kind: 'comment';
  id: string;
  at: string;
  seq: number;
  comment: TaskComment;
  isTyping: boolean;
};

type EventItem = {
  kind: 'event';
  id: string;
  at: string;
  seq: number;
  event: WorkEvent;
};

type ConversationItem = CommentItem | EventItem;

const DOT_DELAYS = [0, 0.15, 0.3];

const FADE_PRESENCE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function commentItemOf(comment: TaskComment): ConversationItem {
  return {
    kind: 'comment',
    id: comment.id,
    at: comment.at,
    seq: comment.seq ?? 0,
    comment,
    isTyping: false,
  };
}

function eventItemOf(event: WorkEvent): ConversationItem {
  return {
    kind: 'event',
    id: event.id,
    at: event.at,
    seq: event.seq ?? 0,
    event,
  };
}

function typingItemOf(typing: Typing): ConversationItem {
  const placeholder: TaskComment = {
    id: typing.id,
    authorId: typing.authorId,
    at: NOW,
    body: '',
  };
  return {
    kind: 'comment',
    id: typing.id,
    at: NOW,
    seq: Number.MAX_SAFE_INTEGER,
    comment: placeholder,
    isTyping: true,
  };
}

function isShownEvent(event: WorkEvent) {
  return event.kind !== 'comment';
}

function byTimeThenOrder(first: ConversationItem, second: ConversationItem) {
  const byTime = first.at.localeCompare(second.at);
  if (byTime !== 0) {
    return byTime;
  }
  return first.seq - second.seq;
}

/** Comments and the changes made around them, in the order they happened. */
function itemsOf(
  comments: TaskComment[],
  events: WorkEvent[],
  typing: Typing | null
) {
  const commentItems = comments.map(commentItemOf);
  const shownEvents = events.filter(isShownEvent);
  const eventItems = shownEvents.map(eventItemOf);
  const items = [...commentItems, ...eventItems];
  if (typing) {
    items.push(typingItemOf(typing));
  }
  return items.sort(byTimeThenOrder);
}

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

function contentKeyOf(item: CommentItem) {
  if (item.isTyping) {
    return 'typing';
  }
  return 'comment';
}

/** One row that holds the typing state, then becomes the comment once it is sent. */
function CommentEntry({ item }: { item: CommentItem }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const person = personOf(item.comment.authorId);

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex gap-3 py-2'>
        <PersonAvatar person={person} className='size-7 text-[10px]' />
        <AnimatedSize className='min-w-0 flex-1'>
          <motion.div
            key={contentKeyOf(item)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ENTER}
          >
            {item.isTyping && (
              <p className='text-muted-foreground flex min-h-7 items-center gap-2 text-xs'>
                <TypingDots />
                {person.firstName} is typing
              </p>
            )}
            {!item.isTyping && (
              <>
                <p className='flex min-h-7 items-center gap-1.5 text-[13px]'>
                  <span className='truncate font-medium'>
                    {actorNameOf(item.comment.authorId)}
                  </span>
                  <span aria-hidden='true' className='text-muted-foreground'>
                    ·
                  </span>
                  <time
                    dateTime={item.at}
                    className='text-muted-foreground shrink-0 text-xs tabular-nums'
                  >
                    {relativeTimeOf(item.at)}
                  </time>
                </p>
                <CommentText body={item.comment.body} />
              </>
            )}
          </motion.div>
        </AnimatedSize>
      </div>
    </motion.li>
  );
}

function EventLine({ item }: { item: EventItem }) {
  return (
    <motion.li {...FADE_PRESENCE} className='flex gap-3 py-1.5 ps-0.5'>
      <EventGlyph kind={item.event.kind} className='size-6' />
      <p className='text-muted-foreground min-w-0 flex-1 pt-0.5 text-xs leading-5'>
        <span className='text-foreground font-medium'>
          {actorNameOf(item.event.actorId)}
        </span>{' '}
        {item.event.text}
        <time dateTime={item.at} className='ms-1.5 tabular-nums'>
          {clockOf(item.at)}
        </time>
      </p>
    </motion.li>
  );
}

function scrollBehaviorOf(shouldReduceMotion: boolean | null): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function commentWordOf(count: number) {
  if (count === 1) {
    return 'comment';
  }
  return 'comments';
}

type ConversationPaneProps = {
  comments: TaskComment[];
  events: WorkEvent[];
  typing: Typing | null;
  onPost: (body: string) => void;
  className?: string;
};

export function ConversationPane({
  comments,
  events,
  typing,
  onPost,
  className,
}: ConversationPaneProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  const items = itemsOf(comments, events, typing);
  const itemCount = items.length;
  const commentCount = comments.length;
  const commentWord = commentWordOf(commentCount);

  useEffect(() => {
    const area = scrollRef.current;
    if (!area) {
      return;
    }
    if (!hasScrolled.current) {
      hasScrolled.current = true;
      area.scrollTop = area.scrollHeight;
      return;
    }
    area.scrollTo({
      top: area.scrollHeight,
      behavior: scrollBehaviorOf(shouldReduceMotion),
    });
  }, [itemCount, shouldReduceMotion]);

  return (
    <aside
      aria-label='Conversation'
      className={cn(
        'bg-card hairline-ring ring-border flex min-h-0 flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-baseline justify-between gap-3 px-4 pt-4'>
        <h2 className='text-sm font-medium'>Conversation</h2>
        <p className='text-muted-foreground text-xs'>
          <RollingCount value={commentCount} />{' '}
          <WordRoll text={commentWord} value={commentCount} />
        </p>
      </header>
      <div
        ref={scrollRef}
        className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2'
      >
        <ul aria-live='polite'>
          <AnimatePresence initial={false}>
            {items.map((item) => {
              if (item.kind === 'event') {
                return <EventLine key={item.id} item={item} />;
              }
              return <CommentEntry key={item.id} item={item} />;
            })}
          </AnimatePresence>
        </ul>
      </div>
      <CommentComposer
        onSubmit={onPost}
        placeholder='Write to the team'
        className='px-4 pt-2 pb-4'
      />
    </aside>
  );
}
