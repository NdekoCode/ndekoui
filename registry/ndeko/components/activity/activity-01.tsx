'use client';

import { useState } from 'react';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import {
  kindOf,
  TASK_HISTORY,
  TASK_KEY,
  type ActivityEvent,
} from './_parts/activity-model';
import {
  ActorName,
  ChangeDetail,
  EventGlyph,
  sentenceOf,
} from './_parts/event-parts';
import { Swap } from './_parts/motion-parts';
import { countLabel, exactTimeOf, relativeTimeOf } from './_parts/time';

function isHistoryEvent(event: ActivityEvent) {
  return event.kind !== 'comment';
}

function timeLabelOf(at: string, isExact: boolean) {
  if (isExact) {
    return exactTimeOf(at);
  }
  return relativeTimeOf(at);
}

function EventTime({ at }: { at: string }) {
  const [isExact, setIsExact] = useState(false);
  const label = timeLabelOf(at, isExact);

  return (
    <button
      type='button'
      aria-pressed={isExact}
      aria-label={`${label}. Switch between the exact and the relative time`}
      onClick={() => setIsExact((current) => !current)}
      className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 shrink-0 cursor-pointer rounded-sm text-xs whitespace-nowrap tabular-nums transition-colors outline-none focus-visible:ring-[3px]'
    >
      <AnimatedSize as='span' axis='width'>
        <Swap swapKey={label}>
          <time dateTime={at}>{label}</time>
        </Swap>
      </AnimatedSize>
    </button>
  );
}

function HistoryEntry({ event }: { event: ActivityEvent }) {
  return (
    <li className='flex gap-3 py-2'>
      <EventGlyph kind={kindOf(event)} />
      <div className='min-w-0 flex-1 pt-0.5'>
        <div className='flex items-start justify-between gap-3'>
          <p className='text-muted-foreground min-w-0 text-[13px] leading-5'>
            <ActorName actorId={event.actorId} /> {sentenceOf(event)}
          </p>
          <EventTime at={event.at} />
        </div>
        {event.kind === 'change' && (
          <ChangeDetail change={event.change} className='mt-1' />
        )}
      </div>
    </li>
  );
}

export default function Activity01() {
  const events = TASK_HISTORY.filter(isHistoryEvent);

  return (
    <section aria-label='Task history' className='w-full max-w-md'>
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>History</h3>
        <p className='text-muted-foreground text-xs'>
          <span className='tabular-nums'>{TASK_KEY}</span> ·{' '}
          {countLabel(events.length, 'change', 'changes')}
        </p>
      </header>
      <ol className='mt-2'>
        {events.map((event) => (
          <HistoryEntry key={event.id} event={event} />
        ))}
      </ol>
    </section>
  );
}
