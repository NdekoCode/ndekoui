export type StatusId =
  'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type PriorityId = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type IssueTypeId = 'task' | 'bug' | 'story' | 'epic';

export type Person = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
};

export type Status = {
  id: StatusId;
  name: string;
  color: string;
};

export type Priority = {
  id: PriorityId;
  name: string;
};

export type IssueType = {
  id: IssueTypeId;
  name: string;
  color: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type ChildIssue = {
  id: string;
  number: number;
  title: string;
  status: StatusId;
  assigneeId?: string;
};

export type ChangeKind =
  'created' | 'status' | 'assignee' | 'estimate' | 'label' | 'priority';

export type FeedComment = {
  kind: 'comment';
  id: string;
  authorId: string;
  at: string;
  body: string;
};

export type FeedChange = {
  kind: 'change';
  id: string;
  authorId: string;
  at: string;
  change: ChangeKind;
  text: string;
};

export type FeedItem = FeedComment | FeedChange;

export type WorkedTime = {
  personId: string;
  minutes: number;
};

export type ParentTask = {
  number: number;
  title: string;
};

export type TaskDetail = {
  id: string;
  number: number;
  title: string;
  type: IssueTypeId;
  status: StatusId;
  priority: PriorityId;
  labelIds: string[];
  assigneeIds: string[];
  due?: string;
  estimateMinutes?: number;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  parent?: ParentTask;
  description: string[];
  children: ChildIssue[];
  feed: FeedItem[];
  worked: WorkedTime[];
};

export const TEAM_KEY = 'MOS';

export const TEAM_NAME = 'Mossline Web';

export const TODAY = '2026-11-05';

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    initials: 'SI',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    initials: 'TR',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    initials: 'ML',
    avatar: '/avatars/avatar-07.svg',
  },
];

export const STATUSES: Status[] = [
  { id: 'backlog', name: 'Backlog', color: 'var(--muted-foreground)' },
  { id: 'todo', name: 'Todo', color: 'var(--muted-foreground)' },
  { id: 'in_progress', name: 'In progress', color: 'var(--warning)' },
  { id: 'in_review', name: 'In review', color: 'var(--primary)' },
  { id: 'done', name: 'Done', color: 'var(--success)' },
];

