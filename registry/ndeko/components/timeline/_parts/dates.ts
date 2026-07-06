import { differenceInMinutes, format, parseISO } from 'date-fns';

/* Every time is read against one fixed moment and written without a time zone, so the server and the browser print the same labels. */
const NOW = '2026-11-12T15:00:00';

const MINUTES_PER_HOUR = 60;

const MINUTES_PER_DAY = 1440;

export function dayLabelOf(isoDay: string) {
  const day = parseISO(isoDay);
  return format(day, 'MMM d, yyyy');
}

export function stampLabelOf(isoTime: string) {
  const time = parseISO(isoTime);
  return format(time, "MMMM d, yyyy 'at' HH:mm");
}

function agoOf(count: number, unit: string) {
  if (count === 1) {
    return `1 ${unit} ago`;
  }
  return `${count} ${unit}s ago`;
}

export function agoLabelOf(isoTime: string) {
  const now = parseISO(NOW);
  const time = parseISO(isoTime);
  const minutes = differenceInMinutes(now, time);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < MINUTES_PER_HOUR) {
    return agoOf(minutes, 'minute');
  }
  if (minutes < MINUTES_PER_DAY) {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    return agoOf(hours, 'hour');
  }
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  return agoOf(days, 'day');
}
