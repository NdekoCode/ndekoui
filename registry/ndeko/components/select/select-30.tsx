import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

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

const TIMEZONES = timezoneOptionsOf(new Date());

export default function Select30() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Time zone</FieldLabel>
      <Select items={TIMEZONES} defaultValue='Europe/London'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a time zone' />
        </SelectTrigger>
        <SelectContent className='max-h-80'>
          {TIMEZONES.map((timezone) => (
            <SelectItem key={timezone.value} value={timezone.value}>
              {timezone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
