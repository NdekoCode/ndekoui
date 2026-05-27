'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { addDays } from 'date-fns';
import { Fragment, useId, useState } from 'react';
import {
  Label as AriaLabel,
  type DateRange as AriaDateRange,
  type DateValue,
} from 'react-aria-components';
import type { DateRange } from 'react-day-picker';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { Calendar } from '@/registry/ndeko/ui/calendar';
import {
  Calendar as AriaCalendar,
  RangeCalendar as AriaRangeCalendar,
} from '@/registry/ndeko/ui/calendar-rac';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  CheckboxTree,
  type CheckboxTreeNode,
  type CheckboxTreeRenderProps,
} from '@/registry/ndeko/ui/checkbox-tree';
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
  ComboboxValue,
} from '@/registry/ndeko/ui/combobox';
import {
  DateField,
  DateInput,
  TimeField,
} from '@/registry/ndeko/ui/datefield-rac';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Label, LABEL_RECIPE } from '@/registry/ndeko/ui/label';

import { useIsClient } from '../use-is-client';

type Option = {
  value: string;
  label: string;
};

const NOTIFICATIONS: CheckboxTreeNode = {
  id: 'all',
  label: 'All notifications',
  children: [
    { id: 'mentions', label: 'Mentions', defaultChecked: true },
    {
      id: 'comments',
      label: 'Comments',
      children: [
        { id: 'own-tasks', label: 'On my tasks', defaultChecked: true },
        { id: 'followed-tasks', label: 'On tasks I follow' },
      ],
    },
    { id: 'due-dates', label: 'Due dates' },
  ],
};

const PROJECTS: Option[] = [
  { value: 'website', label: 'Website redesign' },
  { value: 'mobile', label: 'Mobile app' },
  { value: 'brand', label: 'Brand refresh' },
  { value: 'billing', label: 'Billing migration' },
  { value: 'help', label: 'Help center' },
  { value: 'onboarding', label: 'Onboarding flow' },
];

const LABELS: Option[] = [
  { value: 'design', label: 'Design' },
  { value: 'bug', label: 'Bug' },
  { value: 'docs', label: 'Docs' },
  { value: 'research', label: 'Research' },
  { value: 'performance', label: 'Performance' },
  { value: 'accessibility', label: 'Accessibility' },
];

const INITIAL_LABELS = [LABELS[0], LABELS[2]];

const RANGE_LENGTH_DAYS = 4;

function labelsPlaceholderOf(selected: Option[]) {
  if (selected.length > 0) {
    return '';
  }
  return 'Add labels';
}

function upcomingRange(): DateRange {
  const start = new Date();
  const end = addDays(start, RANGE_LENGTH_DAYS);
  return { from: start, to: end };
}

function todayInLocalZone() {
  return today(getLocalTimeZone());
}

function upcomingAriaRange(): AriaDateRange {
  const start = todayInLocalZone();
  const end = start.add({ days: RANGE_LENGTH_DAYS });
  return { start, end };
}

export function CheckboxTreeDemo() {
  const id = useId();

  function renderNode({
    node,
    checked,
    indeterminate,
    onCheckedChange,
    children,
  }: CheckboxTreeRenderProps) {
    const nodeId = `${id}-${node.id}`;

    return (
      <Fragment key={nodeId}>
        <div className='flex items-center gap-2'>
          <Checkbox
            id={nodeId}
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={onCheckedChange}
          />
          <Label htmlFor={nodeId}>{node.label}</Label>
        </div>
        {children && <div className='ms-6 space-y-3'>{children}</div>}
      </Fragment>
    );
  }

  return (
    <div className='space-y-3'>
      <CheckboxTree tree={NOTIFICATIONS} renderNode={renderNode} />
    </div>
  );
}

export function ComboboxDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-5'>
      <Field>
        <FieldLabel>Project</FieldLabel>
        <Combobox items={PROJECTS}>
          <ComboboxSelectTrigger placeholder='Pick a project' />
          <ComboboxContent className='flex flex-col p-0'>
            <div className='hairline-b border-border flex h-10 shrink-0 items-center gap-2 px-3'>
              <SearchIcon className='text-muted-foreground size-4 shrink-0' />
              <ComboboxInput
                aria-label='Search projects'
                placeholder='Search projects'
                className='h-full px-0'
              />
            </div>
            <ComboboxEmpty>No project matches your search.</ComboboxEmpty>
            <ComboboxList className='max-h-64 overflow-y-auto p-1 empty:hidden'>
              {(project: Option) => (
                <ComboboxItem key={project.value} value={project}>
                  {project.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      <Field>
        <FieldLabel>Labels</FieldLabel>
        <Combobox items={LABELS} multiple defaultValue={INITIAL_LABELS}>
          <ComboboxInputGroup>
            <ComboboxChips>
              <ComboboxValue>
                {(selected: Option[]) => (
                  <>
                    {selected.map((label) => (
                      <ComboboxChip key={label.value} aria-label={label.label}>
                        {label.label}
                        <ComboboxChipRemove
                          aria-label={`Remove ${label.label}`}
                        />
                      </ComboboxChip>
                    ))}
                    <ComboboxInput
                      placeholder={labelsPlaceholderOf(selected)}
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
          </ComboboxInputGroup>
          <ComboboxContent>
            <ComboboxEmpty>No label matches your search.</ComboboxEmpty>
            <ComboboxList className='empty:hidden'>
              {(label: Option) => (
                <ComboboxItem key={label.value} value={label}>
                  {label.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}

function DateFields() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-4'>
      <DateField className='flex flex-col gap-1.5'>
        <AriaLabel className={LABEL_RECIPE}>Start date</AriaLabel>
        <DateInput />
      </DateField>
      <TimeField className='flex flex-col gap-1.5'>
        <AriaLabel className={LABEL_RECIPE}>Reminder time</AriaLabel>
        <DateInput />
      </TimeField>
    </div>
  );
}

function DayPickerPair() {
  const [day, setDay] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(upcomingRange);

  return (
    <div className='flex flex-wrap items-start justify-center gap-x-12 gap-y-6'>
      <Calendar mode='single' selected={day} onSelect={setDay} />
      <Calendar mode='range' selected={range} onSelect={setRange} />
    </div>
  );
}

function AriaCalendarPair() {
  const [date, setDate] = useState<DateValue | null>(todayInLocalZone);
  const [range, setRange] = useState<AriaDateRange | null>(upcomingAriaRange);

  return (
    <div className='flex flex-wrap items-start justify-center gap-x-12 gap-y-6'>
      <AriaCalendar aria-label='Due date' value={date} onChange={setDate} />
      <AriaRangeCalendar
        aria-label='Sprint dates'
        value={range}
        onChange={setRange}
      />
    </div>
  );
}

/** Dates, locales and time zones differ between the prerendered page and the visitor, so these render once mounted. */
export function DateFieldDemo() {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className='h-30 w-full max-w-xs' aria-hidden='true' />;
  }
  return <DateFields />;
}

export function CalendarDemo() {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className='h-80 w-full' aria-hidden='true' />;
  }
  return <DayPickerPair />;
}

export function CalendarRacDemo() {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className='h-80 w-full' aria-hidden='true' />;
  }
  return <AriaCalendarPair />;
}
