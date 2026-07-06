import { cn } from '@/registry/ndeko/lib/utils';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineItem,
} from '@/registry/ndeko/ui/timeline';

import { stampLabelOf } from './_parts/dates';

type Tone = 'done' | 'notice' | 'warning';

type LogEntry = {
  at: string;
  message: string;
  tone: Tone;
};

const WAREHOUSE_LOG: LogEntry[] = [
  {
    at: '2026-11-12T10:55:00',
    message: 'Pallet BS-20418 put away in rack 01-B.',
    tone: 'done',
  },
  {
    at: '2026-11-12T10:50:00',
    message: 'Cold room door left open for more than two minutes.',
    tone: 'warning',
  },
  {
    at: '2026-11-12T10:45:00',
    message: 'Dock 2 scanner back online after a restart.',
    tone: 'done',
  },
  {
    at: '2026-11-12T10:40:00',
    message: 'Stock count started for aisle 02.',
    tone: 'notice',
  },
];

const TONE_DOT: Record<Tone, string> = {
  done: 'bg-success',
  notice: 'bg-info',
  warning: 'bg-warning',
};

const TONE_WORD: Record<Tone, string> = {
  done: 'Done',
  notice: 'Notice',
  warning: 'Warning',
};

const LOG_CARD =
  'bg-card hairline-ring ring-border w-full max-w-md rounded-xl py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

/* The log has no rail: each row gives back the room the timeline keeps for one. */
const LOG_ROW = [
  'flex-row gap-2.5 px-4 py-2.5',
  'group-data-[orientation=vertical]/timeline:ms-0 group-data-[orientation=vertical]/timeline:not-last:pb-2.5',
].join(' ');

type ToneDotProps = {
  tone: Tone;
};

/* The dot sits in a box as tall as one line of text, so it stays on the first line of a long message. */
function ToneDot({ tone }: ToneDotProps) {
  const color = TONE_DOT[tone];

  return (
    <span aria-hidden='true' className='flex h-5 shrink-0 items-center'>
      <span className={cn('size-1.5 rounded-full', color)} />
    </span>
  );
}

export default function Timeline09() {
  return (
    <Timeline
      role='list'
      aria-label='Brightmoor Supply warehouse log'
      className={LOG_CARD}
    >
      {WAREHOUSE_LOG.map((entry, index) => {
        const step = index + 1;

        return (
          <TimelineItem
            key={entry.at}
            step={step}
            role='listitem'
            className={LOG_ROW}
          >
            <ToneDot tone={entry.tone} />
            <TimelineContent className='text-foreground leading-5'>
              <span className='sr-only'>{TONE_WORD[entry.tone]}: </span>
              {entry.message}
              <TimelineDate dateTime={entry.at} className='mt-1 mb-0'>
                {stampLabelOf(entry.at)}
              </TimelineDate>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