export const PRIORITIES: Priority[] = [
  { id: 'urgent', name: 'Urgent' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
  { id: 'none', name: 'No priority' },
];

export const ISSUE_TYPES: IssueType[] = [
  { id: 'task', name: 'Task', color: 'var(--info)' },
  { id: 'bug', name: 'Bug', color: 'var(--destructive)' },
  { id: 'story', name: 'Story', color: 'var(--success)' },
  { id: 'epic', name: 'Epic', color: 'var(--primary)' },
];

export const LABELS: Label[] = [
  { id: 'frontend', name: 'Frontend', color: 'var(--info)' },
  { id: 'design', name: 'Design', color: 'hsl(280 62% 58%)' },
  { id: 'api', name: 'API', color: 'var(--success)' },
  { id: 'mobile', name: 'Mobile', color: 'hsl(190 75% 40%)' },
  { id: 'performance', name: 'Performance', color: 'var(--warning)' },
  { id: 'accessibility', name: 'Accessibility', color: 'hsl(330 70% 55%)' },
];

export const TASKS: TaskDetail[] = [
  {
    id: 'mos-148',
    number: 148,
    title: 'Booking calendar skips the first week on Safari',
    type: 'bug',
    status: 'in_progress',
    priority: 'urgent',
    labelIds: ['frontend'],
    assigneeIds: ['leo'],
    due: '2026-11-06',
    estimateMinutes: 480,
    createdAt: '2026-11-02T09:14:00',
    updatedAt: '2026-11-05T10:31:00',
    reporterId: 'mei',
    parent: { number: 131, title: 'Booking flow redesign' },
    description: [
      'On Safari, the booking calendar opens on the second week of the month when the month starts on a Sunday. The first row of days is never drawn, so nobody can book the 1st or the 2nd.',
      'Open a studio page, pick November and look at the first row: it is there in the other browsers and missing in Safari.',
      'The month should start on its first day in every browser, with the week starting on the day set for the workspace.',
    ],
    children: [
      {
        id: 'mos-149',
        number: 149,
        title: 'Reproduce on the last two Safari versions',
        status: 'done',
        assigneeId: 'leo',
      },
      {
        id: 'mos-150',
        number: 150,
        title: 'Fix the week offset when a month starts on Sunday',
        status: 'in_progress',
        assigneeId: 'leo',
      },
      {
        id: 'mos-151',
        number: 151,
        title: 'Add a test month that starts on a Sunday',
        status: 'todo',
        assigneeId: 'sana',
      },
      {
        id: 'mos-153',
        number: 153,
        title: 'Check the calendar in the mobile web view',
        status: 'todo',
        assigneeId: 'tomas',
      },
    ],
    feed: [
      {
        kind: 'change',
        id: 'f-148-1',
        authorId: 'mei',
        at: '2026-11-02T09:14:00',
        change: 'created',
        text: 'created the task',
      },
      {
        kind: 'change',
        id: 'f-148-2',
        authorId: 'mei',
        at: '2026-11-02T09:15:00',
        change: 'assignee',
        text: 'assigned Léo Martin',
      },
      {
        kind: 'comment',
        id: 'f-148-3',
        authorId: 'leo',
        at: '2026-11-03T11:02:00',
        body: 'Reproduced on both versions. It only happens when the 1st is a Sunday and the week starts on Monday.',
      },
      {
        kind: 'change',
        id: 'f-148-4',
        authorId: 'leo',
        at: '2026-11-04T08:40:00',
        change: 'status',
        text: 'moved it from Todo to In progress',
      },
      {
        kind: 'comment',
        id: 'f-148-5',
        authorId: 'sana',
        at: '2026-11-04T16:20:00',
        body: 'The week number for the 1st comes back one higher on Safari. I can pair on it tomorrow morning.',
      },
      {
        kind: 'change',
        id: 'f-148-6',
        authorId: 'leo',
        at: '2026-11-05T09:05:00',
        change: 'estimate',
        text: 'set the estimate to 8h 00m',
      },
      {
        kind: 'comment',
        id: 'f-148-7',
        authorId: 'mei',
        at: '2026-11-05T10:31:00',
        body: 'Studios open November bookings on Monday, so this is the one to land first.',
      },
    ],
    worked: [
      { personId: 'leo', minutes: 145 },
      { personId: 'sana', minutes: 55 },
    ],
  },
  {
    id: 'mos-152',
    number: 152,
    title: 'Offline drafts for field notes',
    type: 'story',
    status: 'in_progress',
    priority: 'high',
    labelIds: ['frontend', 'mobile'],
    assigneeIds: ['tomas', 'amara'],
    due: '2026-11-12',
    createdAt: '2026-10-29T14:02:00',
    updatedAt: '2026-11-04T17:45:00',
    reporterId: 'mei',
    description: [
      'A note written without a connection stays on the device as a draft and syncs on its own once the device is back online.',
      'Drafts show a quiet mark in the list until they are synced, and a conflict keeps both versions side by side.',
    ],
    children: [
      {
        id: 'mos-156',
        number: 156,
        title: 'Store drafts on the device',
        status: 'done',
        assigneeId: 'tomas',
      },
      {
        id: 'mos-157',
        number: 157,
        title: 'Draft mark in the notes list',
        status: 'done',
        assigneeId: 'amara',
      },
      {
        id: 'mos-158',
        number: 158,
        title: 'Sync drafts when the device is back online',
        status: 'in_progress',
        assigneeId: 'tomas',
      },
      {
        id: 'mos-159',
        number: 159,
        title: 'Conflict view with both versions',
        status: 'todo',
        assigneeId: 'amara',
      },
      {
        id: 'mos-162',
        number: 162,
        title: 'Copy for the offline banner',
        status: 'backlog',
      },
    ],
    feed: [
      {
        kind: 'change',
        id: 'f-152-1',
        authorId: 'mei',
        at: '2026-10-29T14:02:00',
        change: 'created',
        text: 'created the task',
      },
      {
        kind: 'comment',
        id: 'f-152-2',
        authorId: 'amara',
        at: '2026-11-03T10:12:00',
        body: 'The draft mark is in review. I kept it to a small dot so the list does not get louder.',
      },
      {
        kind: 'change',
        id: 'f-152-3',
        authorId: 'tomas',
        at: '2026-11-04T17:45:00',
        change: 'label',
        text: 'added the label Mobile',
      },
    ],
    worked: [
      { personId: 'tomas', minutes: 380 },
      { personId: 'amara', minutes: 150 },
    ],
  },
  {
    id: 'mos-139',
    number: 139,
    title: 'Rate limit the public share links',
    type: 'task',
    status: 'in_review',
    priority: 'high',
    labelIds: ['api'],
    assigneeIds: ['sana'],
    due: '2026-11-04',
    estimateMinutes: 240,
    createdAt: '2026-10-27T11:30:00',
    updatedAt: '2026-11-03T15:10:00',
    reporterId: 'sana',
    description: [
      'Shared notes can be opened by anyone with the link. Limit each link to a fair number of opens per minute so a leaked link cannot be scraped.',
    ],
    children: [],
    feed: [
      {
        kind: 'change',
        id: 'f-139-1',
        authorId: 'sana',
        at: '2026-10-27T11:30:00',
        change: 'created',
        text: 'created the task',
      },
      {
        kind: 'change',
        id: 'f-139-2',
        authorId: 'sana',
        at: '2026-11-03T15:10:00',
        change: 'status',
        text: 'moved it from In progress to In review',
      },
    ],
    worked: [{ personId: 'sana', minutes: 265 }],
  },
  {
    id: 'mos-163',
    number: 163,
    title: 'Map tiles flicker when zooming out',
    type: 'bug',
    status: 'todo',
    priority: 'none',
    labelIds: [],
    assigneeIds: [],
    createdAt: '2026-11-04T13:22:00',
    updatedAt: '2026-11-04T13:22:00',
    reporterId: 'tomas',
    description: [
      'Zooming out on the garden map shows grey squares for a moment before the tiles come back.',
    ],
    children: [],
    feed: [
      {
        kind: 'change',
        id: 'f-163-1',
        authorId: 'tomas',
        at: '2026-11-04T13:22:00',
        change: 'created',
        text: 'created the task',
      },
    ],
    worked: [],
  },
];
