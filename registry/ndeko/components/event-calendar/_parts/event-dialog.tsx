'use client';

import { format, isBefore, isSameDay } from 'date-fns';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { CalendarIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE, CONTROL_SIZES } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Calendar } from '@/registry/ndeko/ui/calendar';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import {
  DefaultEndHour,
  DefaultEventColor,
  DefaultStartHour,
  EndHour,
  EventColors,
  StartHour,
} from './constants';
import type { CalendarEvent, EventColor, EventColorOption } from './types';

const ENTER: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };
const EXIT: Transition = { duration: 0.1, ease: [0.23, 1, 0.32, 1] };
const SWAP: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const DATE_TRIGGER = cn(
  CONTROL_RECIPE,
  CONTROL_SIZES.default,
  'group flex cursor-pointer items-center justify-between gap-2 text-left data-popup-open:border-foreground/30'
);

const COLOR_SWATCH = [
  'size-6 bg-(--swatch) ring-(--swatch) shadow-none',
  'dark:bg-(--swatch) dark:ring-(--swatch)',
  'data-checked:bg-(--swatch) data-checked:ring-(--swatch) dark:data-checked:bg-(--swatch) dark:data-checked:ring-(--swatch)',
].join(' ');

const UNTITLED = 'Untitled event';

function formatQuarterTime(hour: number, minute: number) {
  const paddedHour = String(hour).padStart(2, '0');
  const paddedMinute = String(minute).padStart(2, '0');
  const value = `${paddedHour}:${paddedMinute}`;
  const label = format(new Date(2000, 0, 1, hour, minute), 'h:mm a');
  return { value, label };
}

function buildTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let hour = StartHour; hour <= EndHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(formatQuarterTime(hour, minute));
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

const DEFAULT_START_TIME = formatQuarterTime(DefaultStartHour, 0).value;
const DEFAULT_END_TIME = formatQuarterTime(DefaultEndHour, 0).value;

function formatTimeForInput(date: Date) {
  const quarter = Math.floor(date.getMinutes() / 15);
  return formatQuarterTime(date.getHours(), quarter * 15).value;
}

function hoursAndMinutesOf(time: string) {
  const parts = time.split(':');
  const [hours = 0, minutes = 0] = parts.map(Number);
  return { hours, minutes };
}

function isHourOutsideDay(hours: number) {
  return hours < StartHour || hours > EndHour;
}

function isEventColor(value: unknown): value is EventColor {
  return EventColors.some((option) => option.value === value);
}

function timeOf(date: Date) {
  return format(date, 'h:mm a');
}

/** When the event runs, in a sentence: the subtitle of the dialog. */
function whenLabelOf(event: CalendarEvent) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isOneDay = isSameDay(start, end);
  const isAllDayOnOneDay = Boolean(event.allDay) && isOneDay;

  if (isAllDayOnOneDay) {
    return `${format(start, 'EEEE, MMMM d')}, all day`;
  }
  if (event.allDay) {
    return `${format(start, 'MMM d')} to ${format(end, 'MMM d')}, all day`;
  }
  if (isOneDay) {
    return `${format(start, 'EEEE, MMMM d')}, ${timeOf(start)} to ${timeOf(end)}`;
  }
  return `${format(start, 'MMM d, h:mm a')} to ${format(end, 'MMM d, h:mm a')}`;
}

type DatePickerFieldProps = {
  id: string;
  label: string;
  date: Date;
  disabledBefore?: Date;
  onPick: (date: Date) => void;
};

