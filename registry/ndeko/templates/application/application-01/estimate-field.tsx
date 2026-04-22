'use client';

import { useId, useState } from 'react';

import { PencilIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { SlidingValue, formatDuration } from './member-parts';

const VALUE_FIELD = [
  'group/estimate inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] font-medium tabular-nums outline-none',
  'hairline-border border-dashed border-foreground/20 transition-[border-color,background-color] duration-150',
  'hover:border-foreground/35 active:bg-foreground/5 data-popup-open:border-solid data-popup-open:border-foreground/30',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25',
].join(' ');

const PRESETS = [30, 60, 120, 240, 480];

const MAX_HOURS = 99;

const MINUTES_PER_HOUR = 60;

type Draft = { hours: string; minutes: string };

function draftOf(totalMinutes: number): Draft {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return { hours: String(hours), minutes: String(minutes) };
}

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(min, value);
  return Math.min(max, atLeastMin);
}

function wholeNumberOf(text: string) {
  const parsed = Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

function minutesOf(draft: Draft) {
  const hours = clamp(wholeNumberOf(draft.hours), 0, MAX_HOURS);
  const minutes = clamp(wholeNumberOf(draft.minutes), 0, MINUTES_PER_HOUR - 1);
  return hours * MINUTES_PER_HOUR + minutes;
}

function presetLabelOf(minutes: number) {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m`;
  }
  return `${minutes / MINUTES_PER_HOUR}h`;
}

type EstimateFieldProps = {
  minutes: number;
  taskNumber: string;
  onChange: (minutes: number) => void;
};

/** A value you can change in place: Enter saves, clicking away keeps what was typed, Escape puts the saved value back. */
export function EstimateField({
  minutes,
  taskNumber,
  onChange,
}: EstimateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(minutes));
  const hoursId = useId();
  const minutesId = useId();
  const hasEstimate = minutes > 0;
  const triggerLabel = `Estimate of ${taskNumber}: ${formatDuration(minutes)}. Edit`;

  function changeOpen(nextOpen: boolean, details: { reason: string }) {
    if (nextOpen) {
      setDraft(draftOf(minutes));
      setIsOpen(true);
      return;
    }
    const keepsDraft = details.reason === 'outside-press';
    if (keepsDraft) {
      onChange(minutesOf(draft));
    }
    setIsOpen(false);
  }

  function changeHours(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft((previous) => ({ ...previous, hours: event.target.value }));
  }

  function changeMinutes(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft((previous) => ({ ...previous, minutes: event.target.value }));
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(minutesOf(draft));
    setIsOpen(false);
  }

  function clear() {
    onChange(0);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <button
            type='button'
            aria-label={triggerLabel}
            className={cn(VALUE_FIELD, !hasEstimate && 'text-muted-foreground')}
          />
        }
      >
        {hasEstimate && (
          <>
            <SlidingValue value={minutes} />
            <PencilIcon className='text-muted-foreground size-3' />
          </>
        )}
        {!hasEstimate && (
          <>
            <PlusIcon className='size-3' />
            Estimate
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-64 p-3' align='center'>
        <form onSubmit={save} className='flex flex-col gap-3'>
          <p className='text-muted-foreground text-xs font-medium'>
            {`Estimate of ${taskNumber}`}
          </p>
          <div className='flex items-center gap-2'>
            <label htmlFor={hoursId} className='sr-only'>
              Hours
            </label>
            <Input
              id={hoursId}
              autoFocus
              type='number'
              inputMode='numeric'
              min={0}
              max={MAX_HOURS}
              size='sm'
              value={draft.hours}
              onChange={changeHours}
              className='w-16 tabular-nums'
            />
            <span className='text-muted-foreground text-xs'>h</span>
            <label htmlFor={minutesId} className='sr-only'>
              Minutes
            </label>
            <Input
              id={minutesId}
              type='number'
              inputMode='numeric'
              min={0}
              max={MINUTES_PER_HOUR - 1}
              step={5}
              size='sm'
              value={draft.minutes}
              onChange={changeMinutes}
              className='w-16 tabular-nums'
            />
            <span className='text-muted-foreground text-xs'>m</span>
          </div>
          <div className='flex flex-wrap gap-1'>
            {PRESETS.map((preset) => {
              function pickPreset() {
                setDraft(draftOf(preset));
              }

              return (
                <Button
                  key={preset}
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={pickPreset}
                  className='tabular-nums'
                >
                  {presetLabelOf(preset)}
                </Button>
              );
            })}
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='ghost' size='sm' onClick={clear}>
              Clear
            </Button>
            <PopoverClose
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='ml-auto'
                />
              }
            >
              Cancel
            </PopoverClose>
            <Button type='submit' size='sm'>
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
