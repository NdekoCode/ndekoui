'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AlarmClockIcon,
  BellIcon,
  BellOffIcon,
  InboxIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { rowCollapseOf } from './_parts/collapse';
import { PEOPLE, type Person } from './_parts/people';
import { SenderAvatar, type NotificationKind } from './_parts/sender-avatar';
import { SlidingCount } from './_parts/sliding-count';
import { Swap } from './_parts/swap';

type DayGroup = 'today' | 'yesterday' | 'week';

type ActivityEntry = {
  id: string;
  day: DayGroup;
  kind: NotificationKind;
  sender: Person;
  text: string;
  project: string;
  time: string;
  isMuted: boolean;
  snoozedUntil: string | null;
};

const DAY_LABELS: Record<DayGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Earlier this week',
};

const DAY_ORDER: DayGroup[] = ['today', 'yesterday', 'week'];

const SNOOZE_OPTIONS = ['In 1 hour', 'Tomorrow morning', 'Next Monday'];

const ENTRIES: ActivityEntry[] = [
  {
    id: 'a1',
    day: 'today',
    kind: 'comment',
    sender: PEOPLE.leo,
    text: 'replied in Offline drafts for field notes',
    project: 'Field App',
    time: '10:42',
    isMuted: false,
    snoozedUntil: null,
  },
  {
    id: 'a2',
    day: 'today',
    kind: 'mention',
    sender: PEOPLE.sana,
    text: 'mentioned you in Booking calendar skips a week',
    project: 'Field App',
    time: '09:15',
    isMuted: false,
    snoozedUntil: null,
  },
  {
    id: 'a3',
    day: 'yesterday',
    kind: 'assigned',
    sender: PEOPLE.mei,
    text: 'assigned you Copy for the weekly digest',
    project: 'Growth',
    time: '16:30',
    isMuted: false,
    snoozedUntil: null,
  },
  {
    id: 'a4',
    day: 'yesterday',
    kind: 'status',
    sender: PEOPLE.tomas,
    text: 'closed Rate limit the share links',
    project: 'Platform',
    time: '11:05',
    isMuted: true,
    snoozedUntil: null,
  },
  {
    id: 'a5',
    day: 'week',
    kind: 'comment',
    sender: PEOPLE.amara,
    text: 'commented on Onboarding checklist copy',
    project: 'Growth',
    time: 'Mon',
    isMuted: false,
    snoozedUntil: null,
  },
];

const PILL_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

function pillScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.95;
}

function countLabelOf(count: number) {
  return String(count);
}

function snoozedLabelOf(count: number) {
  if (count === 1) {
    return '1 snoozed';
  }
  return `${count} snoozed`;
}

function snoozedSentenceOf(count: number) {
  if (count === 1) {
    return '1 notification is snoozed';
  }
  return `${count} notifications are snoozed`;
}

function bringBackLabelOf(count: number) {
  if (count === 1) {
    return 'Bring back 1 snoozed notification';
  }
  return `Bring back ${count} snoozed notifications`;
}

function muteLabelOf(entry: ActivityEntry) {
  if (entry.isMuted) {
    return 'Unmute thread';
  }
  return 'Mute thread';
}

function isAwake(entry: ActivityEntry) {
  return entry.snoozedUntil === null;
}

function entriesOfDay(entries: ActivityEntry[], day: DayGroup) {
  return entries.filter((entry) => entry.day === day);
}

function withMuteToggled(entries: ActivityEntry[], entryId: string) {
  return entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, isMuted: !entry.isMuted };
  });
}

function withSnooze(entries: ActivityEntry[], entryId: string, until: string) {
  return entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    return { ...entry, snoozedUntil: until };
  });
}

function allAwake(entries: ActivityEntry[]) {
  return entries.map((entry) => ({ ...entry, snoozedUntil: null }));
}

const ROW_ACTION =
  'inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 data-popup-open:text-foreground';

type RowProps = {
  entry: ActivityEntry;
  onSnooze: (entryId: string, until: string) => void;
  onToggleMute: (entryId: string) => void;
};

