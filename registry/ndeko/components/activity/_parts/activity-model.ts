import type { PriorityId, StatusId } from './glyphs';
import { dayKeyOf, dayLabelOf } from './time';

export type ActivityChange =
  | { field: 'status'; from?: StatusId; to?: StatusId }
  | { field: 'assignee'; from?: string; to?: string }
  | { field: 'estimate'; from?: number; to?: number }
  | { field: 'priority'; from?: PriorityId; to?: PriorityId }
  | { field: 'due'; from?: string; to?: string }
  | { field: 'label'; from?: string; to?: string };

export type ActivityField = ActivityChange['field'];

export type ActivityKind = ActivityField | 'created' | 'comment';

type EventBase = {
  id: string;
  actorId: string;
  at: string;
};

export type ActivityEvent =
  | (EventBase & { kind: 'created' })
  | (EventBase & { kind: 'change'; change: ActivityChange })
  | (EventBase & { kind: 'comment'; body: string });

export type Label = {
  id: string;
  name: string;
  color: string;
};

export const TASK_KEY = 'MOS-214';

export const TASK_TITLE = 'Export invoices as CSV';

export const LABELS: Label[] = [
  { id: 'billing', name: 'Billing', color: 'var(--info)' },
  { id: 'reports', name: 'Reports', color: 'var(--success)' },
  { id: 'api', name: 'API', color: 'var(--warning)' },
];

export function labelOf(id: string) {
  const found = LABELS.find((label) => label.id === id);
  if (found) {
    return found;
  }
  return LABELS[0];
}

export const TASK_HISTORY: ActivityEvent[] = [
  {
    id: 'e1',
    kind: 'created',
    actorId: 'sana',
    at: '2026-11-03T09:12:00',
  },
  {
    id: 'e2',
    kind: 'change',
    actorId: 'sana',
    at: '2026-11-03T09:13:00',
    change: { field: 'priority', to: 'high' },
  },
  {
    id: 'e3',
    kind: 'change',
    actorId: 'sana',
    at: '2026-11-03T09:13:00',
    change: { field: 'label', to: 'billing' },
  },
  {
    id: 'e4',
    kind: 'change',
    actorId: 'mei',
    at: '2026-11-04T10:05:00',
    change: { field: 'assignee', to: 'leo' },
  },
  {
    id: 'e5',
    kind: 'change',
    actorId: 'leo',
    at: '2026-11-04T10:20:00',
    change: { field: 'estimate', to: 240 },
  },
  {
    id: 'e6',
    kind: 'change',
    actorId: 'leo',
    at: '2026-11-04T14:02:00',
    change: { field: 'status', from: 'todo', to: 'in_progress' },
  },
  {
    id: 'e7',
    kind: 'comment',
    actorId: 'leo',
    at: '2026-11-04T16:40:00',
    body: 'The first pass exports the visible columns only. The totals row comes next.',
  },
  {
    id: 'e8',
    kind: 'change',
    actorId: 'leo',
    at: '2026-11-05T09:31:00',
    change: { field: 'estimate', from: 240, to: 360 },
  },
  {
    id: 'e9',
    kind: 'change',
    actorId: 'leo',
    at: '2026-11-05T09:32:00',
    change: { field: 'due', to: '2026-11-07' },
  },
  {
    id: 'e10',
    kind: 'change',
    actorId: 'leo',
    at: '2026-11-05T10:18:00',
    change: { field: 'status', from: 'in_progress', to: 'in_review' },
  },
  {
    id: 'e11',
    kind: 'change',
    actorId: 'amara',
    at: '2026-11-05T10:24:00',
    change: { field: 'assignee', to: 'tomas' },
  },
  {
    id: 'e12',
    kind: 'comment',
    actorId: 'tomas',
    at: '2026-11-05T10:52:00',
    body: 'Reviewing now. Dates come out in the account time zone, as the ticket asks.',
  },
];

export function kindOf(event: ActivityEvent): ActivityKind {
  if (event.kind === 'change') {
    return event.change.field;
  }
  return event.kind;
}

export type ActivityDay = {
  key: string;
  label: string;
  events: ActivityEvent[];
};

export function daysOf(events: ActivityEvent[]) {
  const days: ActivityDay[] = [];
  for (const event of events) {
    const key = dayKeyOf(event.at);
    const last = days.at(-1);
    const isSameDay = last?.key === key;
    if (isSameDay) {
      last.events.push(event);
      continue;
    }
    days.push({ key, label: dayLabelOf(event.at), events: [event] });
  }
  return days;
}

export function newestFirst(events: ActivityEvent[]) {
  return [...events].sort((first, second) => second.at.localeCompare(first.at));
}