function DatePickerField({
  id,
  label,
  date,
  disabledBefore,
  onPick,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  let disabled: { before: Date } | undefined;
  if (disabledBefore) {
    disabled = { before: disabledBefore };
  }

  function pick(picked: Date | undefined) {
    if (!picked) {
      return;
    }
    onPick(picked);
    setIsOpen(false);
  }

  return (
    <div className='flex flex-1 flex-col gap-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger id={id} className={DATE_TRIGGER}>
          <span className='truncate'>{format(date, 'PPP')}</span>
          <CalendarIcon className='text-muted-foreground size-4 shrink-0' />
        </PopoverTrigger>
        <PopoverContent className='w-auto p-2' align='start'>
          <AnimatedSize>
            <Calendar
              mode='single'
              selected={date}
              defaultMonth={date}
              disabled={disabled}
              onSelect={pick}
            />
          </AnimatedSize>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type TimeSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimeSelectField({ id, label, value, onChange }: TimeSelectFieldProps) {
  function pick(nextValue: string | null) {
    if (nextValue) {
      onChange(nextValue);
    }
  }

  return (
    <div className='flex min-w-28 flex-col gap-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Select items={TIME_OPTIONS} value={value} onValueChange={pick}>
        <SelectTrigger id={id} className='tabular-nums'>
          <SelectValue placeholder='Pick a time' />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className='tabular-nums'
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function SwappingLabel({ label }: { label: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className='relative inline-flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          variants={swapVariantsOf(shouldReduceMotion)}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function labelOfColor(color: EventColor, options: EventColorOption[]) {
  const option = options.find((candidate) => candidate.value === color);
  return option?.label ?? '';
}

type ColorFieldProps = {
  color: EventColor;
  options: EventColorOption[];
  legend: string;
  onChange: (color: EventColor) => void;
};

function ColorField({ color, options, legend, onChange }: ColorFieldProps) {
  function pickColor(value: unknown) {
    if (isEventColor(value)) {
      onChange(value);
    }
  }

  return (
    <fieldset>
      <legend className='text-foreground mb-3 flex items-baseline gap-2 text-[13px] leading-none font-medium'>
        {legend}
        <span aria-hidden='true' className='text-muted-foreground font-normal'>
          <SwappingLabel label={labelOfColor(color, options)} />
        </span>
      </legend>
      <RadioGroup
        className='flex flex-wrap gap-1.5'
        value={color}
        onValueChange={pickColor}
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className={COLOR_SWATCH}
            style={
              {
                '--swatch': `var(--${option.value})`,
              } as React.CSSProperties
            }
          />
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function startDateOf(event: CalendarEvent | null) {
  if (event) {
    return new Date(event.start);
  }
  return new Date();
}

function endDateOf(event: CalendarEvent | null) {
  if (event) {
    return new Date(event.end);
  }
  return new Date();
}

function initialTimeOf(date: Date | undefined, fallback: string) {
  if (date) {
    return formatTimeForInput(new Date(date));
  }
  return fallback;
}

function titleOf(isExisting: boolean) {
  if (isExisting) {
    return 'Edit event';
  }
  return 'New event';
}

function saveLabelOf(isExisting: boolean) {
  if (isExisting) {
    return 'Save changes';
  }
  return 'Create event';
}

function subtitleOf(event: CalendarEvent | null) {
  if (!event) {
    return 'The title, time, place and colour of the event.';
  }
  return whenLabelOf(event);
}

type EventFormProps = {
  event: CalendarEvent | null;
  colorOptions: EventColorOption[];
  colorLegend: string;
  onCancel: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
};

function EventForm({
  event,
  colorOptions,
  colorLegend,
  onCancel,
  onSave,
  onDelete,
}: EventFormProps) {
  const id = useId();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(() => startDateOf(event));
  const [endDate, setEndDate] = useState(() => endDateOf(event));
  const [startTime, setStartTime] = useState(() =>
    initialTimeOf(event?.start, DEFAULT_START_TIME)
  );
  const [endTime, setEndTime] = useState(() =>
    initialTimeOf(event?.end, DEFAULT_END_TIME)
  );
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [location, setLocation] = useState(event?.location ?? '');
  const [color, setColor] = useState<EventColor>(
    event?.color ?? DefaultEventColor
  );
  const [error, setError] = useState<string | null>(null);
  const isExisting = Boolean(event?.id);
  const hasTimes = !allDay;

  function pickStartDate(date: Date) {
    setStartDate(date);
    if (isBefore(endDate, date)) {
      setEndDate(date);
    }
    setError(null);
  }

  function pickEndDate(date: Date) {
    setEndDate(date);
    setError(null);
  }

  function handleSave(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (allDay) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const startParts = hoursAndMinutesOf(startTime);
      const endParts = hoursAndMinutesOf(endTime);
      const startIsOutside = isHourOutsideDay(startParts.hours);
      const endIsOutside = isHourOutsideDay(endParts.hours);
      if (startIsOutside || endIsOutside) {
        setError(`Pick times between ${StartHour}:00 and ${EndHour}:00.`);
        return;
      }
      start.setHours(startParts.hours, startParts.minutes, 0, 0);
      end.setHours(endParts.hours, endParts.minutes, 0, 0);
    }

    if (isBefore(end, start)) {
      setError('The end is before the start. Pick a later end.');
      return;
    }

    let eventTitle = title;
    if (!title.trim()) {
      eventTitle = UNTITLED;
    }

    onSave({
      id: event?.id ?? '',
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color,
    });
  }

  return (
    <form className='flex flex-col gap-4' onSubmit={handleSave} noValidate>
      <DialogHeader>
        <DialogTitle>{titleOf(isExisting)}</DialogTitle>
        <DialogDescription>{subtitleOf(event)}</DialogDescription>
      </DialogHeader>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key='error'
            role='alert'
            className='bg-destructive/10 text-destructive-ink rounded-md px-3 py-2 text-[13px]'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: ENTER }}
            exit={{ opacity: 0, transition: EXIT }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <div className='grid gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor={`${id}-title`}>Title</Label>
          <Input
            id={`${id}-title`}
            value={title}
            placeholder={UNTITLED}
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          />
        </div>

        <div className='flex gap-4'>
          <DatePickerField
            id={`${id}-start-date`}
            label='Start date'
            date={startDate}
            onPick={pickStartDate}
          />
          {hasTimes && (
            <TimeSelectField
              id={`${id}-start-time`}
              label='Start time'
              value={startTime}
              onChange={setStartTime}
            />
          )}
        </div>

        <div className='flex gap-4'>
          <DatePickerField
            id={`${id}-end-date`}
            label='End date'
            date={endDate}
            disabledBefore={startDate}
            onPick={pickEndDate}
          />
          {hasTimes && (
            <TimeSelectField
              id={`${id}-end-time`}
              label='End time'
              value={endTime}
              onChange={setEndTime}
            />
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Checkbox
            id={`${id}-all-day`}
            checked={allDay}
            onCheckedChange={setAllDay}
          />
          <Label htmlFor={`${id}-all-day`}>All day</Label>
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label htmlFor={`${id}-location`}>Location</Label>
          <Input
            id={`${id}-location`}
            value={location}
            onChange={(changeEvent) => setLocation(changeEvent.target.value)}
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label htmlFor={`${id}-description`}>Description</Label>
          <Textarea
            id={`${id}-description`}
            value={description}
            onChange={(changeEvent) => setDescription(changeEvent.target.value)}
            rows={3}
          />
        </div>

        <ColorField
          color={color}
          options={colorOptions}
          legend={colorLegend}
          onChange={setColor}
        />
      </div>
      <DialogFooter className='flex-row sm:justify-between'>
        {isExisting && (
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={() => onDelete(event?.id ?? '')}
            aria-label='Delete event'
          >
            <TrashIcon />
          </Button>
        )}
        <div className='flex flex-1 justify-end gap-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit'>{saveLabelOf(isExisting)}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}

type EventDialogProps = {
  event: CalendarEvent | null;
  isOpen: boolean;
  /** Changes on every opening, so the form starts from the event it was opened for. */
  session: number;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  /** The colours to pick from, with their names: plain colours, or the calendars of an app. */
  colorOptions?: EventColorOption[];
  colorLegend?: string;
};

/**
 * One layer for reading and changing an event. A click on an event opens it here, ready to
 * edit; a click on an empty slot opens it as a new event at that time.
 */
export function EventDialog({
  event,
  isOpen,
  session,
  onClose,
  onSave,
  onDelete,
  colorOptions = EventColors,
  colorLegend = 'Colour',
}: EventDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <EventForm
          key={session}
          event={event}
          colorOptions={colorOptions}
          colorLegend={colorLegend}
          onCancel={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
