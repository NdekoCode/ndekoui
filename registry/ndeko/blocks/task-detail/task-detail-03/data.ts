export type StatusId =
  'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type Person = {
  id: string;
  name: string;
  firstName: string;
};

export type Subtask = {
  id: string;
  number: number;
  title: string;
  isDone: boolean;
  assigneeId?: string;
};

export type TaskComment = {
  id: string;
  authorId: string;
  at: string;
  body: string;
  /** Order of what was added during the visit, which all shares the same time. */
  seq?: number;
};

export type WorkEventKind =
  'created' | 'status' | 'assignee' | 'estimate' | 'subtask' | 'comment';

export type WorkEvent = {
  id: string;
  kind: WorkEventKind;
  actorId: string;
  at: string;
  text: string;
  seq?: number;
};

export type Task = {
  key: string;
  title: string;
  project: string;
  status: StatusId;
  assigneeIds: string[];
  due: string;
  description: string;
};

/** The previews read every time against one fixed moment, so the server and the browser print the same labels. */
export const NOW = '2026-11-05T11:00:00';

export const TEAM_KEY = 'MOS';

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    firstName: 'Amara',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    firstName: 'Léo',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    firstName: 'Sana',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    firstName: 'Tomás',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    firstName: 'Mei',
  },
];

export const TASK: Task = {
  key: 'MOS-214',
  title: 'Export invoices as CSV',
  project: 'Billing',
  status: 'in_progress',
  assigneeIds: ['leo', 'tomas'],
  due: '2026-11-07',
  description:
    'Finance copies invoices into the ledger by hand every month. Add an export on the invoices page that writes the filtered range to a CSV file finance can import as it is.',
};

export const SUBTASKS: Subtask[] = [
  {
    id: 'mos-215',
    number: 215,
    title: 'Pick the columns finance needs',
    isDone: true,
    assigneeId: 'leo',
  },
  {
    id: 'mos-216',
    number: 216,
    title: 'Write the CSV writer with escaped fields',
    isDone: true,
    assigneeId: 'leo',
  },
  {
    id: 'mos-218',
    number: 218,
    title: 'Add the totals row',
    isDone: false,
    assigneeId: 'leo',
  },
  {
    id: 'mos-219',
    number: 219,
    title: 'Dates in the account time zone',
    isDone: false,
    assigneeId: 'tomas',
  },
  {
    id: 'mos-220',
    number: 220,
    title: 'Download button on the invoices page',
    isDone: false,
    assigneeId: 'mei',
  },
];

export const COMMENTS: TaskComment[] = [
  {
    id: 'c1',
    authorId: 'sana',
    at: '2026-11-04T15:20:00',
    body: 'Should the export include voided invoices? Finance filters them out by hand today.',
  },
  {
    id: 'c2',
    authorId: 'leo',
    at: '2026-11-04T16:05:00',
    body: 'I would keep them with a Status column, so the totals still match the ledger.',
  },
  {
    id: 'c3',
    authorId: 'tomas',
    at: '2026-11-05T10:05:00',
    body: '@Amara Okafor the time zone part is in review. Dates now follow the account setting.',
  },
];

export const EVENTS: WorkEvent[] = [
  {
    id: 'e1',
    kind: 'created',
    actorId: 'sana',
    at: '2026-11-03T09:12:00',
    text: 'created the task',
  },
  {
    id: 'e2',
    kind: 'assignee',
    actorId: 'mei',
    at: '2026-11-04T10:05:00',
    text: 'assigned Léo and Tomás',
  },
  {
    id: 'e3',
    kind: 'estimate',
    actorId: 'leo',
    at: '2026-11-04T10:20:00',
    text: 'set the estimate to 6h',
  },
  {
    id: 'e4',
    kind: 'status',
    actorId: 'leo',
    at: '2026-11-04T14:02:00',
    text: 'moved the task to In progress',
  },
  {
    id: 'e5',
    kind: 'subtask',
    actorId: 'leo',
    at: '2026-11-05T09:40:00',
    text: 'completed MOS-216 Write the CSV writer with escaped fields',
  },
];
