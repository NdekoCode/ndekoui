'use client';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
} from '@/registry/ndeko/ui/combobox';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type TimezoneOption = {
  value: string;
  label: string;
  offsetHours: number;
};

function offsetNameOf(timezone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(now);
  const namePart = parts.find((part) => part.type === 'timeZoneName');
  const offsetName = namePart?.value ?? 'GMT';
  if (offsetName === 'GMT') {
    return 'GMT+0';
  }
  return offsetName;
}

function offsetHoursOf(offsetName: string) {
  const signedOffset = offsetName.replace('GMT', '');
  return Number.parseInt(signedOffset, 10);
}

function timezoneOptionOf(timezone: string, now: Date): TimezoneOption {
  const offsetName = offsetNameOf(timezone, now);
  const placeName = timezone.replaceAll('_', ' ');
  const offsetHours = offsetHoursOf(offsetName);
  return {
    value: timezone,
    label: `(${offsetName}) ${placeName}`,
    offsetHours,
  };
}

function byOffset(first: TimezoneOption, second: TimezoneOption) {
  return first.offsetHours - second.offsetHours;
}

function timezoneOptionsOf(now: Date) {
  const timezones = Intl.supportedValuesOf('timeZone');
  const options = timezones.map((timezone) => timezoneOptionOf(timezone, now));
  return options.sort(byOffset);
}

function isLondon(timezone: TimezoneOption) {
  return timezone.value === 'Europe/London';
}

const TIMEZONES = timezoneOptionsOf(new Date());

const DEFAULT_TIMEZONE = TIMEZONES.find(isLondon) ?? null;

export default function Select43() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Time zone</FieldLabel>
      <Combobox items={TIMEZONES} defaultValue={DEFAULT_TIMEZONE}>
        <ComboboxSelectTrigger placeholder='Pick a time zone' />
        <ComboboxContent className='flex flex-col p-0'>
          <div className='hairline-b border-border flex h-10 shrink-0 items-center gap-2 px-3'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <ComboboxInput
              aria-label='Search time zones'
              placeholder='Search time zones'
              className='h-full px-0'
            />
          </div>
          <ComboboxEmpty>No time zone matches your search.</ComboboxEmpty>
          <ComboboxList className='max-h-72 overflow-y-auto p-1 empty:hidden'>
            {(timezone: TimezoneOption) => (
              <ComboboxItem key={timezone.value} value={timezone}>
                <span className='truncate'>{timezone.label}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
