'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';

import type { ActivityChange } from './_parts/activity-model';
import { ActorName, ChangeDetail, verbOf } from './_parts/event-parts';
import { PersonAvatar } from './_parts/glyphs';
import {
  ENTER,
  EXIT,
  RollingCount,
  type PresenceProps,
} from './_parts/motion-parts';
import { personOf } from './_parts/people';
import { NOW, relativeTimeOf } from './_parts/time';

type LiveEvent = {
  id: string;
  actorId: string;
  taskKey: string;
  at: string;
  change: ActivityChange;
};

const ARRIVAL_EVERY_MS = 4000;

const MAX_SHOWN = 6;

const FIRST_EVENTS: LiveEvent[] = [
  {
    id: 'l1',
    actorId: 'sana',
    taskKey: 'MOS-217',
    at: '2026-11-05T10:41:00',
    change: { field: 'status', from: 'todo', to: 'in_progress' },
  },
  {
    id: 'l2',
    actorId: 'tomas',
    taskKey: 'MOS-209',
    at: '2026-11-05T10:30:00',
    change: { field: 'estimate', to: 90 },
  },
  {
    id: 'l3',
    actorId: 'leo',
    taskKey: 'MOS-214',
    at: '2026-11-05T10:18:00',
    change: { field: 'status', from: 'in_progress', to: 'in_review' },
  },
  {
    id: 'l4',
    actorId: 'mei',
    taskKey: 'MOS-201',
    at: '2026-11-05T10:12:00',
    change: { field: 'due', to: '2026-11-10' },
  },
];

const INCOMING: LiveEvent[] = [
  {
    id: 'n1',
    actorId: 'leo',
    taskKey: 'MOS-214',
    at: NOW,
    change: { field: 'estimate', from: 360, to: 420 },
  },
  {
    id: 'n2',
    actorId: 'jonah',
    taskKey: 'MOS-198',
    at: NOW,
    change: { field: 'status', from: 'in_review', to: 'done' },
  },
  {
    id: 'n3',
    actorId: 'mei',
    taskKey: 'MOS-201',
    at: NOW,
    change: { field: 'label', to: 'reports' },
  },
  {
    id: 'n4',
    actorId: 'tomas',
    taskKey: 'MOS-209',
    at: NOW,
    change: { field: 'priority', from: 'medium', to: 'high' },
  },
];

type Inbox = {
  pending: LiveEvent[];
  delivered: number;
};

const SLIDE_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0, y: -8 },
  animate: { height: 'auto', opacity: 1, y: 0 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

const PILL_MOTION: MotionProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: EXIT },
  transition: ENTER,
};

const PILL_FADE: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function slidePresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return SLIDE_PRESENCE;
}

function pillMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return PILL_FADE;
  }
  return PILL_MOTION;
}

function receivedNext(inbox: Inbox): Inbox {
  const next = INCOMING[inbox.delivered];
  if (!next) {
    return inbox;
  }
  return { pending: [next, ...inbox.pending], delivered: inbox.delivered + 1 };
}

function updateWordOf(count: number) {
  if (count === 1) {
    return 'new update';
  }
  return 'new updates';
}

function LiveRow({ event }: { event: LiveEvent }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      {...slidePresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex gap-3 py-2'>
        <PersonAvatar person={personOf(event.actorId)} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <p className='text-muted-foreground min-w-0 text-[13px] leading-5'>
              <ActorName actorId={event.actorId} /> {verbOf(event.change)} on{' '}
              <span className='text-foreground tabular-nums'>
                {event.taskKey}
              </span>
            </p>
            <time
              dateTime={event.at}
              className='text-muted-foreground shrink-0 pt-0.5 text-xs tabular-nums'
            >
              {relativeTimeOf(event.at)}
            </time>
          </div>
          <ChangeDetail change={event.change} className='mt-1' />
        </div>
      </div>
    </motion.li>
  );
}

export default function Activity05() {
  const shouldReduceMotion = useReducedMotion();
  const [feed, setFeed] = useState<LiveEvent[]>(FIRST_EVENTS);
  const [inbox, setInbox] = useState<Inbox>({ pending: [], delivered: 0 });
  const isExhausted = inbox.delivered >= INCOMING.length;
  const pendingCount = inbox.pending.length;
  const hasPending = pendingCount > 0;

  useEffect(() => {
    if (isExhausted) {
      return;
    }
    const timer = setInterval(() => {
      setInbox(receivedNext);
    }, ARRIVAL_EVERY_MS);
    return () => clearInterval(timer);
  }, [isExhausted]);

  function reveal() {
    const merged = [...inbox.pending, ...feed];
    setFeed(merged.slice(0, MAX_SHOWN));
    setInbox((current) => ({ pending: [], delivered: current.delivered }));
  }

  return (
    <section aria-label='Workspace activity' className='w-full max-w-md'>
      <header className='flex min-h-7 items-center justify-between gap-3'>
        <h3 className='text-sm font-medium'>Workspace activity</h3>
        <div aria-live='polite' className='flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            {hasPending && (
              <motion.button
                key='pending'
                type='button'
                onClick={reveal}
                {...pillMotionOf(shouldReduceMotion)}
                className='bg-primary/10 text-primary-ink hover:bg-primary/15 focus-visible:ring-ring/25 dark:bg-primary/20 inline-flex h-7 origin-right cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium outline-none focus-visible:ring-[3px]'
              >
                <ArrowUpIcon className='size-3.5' />
                <RollingCount value={pendingCount} />
                {updateWordOf(pendingCount)}
              </motion.button>
            )}
            {!hasPending && (
              <motion.span
                key='current'
                {...PILL_FADE}
                className='text-muted-foreground text-xs'
              >
                Up to date
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </header>
      <ul className='mt-2'>
        <AnimatePresence initial={false}>
          {feed.map((event) => (
            <LiveRow key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