function ActivityRow({ entry, onSnooze, onToggleMute }: RowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const muteLabel = muteLabelOf(entry);

  return (
    <motion.li
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <div className='flex items-center gap-3 px-4 py-2'>
        <SenderAvatar
          person={entry.sender}
          kind={entry.kind}
          className={cn(
            'transition-opacity duration-200',
            entry.isMuted && 'opacity-60'
          )}
        />
        <div className='min-w-0 flex-1'>
          <p
            className={cn(
              'truncate text-[13px] leading-5 transition-colors duration-200',
              entry.isMuted && 'text-muted-foreground'
            )}
          >
            <span className='font-medium'>{entry.sender.name}</span>{' '}
            <span className='text-muted-foreground'>{entry.text}</span>
          </p>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <span className='tabular-nums'>{entry.time}</span>
            <span aria-hidden='true'>·</span>
            <span className='truncate'>{entry.project}</span>
            {entry.isMuted && (
              <span className='inline-flex items-center gap-1'>
                <span aria-hidden='true'>·</span>
                Muted
              </span>
            )}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-0.5'>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    aria-label={`Snooze ${entry.sender.name}'s notification`}
                    className={ROW_ACTION}
                  />
                }
              >
                <AlarmClockIcon className='size-3.5' />
              </TooltipTrigger>
              <TooltipContent>Snooze</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuLabel>Snooze until</DropdownMenuLabel>
              {SNOOZE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onSnooze(entry.id, option)}
                >
                  <AlarmClockIcon />
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              aria-label={muteLabel}
              aria-pressed={entry.isMuted}
              onClick={() => onToggleMute(entry.id)}
              className={ROW_ACTION}
            >
              <Swap swapKey={String(entry.isMuted)}>
                {entry.isMuted && <BellOffIcon className='size-3.5' />}
                {!entry.isMuted && <BellIcon className='size-3.5' />}
              </Swap>
            </TooltipTrigger>
            <TooltipContent>{muteLabel}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.li>
  );
}

type DaySectionProps = {
  day: DayGroup;
  entries: ActivityEntry[];
  onSnooze: (entryId: string, until: string) => void;
  onToggleMute: (entryId: string) => void;
};

function DaySection({ day, entries, onSnooze, onToggleMute }: DaySectionProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const headingId = useId();

  return (
    <motion.section
      aria-labelledby={headingId}
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <h4
        id={headingId}
        className='text-muted-foreground flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs'
      >
        {DAY_LABELS[day]}
        <SlidingCount
          value={entries.length}
          format={countLabelOf}
          className='text-muted-foreground/75'
        />
      </h4>
      <ul>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <ActivityRow
              key={entry.id}
              entry={entry}
              onSnooze={onSnooze}
              onToggleMute={onToggleMute}
            />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

function CaughtUp({ snoozedCount }: { snoozedCount: number }) {
  return (
    <div className='flex flex-col items-center px-6 py-8 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <InboxIcon />
      </span>
      <p className='mt-3 text-sm font-medium'>Nothing left to read</p>
      <p className='text-muted-foreground mt-1 text-[13px] text-balance'>
        {snoozedSentenceOf(snoozedCount)}, bring them back from the header
      </p>
    </div>
  );
}

export default function Notification24() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const [entries, setEntries] = useState(ENTRIES);
  const awakeEntries = entries.filter(isAwake);
  const snoozedCount = entries.length - awakeEntries.length;
  const hasSnoozed = snoozedCount > 0;
  const isCaughtUp = awakeEntries.length === 0;
  const pillScale = pillScaleOf(shouldReduceMotion);
  const days = DAY_ORDER.filter(
    (day) => entriesOfDay(awakeEntries, day).length > 0
  );

  function snooze(entryId: string, until: string) {
    setEntries((current) => withSnooze(current, entryId, until));
  }

  function toggleMute(entryId: string) {
    setEntries((current) => withMuteToggled(current, entryId));
  }

  function wakeAll() {
    setEntries(allAwake);
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border w-full max-w-[26rem] rounded-xl pb-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex h-11 items-center justify-between gap-2 ps-4 pe-2'>
        <h3 id={titleId} className='text-[13px] font-semibold'>
          Activity
        </h3>
        <AnimatePresence initial={false}>
          {hasSnoozed && (
            <motion.div
              key='snoozed'
              initial={{ opacity: 0, scale: pillScale }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: pillScale }}
              transition={PILL_TRANSITION}
              className='origin-right'
            >
              <Button
                variant='ghost'
                size='sm'
                aria-label={bringBackLabelOf(snoozedCount)}
                onClick={wakeAll}
                className='text-muted-foreground'
              >
                <AlarmClockIcon />
                <SlidingCount value={snoozedCount} format={snoozedLabelOf} />
                <span aria-hidden='true'>·</span>
                <span className='text-foreground'>Bring back</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <AnimatePresence initial={false}>
        {days.map((day) => (
          <DaySection
            key={day}
            day={day}
            entries={entriesOfDay(awakeEntries, day)}
            onSnooze={snooze}
            onToggleMute={toggleMute}
          />
        ))}
        {isCaughtUp && (
          <motion.div
            key='caught-up'
            variants={rowCollapseOf(shouldReduceMotion)}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='overflow-hidden'
          >
            <CaughtUp snoozedCount={snoozedCount} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
