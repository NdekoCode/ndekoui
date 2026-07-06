import { OFFICE_HOURS, type Office } from './data';

const CLOCK_FORMATS = new Map<string, Intl.DateTimeFormat>();

const HOUR_FORMATS = new Map<string, Intl.DateTimeFormat>();

function clockFormatOf(timeZone: string) {
  const cached = CLOCK_FORMATS.get(timeZone);
  if (cached) {
    return cached;
  }
  const format = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  CLOCK_FORMATS.set(timeZone, format);
  return format;
}

function hourFormatOf(timeZone: string) {
  const cached = HOUR_FORMATS.get(timeZone);
  if (cached) {
    return cached;
  }
  const format = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  HOUR_FORMATS.set(timeZone, format);
  return format;
}

export function localTimeOf(now: number, office: Office) {
  if (now === 0) {
    return '--:--';
  }
  return clockFormatOf(office.timeZone).format(now);
}

export function isOpenAt(now: number, office: Office) {
  if (now === 0) {
    return false;
  }
  const hour = Number(hourFormatOf(office.timeZone).format(now));
  const hasOpened = hour >= OFFICE_HOURS.opens;
  const hasNotClosed = hour < OFFICE_HOURS.closes;
  return hasOpened && hasNotClosed;
}

export function statusOf(now: number, office: Office) {
  if (now === 0) {
    return 'Checking the time';
  }
  if (isOpenAt(now, office)) {
    return 'Open now';
  }
  return 'Closed';
}
