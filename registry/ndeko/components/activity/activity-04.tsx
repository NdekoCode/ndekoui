'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { PersonAvatar } from './_parts/glyphs';
import { heightPresenceOf, RollingCount } from './_parts/motion-parts';
import { personOf, type Person } from './_parts/people';
import { durationLabelOf, relativeTimeOf } from './_parts/time';

type Range = 'today' | 'week';

type Presence = 'tracking' | 'paused' | 'away';

type WorkEntry = {
  personId: string;
  taskKey: string;
  taskTitle: string;
  minutes: number;
  lastAt: string;
};

const PRESENCE: Record<string, Presence> = {
  leo: 'tracking',
  tomas: 'tracking',
  sana: 'paused',
  mei: 'away',
  jonah: 'away',
  amara: 'away',
};

const PRESENCE_LABEL: Record<Presence, string> = {
  tracking: 'tracking time now',
  paused: 'timer paused',
  away: 'not tracking',
};

const ENTRIES: Record<Range, WorkEntry[]> = {
  today: [
    {
      personId: 'leo',
      taskKey: 'MOS-214',
      taskTitle: 'Export invoices as CSV',
      minutes: 185,
      lastAt: '2026-11-05T10:58:00',
    },
    {
      personId: 'sana',
      taskKey: 'MOS-217',
      taskTitle: 'Filters on the quarterly report',
      minutes: 140,
      lastAt: '2026-11-05T10:31:00',
    },
    {
      personId: 'tomas',
      taskKey: 'MOS-209',
      taskTitle: 'Review the refund flow copy',
      minutes: 95,
      lastAt: '2026-11-05T10:56:00',
    },
    {
      personId: 'mei',
      taskKey: 'MOS-201',
      taskTitle: 'Onboarding checklist emails',
      minutes: 50,
      lastAt: '2026-11-05T09:20:00',
    },
  ],
  week: [
    {
      personId: 'leo',
      taskKey: 'MOS-214',
      taskTitle: 'Export invoices as CSV',
      minutes: 640,
      lastAt: '2026-11-05T10:58:00',
    },
    {
      personId: 'sana',
      taskKey: 'MOS-217',
      taskTitle: 'Filters on the quarterly report',
      minutes: 515,
      lastAt: '2026-11-05T10:31:00',
    },
    {
      personId: 'mei',
      taskKey: 'MOS-201',
      taskTitle: 'Onboarding checklist emails',
      minutes: 410,
      lastAt: '2026-11-05T09:20:00',
    },
    {
      personId: 'tomas',
      taskKey: 'MOS-209',
      taskTitle: 'Review the refund flow copy',
      minutes: 330,
      lastAt: '2026-11-05T10:56:00',
    },
    {
      personId: 'jonah',
      taskKey: 'MOS-198',
      taskTitle: 'Archive old workspaces',
      minutes: 260,
      lastAt: '2026-11-04T17:45:00',
    },
    {
      personId: 'amara',
      taskKey: 'MOS-205',
      taskTitle: 'Billing settings layout',
      minutes: 220,
      lastAt: '2026-11-03T15:10:00',
    },
  ],
};

const TOTAL_LABEL: Record<Range, string> = {
  today: 'tracked today',
  week: 'tracked this week',
};

function isRange(value: unknown): value is Range {
  const isToday = value === 'today';
  const isWeek = value === 'week';
  return isToday || isWeek;
}

function totalOf(entries: WorkEntry[]) {
  let total = 0;
  for (const entry of entries) {
    total += entry.minutes;
  }
  return total;
}

function longestOf(entries: WorkEntry[]) {
  const minutes = entries.map((entry) => entry.minutes);
  return Math.max(1, ...minutes);
}

function presenceOf(personId: string): Presence {
  return PRESENCE[personId] ?? 'away';
}

function PresenceAvatar({
  person,
  presence,
}: {
  person: Person;
  presence: Presence;
}) {
  const isTracking = presence === 'tracking';
  const isPaused = presence === 'paused';

  return (
    <span className='relative inline-flex shrink-0'>
      <PersonAvatar person={person} className='size-8 text-xs' />
      {isTracking && (
        <span className='bg-card text-success-foreground ring-card absolute -end-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full ring-2'>
          <PlayIcon strokeWidth={2.5} className='size-2' />
        </span>
      )}
      {isPaused && (
        <span className='bg-card text-warning-foreground ring-card absolute -end-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full ring-2'>
          <PauseIcon strokeWidth={2.5} className='size-2' />
        </span>
      )}
    </span>
  );
}

function layoutOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return false;
  }
  return 'position';
}

function WorkRow({ entry, longest }: { entry: WorkEntry; longest: number }) {
  const shouldReduceMotion = useReducedMotion();
  const person = personOf(entry.personId);
  const presence = presenceOf(entry.personId);
  const share = entry.minutes / longest;
  const barStyle = { transform: `scaleX(${share})` } as React.CSSProperties;

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      layout={layoutOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex items-center gap-3 py-2'>
        <PresenceAvatar person={person} presence={presence} />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>
            {person.name}
            <span className='sr-only'>, {PRESENCE_LABEL[presence]}</span>
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            <span className='tabular-nums'>{entry.taskKey}</span>{' '}
            {entry.taskTitle} · {relativeTimeOf(entry.lastAt)}
          </p>
        </div>
        <div className='flex w-20 shrink-0 flex-col items-end gap-1.5'>
          <RollingCount
            value={entry.minutes}
            format={durationLabelOf}
            className='text-[13px] font-medium'
          />
          <span
            aria-hidden='true'
            className='bg-foreground/[0.06] block h-1 w-full overflow-hidden rounded-full'
          >
            <span
              style={barStyle}
              className='bg-primary block h-full w-full origin-left rounded-full transition-transform duration-300 ease-(--ease-out-strong)'
            />
          </span>
        </div>
      </div>
    </motion.li>
  );
}

function rowKeyOf(entry: WorkEntry) {
  return `${entry.personId}-${entry.taskKey}`;
}

export default function Activity04() {
  const [range, setRange] = useState<Range>('today');
  const entries = ENTRIES[range];
  const total = totalOf(entries);
  const longest = longestOf(entries);

  function change(value: unknown) {
    if (isRange(value)) {
      setRange(value);
    }
  }

  return (
    <section aria-label='Team activity' className='w-full max-w-md'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-medium'>Team activity</h3>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            <RollingCount
              value={total}
              format={durationLabelOf}
              className='text-foreground font-medium'
            />{' '}
            {TOTAL_LABEL[range]}
          </p>
        </div>
        <Tabs value={range} onValueChange={change}>
          <TabsList variant='segmented' aria-label='Range'>
            <TabsTab value='today'>Today</TabsTab>
            <TabsTab value='week'>This week</TabsTab>
          </TabsList>
        </Tabs>
      </header>
      <ul className='mt-2'>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <WorkRow key={rowKeyOf(entry)} entry={entry} longest={longest} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
