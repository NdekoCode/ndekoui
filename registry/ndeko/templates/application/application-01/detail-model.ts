import {
  addDays,
  format,
  isSameDay,
  nextMonday,
  parseISO,
  subDays,
} from 'date-fns';

import { TODAY, type FeedItem } from './data';
import { keyOf } from './task-model';

export type FeedFilter = 'all' | 'comments' | 'history';

export type DayGroup = {
  day: string;
  label: string;
  items: FeedItem[];
};

export type DatePreset = {
  label: string;
  date: string;
};

export function isFeedFilter(value: unknown): value is FeedFilter {
  const isAll = value === 'all';
  const isComments = value === 'comments';
  const isHistory = value === 'history';
  return isAll || isComments || isHistory;
}

export function taskUrlOf(number: number) {
  return `https://example.com/mossline/tasks/${keyOf(number)}`;
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

export function shortDateOf(iso: string) {
  return format(parseISO(iso), 'MMM d');
}

export function longDateOf(iso: string) {
  return format(parseISO(iso), 'EEE, MMM d');
}

export function timeOf(iso: string) {
  return format(parseISO(iso), 'HH:mm');
}

function isoDayOf(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function datePresetsOf(): DatePreset[] {
  const today = parseISO(TODAY);
  return [
    { label: 'Today', date: TODAY },
    { label: 'Tomorrow', date: isoDayOf(addDays(today, 1)) },
    { label: 'Next Monday', date: isoDayOf(nextMonday(today)) },
    { label: 'In a week', date: isoDayOf(addDays(today, 7)) },
    { label: 'In two weeks', date: isoDayOf(addDays(today, 14)) },
  ];
}

export const ESTIMATE_PRESETS = [30, 60, 120, 240, 480];

function dayLabelOf(day: string) {
  const date = parseISO(day);
  const today = parseISO(TODAY);
  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, subDays(today, 1))) {
    return 'Yesterday';
  }
  return format(date, 'EEE, MMM d');
}

function matchesFeedFilter(item: FeedItem, filter: FeedFilter) {
  if (filter === 'comments') {
    return item.kind === 'comment';
  }
  if (filter === 'history') {
    return item.kind === 'change';
  }
  return true;
}

export function feedCountsOf(items: FeedItem[]): Record<FeedFilter, number> {
  const comments = items.filter((item) => item.kind === 'comment').length;
  const history = items.length - comments;
  return { all: items.length, comments, history };
}

export function dayGroupsOf(items: FeedItem[], filter: FeedFilter) {
  const shown = items.filter((item) => matchesFeedFilter(item, filter));
  const sorted = [...shown].sort((first, second) =>
    first.at.localeCompare(second.at)
  );
  const groups: DayGroup[] = [];
  for (const item of sorted) {
    const day = item.at.slice(0, 10);
    const last = groups.at(-1);
    const isSameGroup = last?.day === day;
    if (isSameGroup) {
      last.items.push(item);
      continue;
    }
    groups.push({ day, label: dayLabelOf(day), items: [item] });
  }
  return groups;
}
