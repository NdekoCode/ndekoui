import {
  addDays,
  format,
  isBefore,
  isSameDay,
  nextMonday,
  parseISO,
  subDays,
} from 'date-fns';

import {
  CURRENT_USER_ID,
  ISSUE_TYPES,
  LABELS,
  PEOPLE,
  PRIORITIES,
  STATUSES,
  TEAM_KEY,
  TODAY,
  type FeedItem,
  type IssueTypeId,
  type PriorityId,
  type StatusId,
  type TaskDetail,
} from './data';

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

function byId<Item extends { id: string }>(items: Item[], id: string): Item {
  const found = items.find((item) => item.id === id);
  if (found) {
    return found;
  }
  return items[0];
}

export function statusOf(id: StatusId) {
  return byId(STATUSES, id);
}

export function priorityOf(id: PriorityId) {
  return byId(PRIORITIES, id);
}

export function issueTypeOf(id: IssueTypeId) {
  return byId(ISSUE_TYPES, id);
}

export function personOf(id: string) {
  return byId(PEOPLE, id);
}

export function currentUser() {
  return personOf(CURRENT_USER_ID);
}

export function peopleOf(ids: string[]) {
  return PEOPLE.filter((person) => ids.includes(person.id));
}

export function labelsOf(ids: string[]) {
  return LABELS.filter((label) => ids.includes(label.id));
}

export function isStatusId(value: unknown): value is StatusId {
  return STATUSES.some((status) => status.id === value);
}

export function isPriorityId(value: unknown): value is PriorityId {
  return PRIORITIES.some((priority) => priority.id === value);
}

export function isFeedFilter(value: unknown): value is FeedFilter {
  const isAll = value === 'all';
  const isComments = value === 'comments';
  const isHistory = value === 'history';
  return isAll || isComments || isHistory;
}

export function keyOf(number: number) {
  return `${TEAM_KEY}-${number}`;
}

export function taskUrlOf(number: number) {
  return `https://example.com/mossline/tasks/${keyOf(number)}`;
}

export function toggledIds(ids: string[], id: string, isIncluded: boolean) {
  const withoutId = ids.filter((current) => current !== id);
  if (isIncluded) {
    return [...withoutId, id];
  }
  return withoutId;
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

export function isOverdue(task: TaskDetail) {
  if (!task.due) {
    return false;
  }
  if (task.status === 'done') {
    return false;
  }
  return isBefore(parseISO(task.due), parseISO(TODAY));
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

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}

export function nextNumberOf(tasks: TaskDetail[]) {
  const numbers: number[] = [];
  for (const task of tasks) {
    numbers.push(task.number);
    const childNumbers = task.children.map((child) => child.number);
    numbers.push(...childNumbers);
  }
  return Math.max(0, ...numbers) + 1;
}

export function workedMinutesOf(task: TaskDetail) {
  let total = 0;
  for (const entry of task.worked) {
    total += entry.minutes;
  }
  return total;
}
