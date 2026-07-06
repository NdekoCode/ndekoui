'use client';

import { addDays, nextMonday } from 'date-fns';
import { useId, useState } from 'react';
import type { Matcher } from 'react-day-picker';

import { WordRoll } from '@/components/core/word-roll';
import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { AnimatedCalendar } from './_parts/animated-calendar';
import { useToday } from './_parts/today';
import { describeTypedDate } from './_parts/typed-date';
import {
  blockedReasonOf,
  UNREADABLE_MESSAGE,
  useTypedDate,
  type DayLimits,
  type TypedDatePicker,
  type TypedDatePreview,
} from './_parts/use-typed-date';

type QuickPickId = 'today' | 'tomorrow' | 'monday';

type QuickPick = {
  id: QuickPickId;
  label: string;
  date: Date | null;
  isBlocked: boolean;
};

type LineKind = 'error' | 'preview' | 'stale' | 'hint';

type Line = {
  kind: LineKind;
  text: string;
};

const LINE_TONE: Record<LineKind, string> = {
  error: 'text-destructive-ink',
  preview: 'text-foreground',
  stale: 'text-muted-foreground',
  hint: 'text-muted-foreground',
};

const REST_TEXT = 'next fri 3pm';

const LATEST_DAYS_AHEAD = 90;

const SUNDAY = 0;

const QUICK_PICK_LABELS: { id: QuickPickId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'monday', label: 'Next Monday' },
];

function quickDateOf(id: QuickPickId, today: Date | null) {
  if (today === null) {
    return null;
  }
  if (id === 'tomorrow') {
    return addDays(today, 1);
  }
  if (id === 'monday') {
    return nextMonday(today);
  }
  return today;
}

function isDateBlocked(date: Date | null, limits: DayLimits) {
  if (date === null) {
    return true;
  }
  return blockedReasonOf(date, limits) !== null;
}

function quickPicksOf(today: Date | null, limits: DayLimits): QuickPick[] {
  return QUICK_PICK_LABELS.map(({ id, label }) => {
    const date = quickDateOf(id, today);
    return { id, label, date, isBlocked: isDateBlocked(date, limits) };
  });
}

function disabledMatchersOf(limits: DayLimits) {
  const matchers: Matcher[] = [];
  if (limits.min) {
    matchers.push({ before: limits.min });
  }
  if (limits.max) {
    matchers.push({ after: limits.max });
  }
  if (limits.disabledWeekdays) {
    matchers.push({ dayOfWeek: [...limits.disabledWeekdays] });
  }
  return matchers;
}

function lineOf(
  error: string | null,
  preview: TypedDatePreview | null,
  hint: string
): Line {
  if (error !== null) {
    return { kind: 'error', text: error };
  }
  if (preview === null) {
    return { kind: 'hint', text: hint };
  }
  if (preview.isStale) {
    return { kind: 'stale', text: preview.text };
  }
  return { kind: 'preview', text: preview.text };
}

function hintOf(withTime: boolean) {
  if (withTime) {
    return 'Try “next fri 3pm” or “in 3 days”';
  }
  return 'Try “next fri”, “in 3 days” or “14 nov”';
}

export type TypedDateFieldProps = {
  label: string;
  picker: TypedDatePicker;
  today: Date | null;
  limits: DayLimits;
  withTime: boolean;
  pressedPick?: QuickPickId | null;
};

export function TypedDateField({
  label,
  picker,
  today,
  limits,
  withTime,
  pressedPick = null,
}: TypedDateFieldProps) {
  const id = useId();
  const lineId = `${id}-line`;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const { text, changeText, value, preview, error, commit, pickDay } = picker;
  const line = lineOf(error, preview, hintOf(withTime));
  const picks = quickPicksOf(today, limits);
  const matchers = disabledMatchersOf(limits);
  const calendarMonth = value?.date ?? today ?? undefined;

  function announceSet(date: Date, hasTime: boolean) {
    if (today === null) {
      return;
    }
    const spoken = describeTypedDate({ date, hasTime }, today);
    setAnnouncement(`${label} set to ${spoken}`);
  }

  function commitFromPerson() {
    const committed = commit();
    if (committed) {
      announceSet(committed.date, committed.hasTime);
      return;
    }
    const hasText = text.trim() !== '';
    if (hasText) {
      setAnnouncement(error ?? UNREADABLE_MESSAGE);
    }
  }

  function pickFromPerson(date: Date) {
    const picked = pickDay(date);
    if (picked) {
      announceSet(picked.date, picked.hasTime);
    }
  }

  function pickQuick(pick: QuickPick) {
    if (pick.date === null) {
      return;
    }
    pickFromPerson(pick.date);
  }

  function selectInCalendar(date: Date | undefined) {
    if (!date) {
      return;
    }
    pickFromPerson(date);
    setIsCalendarOpen(false);
  }

  function commitOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    commitFromPerson();
  }

  return (
    <div className='flex w-full flex-col gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          value={text}
          onChange={(event) => changeText(event.currentTarget.value)}
          onKeyDown={commitOnEnter}
          onBlur={commitFromPerson}
          placeholder='Type a date'
          autoComplete='off'
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={lineId}
          className='pe-10'
        />
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Open the calendar'
                className='text-muted-foreground hover:text-foreground absolute end-0.5 top-0.5 size-7'
              />
            }
          >
            <CalendarIcon className='size-4' />
          </PopoverTrigger>
          <PopoverContent className='w-auto p-2' align='end'>
            <AnimatedCalendar
              mode='single'
              selected={value?.date}
              onSelect={selectInCalendar}
              defaultMonth={calendarMonth}
              disabled={matchers}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div id={lineId} className='flex min-h-5 items-center text-xs'>
        <WordRoll text={line.text} className={LINE_TONE[line.kind]} />
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {picks.map((pick) => (
          <Button
            key={pick.id}
            variant='outline'
            size='sm'
            disabled={pick.isBlocked}
            onClick={() => pickQuick(pick)}
            className={pressedQuietOf(pressedPick === pick.id)}
          >
            {pick.label}
          </Button>
        ))}
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}

export default function CalendarDatePicker29() {
  const today = useToday();
  const { pressed, press } = usePress<QuickPickId>();
  const limits: DayLimits = {};
  if (today !== null) {
    limits.min = today;
    limits.max = addDays(today, LATEST_DAYS_AHEAD);
    limits.disabledWeekdays = [SUNDAY];
  }
  const picker = useTypedDate({
    today,
    withTime: true,
    initialText: REST_TEXT,
    ...limits,
  });

  function pickNextMonday() {
    if (today === null) {
      return;
    }
    picker.pickDay(nextMonday(today));
  }

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => picker.changeText('') },
    ...typingSteps('in 3 days', picker.changeText, {
      startAfter: 500,
      characterMs: 70,
    }),
    { after: 1000, run: () => picker.commit() },
    { after: 1800, run: () => press('monday') },
    { after: PRESS_LEAD_MS, run: pickNextMonday },
    { after: 1800, run: () => picker.changeText('') },
    ...typingSteps('someday', picker.changeText, {
      startAfter: 500,
      characterMs: 70,
    }),
    { after: 1000, run: () => picker.commit() },
    { after: 1800, run: () => picker.changeText('') },
    ...typingSteps(REST_TEXT, picker.changeText, {
      startAfter: 500,
      characterMs: 70,
    }),
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 3200,
    onReset: () => picker.reset(REST_TEXT),
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='min-h-[10rem] w-full max-w-xs'>
      <TypedDateField
        label='Due date'
        picker={picker}
        today={today}
        limits={limits}
        withTime
        pressedPick={pressed}
      />
    </div>
  );
}
