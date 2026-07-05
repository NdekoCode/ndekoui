'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  newestFirst,
  TASK_HISTORY,
  type ActivityEvent,
} from './_parts/activity-model';
import { ChangeDetail, sentenceOf } from './_parts/event-parts';
import { PersonAvatar } from './_parts/glyphs';
import { heightPresenceOf } from './_parts/motion-parts';
import { isCurrentUser, personOf } from './_parts/people';
import { exactTimeOf, relativeTimeOf } from './_parts/time';

const SHOWN_COUNT = 6;

function shortNameOf(actorId: string) {
  if (isCurrentUser(actorId)) {
    return 'You';
  }
  return personOf(actorId).firstName;
}

function EventDetail({ event }: { event: ActivityEvent }) {
  return (
    <div className='flex flex-col gap-1.5 ps-7 pe-2 pb-2.5'>
      {event.kind === 'change' && <ChangeDetail change={event.change} />}
      {event.kind === 'comment' && (
        <p className='text-[13px] leading-5'>{event.body}</p>
      )}
      <time
        dateTime={event.at}
        className='text-muted-foreground text-xs tabular-nums'
      >
        {exactTimeOf(event.at)}
      </time>
    </div>
  );
}

function CompactRow({
  event,
  isOpen,
  onToggle,
}: {
  event: ActivityEvent;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const detailId = useId();
  const isExpandable = event.kind !== 'created';

  return (
    <li className={cn('rounded-lg', isOpen && 'bg-foreground/[0.03]')}>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={detailId}
        disabled={!isExpandable}
        onClick={onToggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left outline-none focus-visible:ring-[3px] disabled:cursor-default disabled:hover:bg-transparent'
      >
        <PersonAvatar
          person={personOf(event.actorId)}
          className='size-4 text-[8px]'
        />
        <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
          <span className='text-foreground font-medium'>
            {shortNameOf(event.actorId)}
          </span>{' '}
          {sentenceOf(event)}
        </span>
        <time
          dateTime={event.at}
          className='text-muted-foreground shrink-0 text-[11px] tabular-nums'
        >
          {relativeTimeOf(event.at)}
        </time>
        {isExpandable && (
          <ChevronRightIcon
            className={cn(
              'text-muted-foreground size-3 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
              isOpen && 'rotate-90'
            )}
          />
        )}
      </button>
      <div id={detailId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              {...heightPresenceOf(shouldReduceMotion)}
              className='overflow-hidden'
            >
              <EventDetail event={event} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

export default function Activity03() {
  const [openId, setOpenId] = useState<string | null>(null);
  const events = newestFirst(TASK_HISTORY).slice(0, SHOWN_COUNT);

  function toggle(eventId: string) {
    setOpenId((current) => {
      if (current === eventId) {
        return null;
      }
      return eventId;
    });
  }

  return (
    <section aria-label='Recent activity' className='w-full max-w-72'>
      <h3 className='text-muted-foreground px-1.5 text-xs font-medium'>
        Recent activity
      </h3>
      <ul className='mt-1.5 flex flex-col gap-0.5'>
        {events.map((event) => (
          <CompactRow
            key={event.id}
            event={event}
            isOpen={openId === event.id}
            onToggle={() => toggle(event.id)}
          />
        ))}
      </ul>
    </section>
  );
}
