import {
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  parseISO,
} from 'date-fns';

/** The previews read every time against one fixed moment, so the server and the browser print the same labels. */
export const NOW = '2026-11-05T11:00:00';

const MINUTES_PER_HOUR = 60;

function daysBeforeNow(iso: string) {
  return differenceInCalendarDays(parseISO(NOW), parseISO(iso));
}

export function relativeTimeOf(iso: string) {
  const minutes = differenceInMinutes(parseISO(NOW), parseISO(iso));
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m ago`;
  }
  const days = daysBeforeNow(iso);
  if (days === 0) {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    return `${hours}h ago`;
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return format(parseISO(iso), 'MMM d');
}

export function exactTimeOf(iso: string) {
  return format(parseISO(iso), "EEE, MMM d 'at' HH:mm");
}

export function clockOf(iso: string) {
  return format(parseISO(iso), 'HH:mm');
}

export function dayKeyOf(iso: string) {
  return iso.slice(0, 10);
}

export function dayLabelOf(iso: string) {
  const days = daysBeforeNow(iso);
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return format(parseISO(iso), 'EEEE, MMM d');
}

export function shortDateOf(iso: string) {
  return format(parseISO(iso), 'MMM d');
}

export function durationLabelOf(minutes: number) {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `${rest}m`;
  }
  if (rest === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${rest}m`;
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}
