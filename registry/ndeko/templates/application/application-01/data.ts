import {
  CheckIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  Columns3Icon,
  EclipseIcon,
  EyeIcon,
  InboxIcon,
  MinusIcon,
  MoonIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type StatusId =
  'in_progress' | 'in_review' | 'todo' | 'backlog' | 'done';

export type PriorityId = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type IssueTypeId = 'task' | 'bug' | 'story' | 'epic';

export type Size = 'S' | 'M' | 'L' | 'XL';

export type Person = {
  id: string;
  name: string;
  role: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Status = {
  id: StatusId;
  name: string;
  color: string;
};

export type Priority = {
  id: PriorityId;
  name: string;
  color: string;
};

export type IssueType = {
  id: IssueTypeId;
  name: string;
  color: string;
};

export type SubTaskCount = {
  done: number;
  total: number;
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

export type Task = {
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
  size?: Size;
  trackedById?: string;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  parent?: ParentTask;
  description: string[];
  children: ChildIssue[];
  feed: FeedItem[];
  worked: WorkedTime[];
};

export type PageId = 'inbox' | 'my-tasks' | 'board' | 'team';

export type Entity = {
  id: string;
  name: string;
  color: string;
};

export type Workspace = {
  id: string;
  name: string;
  memberCount: number;
};

export type NavItem = {
  id: PageId;
  label: string;
  icon: Icon;
};

export type NavGroup = {
  id: string;
  label?: string;
  team?: Entity;
  items: NavItem[];
};

export type NotificationKind = 'mention' | 'comment' | 'assigned' | 'status';

export type InboxItem = {
  id: string;
  kind: NotificationKind;
  senderId: string;
  taskNumber: number;
  taskTitle: string;
  taskType: IssueTypeId;
  event: string;
  excerpt?: string;
  age: string;
  isUnread: boolean;
};

export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Role = 'manager' | 'member' | 'viewer';

export type MemberTask = {
  id: string;
  number: string;
  title: string;
  type: IssueTypeId;
  status: StatusId;
};

export type ActivityEntry = {
  taskId: string;
  number: string;
  title: string;
  minutes: number;
};

export type Member = {
  id: string;
  name: string;
  title: string;
  role: Role;
  presence: Presence;
  isCurrentUser: boolean;
  task: MemberTask | null;
  estimateMinutes: number;
  activity: ActivityEntry[];
};

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  sentLabel: string;
};

type GlyphMeta = { label: string; color: string; icon: Icon };

export const WORKSPACE_NAME = 'Mossline';

export const TEAM_KEY = 'MOS';

export const TEAM_NAME = 'Mossline Web';

export const TODAY = '2026-11-05';

export const CURRENT_USER_ID = 'amara';

export const WORKSPACES: Workspace[] = [
  {
    id: 'mossline',
    name: WORKSPACE_NAME,
    memberCount: 5,
  },
];

export const WEB_TEAM: Entity = {
  id: 'web',
  name: TEAM_NAME,
  color: 'var(--info)',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'personal',
    items: [
      { id: 'inbox', label: 'Inbox', icon: InboxIcon },
      { id: 'my-tasks', label: 'My tasks', icon: CircleCheckIcon },
    ],
  },
  {
    id: 'team',
    team: WEB_TEAM,
    items: [
      { id: 'board', label: 'Board', icon: Columns3Icon },
      { id: 'team', label: 'Team', icon: UsersIcon },
    ],
  },
];

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    role: 'Product designer',
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    role: 'Frontend engineer',
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    role: 'Backend engineer',
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    role: 'Mobile engineer',
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    role: 'Product manager',
  },
];

export const STATUSES: Status[] = [
  { id: 'in_progress', name: 'In progress', color: 'var(--warning)' },
  { id: 'in_review', name: 'In review', color: 'var(--primary)' },
  { id: 'todo', name: 'Todo', color: 'var(--muted-foreground)' },
  { id: 'backlog', name: 'Backlog', color: 'var(--muted-foreground)' },
  { id: 'done', name: 'Done', color: 'var(--success)' },
];

export const STATUS_ICONS: Record<StatusId, Icon> = {
  backlog: CircleDashedIcon,
  todo: CircleIcon,
  in_progress: EclipseIcon,
  in_review: EyeIcon,
  done: CircleCheckIcon,
};

export const BOARD_ORDER: StatusId[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
];

export const PRIORITIES: Priority[] = [
  { id: 'urgent', name: 'Urgent', color: 'var(--destructive)' },
  { id: 'high', name: 'High', color: 'var(--warning)' },
  { id: 'medium', name: 'Medium', color: 'var(--info)' },
  { id: 'low', name: 'Low', color: 'var(--muted-foreground)' },
  { id: 'none', name: 'No priority', color: 'var(--muted-foreground)' },
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

function createdBy(
  taskNumber: number,
  authorId: string,
  at: string
): FeedChange {
  return {
    kind: 'change',
    id: `f-${taskNumber}-0`,
    authorId,
    at,
    change: 'created',
    text: 'created the task',
  };
}

export const TASKS: Task[] = [
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
    size: 'M',
    trackedById: 'leo',
    createdAt: '2026-11-02T09:14:00',
    updatedAt: '2026-11-05T10:58:00',
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
      createdBy(148, 'mei', '2026-11-02T09:14:00'),
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
      {
        kind: 'comment',
        id: 'f-148-8',
        authorId: 'sana',
        at: '2026-11-05T10:58:00',
        body: 'Can you check the empty week on the mobile view?',
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
    estimateMinutes: 720,
    size: 'L',
    trackedById: 'tomas',
    createdAt: '2026-10-29T14:02:00',
    updatedAt: '2026-11-05T10:24:00',
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
      createdBy(152, 'mei', '2026-10-29T14:02:00'),
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
      {
        kind: 'comment',
        id: 'f-152-4',
        authorId: 'leo',
        at: '2026-11-05T10:24:00',
        body: 'Drafts now sync as soon as the tab is back online',
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
    size: 'S',
    createdAt: '2026-10-27T11:30:00',
    updatedAt: '2026-11-03T15:10:00',
    reporterId: 'sana',
    description: [
      'Shared notes can be opened by anyone with the link. Limit each link to a fair number of opens per minute so a leaked link cannot be scraped.',
    ],
    children: [],
    feed: [
      createdBy(139, 'sana', '2026-10-27T11:30:00'),
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
    id: 'mos-155',
    number: 155,
    title: 'Empty states for the plant library',
    type: 'task',
    status: 'in_review',
    priority: 'medium',
    labelIds: ['design'],
    assigneeIds: ['amara'],
    due: '2026-11-09',
    estimateMinutes: 180,
    size: 'S',
    trackedById: 'amara',
    createdAt: '2026-11-01T10:05:00',
    updatedAt: '2026-11-04T16:40:00',
    reporterId: 'mei',
    description: [
      'A library without plants, a search without results and a tag without notes each get one sentence on what is missing and the action that fills it.',
    ],
    children: [],
    feed: [
      createdBy(155, 'mei', '2026-11-01T10:05:00'),
      {
        kind: 'change',
        id: 'f-155-2',
        authorId: 'amara',
        at: '2026-11-04T16:40:00',
        change: 'status',
        text: 'moved it from In progress to In review',
      },
    ],
    worked: [{ personId: 'amara', minutes: 140 }],
  },
  {
    id: 'mos-160',
    number: 160,
    title: 'Sync photo captions across devices',
    type: 'story',
    status: 'todo',
    priority: 'medium',
    labelIds: ['api', 'mobile'],
    assigneeIds: ['sana', 'tomas'],
    due: '2026-11-18',
    estimateMinutes: 360,
    size: 'M',
    createdAt: '2026-10-30T09:40:00',
    updatedAt: '2026-11-04T18:12:00',
    reporterId: 'tomas',
    description: [
      'A caption edited on the phone shows on the web within a few seconds, and two edits made offline keep the order they were written in.',
    ],
    children: [
      {
        id: 'mos-165',
        number: 165,
        title: 'Store captions with their edit time',
        status: 'todo',
        assigneeId: 'sana',
      },
      {
        id: 'mos-167',
        number: 167,
        title: 'Merge offline edits by edit time',
        status: 'todo',
        assigneeId: 'tomas',
      },
      {
        id: 'mos-168',
        number: 168,
        title: 'Show the caption sync state on the photo',
        status: 'todo',
      },
    ],
    feed: [
      createdBy(160, 'tomas', '2026-10-30T09:40:00'),
      {
        kind: 'comment',
        id: 'f-160-2',
        authorId: 'tomas',
        at: '2026-11-04T18:12:00',
        body: 'Captions written offline keep their order now',
      },
    ],
    worked: [],
  },
  {
    id: 'mos-161',
    number: 161,
    title: 'Keyboard shortcuts sheet',
    type: 'task',
    status: 'todo',
    priority: 'low',
    labelIds: ['frontend', 'accessibility'],
    assigneeIds: ['leo', 'amara'],
    estimateMinutes: 120,
    size: 'S',
    createdAt: '2026-11-02T15:20:00',
    updatedAt: '2026-11-02T15:20:00',
    reporterId: 'leo',
    description: [
      'One sheet that lists every shortcut of the notes editor, opened with the question mark key.',
    ],
    children: [],
    feed: [createdBy(161, 'leo', '2026-11-02T15:20:00')],
    worked: [],
  },
  {
    id: 'mos-163',
    number: 163,
    title: 'Map tiles flicker when zooming out',
    type: 'bug',
    status: 'todo',
    priority: 'high',
    labelIds: ['frontend', 'performance'],
    assigneeIds: [],
    due: '2026-11-10',
    size: 'M',
    createdAt: '2026-11-04T13:22:00',
    updatedAt: '2026-11-04T13:22:00',
    reporterId: 'tomas',
    description: [
      'Zooming out on the garden map shows grey squares for a moment before the tiles come back.',
    ],
    children: [],
    feed: [createdBy(163, 'tomas', '2026-11-04T13:22:00')],
    worked: [],
  },
  {
    id: 'mos-164',
    number: 164,
    title: 'Copy for the weekly digest email',
    type: 'task',
    status: 'todo',
    priority: 'low',
    labelIds: ['design'],
    assigneeIds: ['amara'],
    due: '2026-11-20',
    estimateMinutes: 60,
    size: 'S',
    createdAt: '2026-11-03T14:30:00',
    updatedAt: '2026-11-05T08:55:00',
    reporterId: 'mei',
    description: [
      'The weekly digest lists the notes a person missed. It needs a subject line, one sentence of intro and the label of the button that opens the app.',
    ],
    children: [],
    feed: [
      createdBy(164, 'mei', '2026-11-03T14:30:00'),
      {
        kind: 'change',
        id: 'f-164-2',
        authorId: 'mei',
        at: '2026-11-05T08:55:00',
        change: 'assignee',
        text: 'assigned Amara Okafor',
      },
    ],
    worked: [],
  },
  {
    id: 'mos-166',
    number: 166,
    title: 'Search across notes and tags',
    type: 'epic',
    status: 'todo',
    priority: 'medium',
    labelIds: ['api', 'frontend', 'performance'],
    assigneeIds: ['sana', 'leo', 'mei'],
    due: '2026-12-01',
    size: 'XL',
    createdAt: '2026-10-26T10:00:00',
    updatedAt: '2026-11-04T11:15:00',
    reporterId: 'mei',
    description: [
      'One search field that finds notes by their text, their tags and the plants they mention, with results that arrive while typing.',
    ],
    children: [
      {
        id: 'mos-175',
        number: 175,
        title: 'Index note text and tags',
        status: 'done',
        assigneeId: 'sana',
      },
      {
        id: 'mos-176',
        number: 176,
        title: 'Search endpoint with paging',
        status: 'in_progress',
        assigneeId: 'sana',
      },
      {
        id: 'mos-177',
        number: 177,
        title: 'Search field with results while typing',
        status: 'todo',
        assigneeId: 'leo',
      },
      {
        id: 'mos-178',
        number: 178,
        title: 'Highlight the matched words',
        status: 'todo',
        assigneeId: 'leo',
      },
      {
        id: 'mos-179',
        number: 179,
        title: 'Empty state for a search without results',
        status: 'backlog',
      },
      {
        id: 'mos-180',
        number: 180,
        title: 'Search plants mentioned in notes',
        status: 'backlog',
        assigneeId: 'mei',
      },
    ],
    feed: [
      createdBy(166, 'mei', '2026-10-26T10:00:00'),
      {
        kind: 'change',
        id: 'f-166-2',
        authorId: 'mei',
        at: '2026-11-04T11:15:00',
        change: 'priority',
        text: 'set the priority to Medium',
      },
    ],
    worked: [
      { personId: 'sana', minutes: 90 },
      { personId: 'leo', minutes: 60 },
    ],
  },
  {
    id: 'mos-170',
    number: 170,
    title: 'Dark mode for the print view',
    type: 'task',
    status: 'backlog',
    priority: 'none',
    labelIds: ['design'],
    assigneeIds: ['amara'],
    size: 'M',
    createdAt: '2026-10-28T12:00:00',
    updatedAt: '2026-10-28T12:00:00',
    reporterId: 'amara',
    description: [
      'Printing a note from dark mode keeps a white page and black text, whatever the theme on screen.',
    ],
    children: [],
    feed: [createdBy(170, 'amara', '2026-10-28T12:00:00')],
    worked: [],
  },
  {
    id: 'mos-171',
    number: 171,
    title: 'Import notes from a CSV file',
    type: 'story',
    status: 'backlog',
    priority: 'low',
    labelIds: ['api'],
    assigneeIds: [],
    size: 'M',
    createdAt: '2026-10-29T16:45:00',
    updatedAt: '2026-10-29T16:45:00',
    reporterId: 'sana',
    description: [
      'A gardener moving from a spreadsheet picks a CSV file, matches its columns to note fields and sees the notes before they are created.',
    ],
    children: [],
    feed: [createdBy(171, 'sana', '2026-10-29T16:45:00')],
    worked: [],
  },
  {
    id: 'mos-172',
    number: 172,
    title: 'Shorter cold start on the mobile app',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    labelIds: ['mobile', 'performance'],
    assigneeIds: ['tomas'],
    estimateMinutes: 480,
    size: 'L',
    createdAt: '2026-10-30T08:20:00',
    updatedAt: '2026-10-30T08:20:00',
    reporterId: 'tomas',
    description: [
      'Load the notes list before the map and the photo cache, so the first screen appears before anything else is ready.',
    ],
    children: [],
    feed: [createdBy(172, 'tomas', '2026-10-30T08:20:00')],
    worked: [],
  },
  {
    id: 'mos-174',
    number: 174,
    title: 'Screen reader names for the map controls',
    type: 'bug',
    status: 'backlog',
    priority: 'high',
    labelIds: ['accessibility'],
    assigneeIds: ['amara'],
    estimateMinutes: 90,
    size: 'S',
    createdAt: '2026-11-03T09:10:00',
    updatedAt: '2026-11-03T09:10:00',
    reporterId: 'leo',
    description: [
      'The zoom and layer buttons of the garden map are read as “button” with no name.',
    ],
    children: [],
    feed: [createdBy(174, 'leo', '2026-11-03T09:10:00')],
    worked: [],
  },
  {
    id: 'mos-120',
    number: 120,
    title: 'Onboarding checklist',
    type: 'story',
    status: 'done',
    priority: 'medium',
    labelIds: ['design', 'frontend'],
    assigneeIds: ['amara', 'leo'],
    due: '2026-10-30',
    estimateMinutes: 600,
    size: 'L',
    createdAt: '2026-10-12T10:00:00',
    updatedAt: '2026-10-30T17:20:00',
    reporterId: 'mei',
    description: [
      'Four steps for a new gardener: add a first plant, write a first note, take a photo and invite someone.',
    ],
    children: [
      {
        id: 'mos-121',
        number: 121,
        title: 'Checklist card on the home screen',
        status: 'done',
        assigneeId: 'amara',
      },
      {
        id: 'mos-122',
        number: 122,
        title: 'Mark a step done when it happens',
        status: 'done',
        assigneeId: 'leo',
      },
      {
        id: 'mos-123',
        number: 123,
        title: 'Hide the checklist once it is complete',
        status: 'done',
        assigneeId: 'leo',
      },
      {
        id: 'mos-125',
        number: 125,
        title: 'Copy for each step',
        status: 'done',
        assigneeId: 'amara',
      },
    ],
    feed: [
      createdBy(120, 'mei', '2026-10-12T10:00:00'),
      {
        kind: 'change',
        id: 'f-120-2',
        authorId: 'leo',
        at: '2026-10-30T17:20:00',
        change: 'status',
        text: 'moved it from In review to Done',
      },
    ],
    worked: [
      { personId: 'amara', minutes: 420 },
      { personId: 'leo', minutes: 300 },
    ],
  },
  {
    id: 'mos-124',
    number: 124,
    title: 'Crash when a photo has no capture date',
    type: 'bug',
    status: 'done',
    priority: 'urgent',
    labelIds: ['mobile'],
    assigneeIds: ['tomas'],
    due: '2026-10-28',
    estimateMinutes: 120,
    size: 'S',
    createdAt: '2026-10-26T08:30:00',
    updatedAt: '2026-10-28T15:00:00',
    reporterId: 'mei',
    description: [
      'Photos saved by some messaging apps have no capture date, and the timeline crashed while sorting them.',
    ],
    children: [],
    feed: [
      createdBy(124, 'mei', '2026-10-26T08:30:00'),
      {
        kind: 'change',
        id: 'f-124-2',
        authorId: 'tomas',
        at: '2026-10-28T15:00:00',
        change: 'status',
        text: 'moved it from In review to Done',
      },
    ],
    worked: [{ personId: 'tomas', minutes: 185 }],
  },
  {
    id: 'mos-127',
    number: 127,
    title: 'Paginate the notes list',
    type: 'task',
    status: 'done',
    priority: 'medium',
    labelIds: ['api', 'performance'],
    assigneeIds: ['sana'],
    due: '2026-11-02',
    estimateMinutes: 240,
    size: 'M',
    createdAt: '2026-10-20T11:00:00',
    updatedAt: '2026-11-02T16:30:00',
    reporterId: 'sana',
    description: [
      'The notes list loads fifty notes at a time and the next fifty as the list scrolls.',
    ],
    children: [],
    feed: [
      createdBy(127, 'sana', '2026-10-20T11:00:00'),
      {
        kind: 'change',
        id: 'f-127-2',
        authorId: 'leo',
        at: '2026-11-02T16:30:00',
        change: 'status',
        text: 'moved it from In review to Done',
      },
    ],
    worked: [{ personId: 'sana', minutes: 240 }],
  },
  {
    id: 'mos-133',
    number: 133,
    title: 'Tag colours in the sidebar',
    type: 'task',
    status: 'done',
    priority: 'low',
    labelIds: ['design'],
    assigneeIds: ['amara'],
    estimateMinutes: 60,
    size: 'S',
    createdAt: '2026-10-22T09:00:00',
    updatedAt: '2026-10-27T12:10:00',
    reporterId: 'amara',
    description: [
      'Each tag in the sidebar shows the colour picked for it, so a tag reads the same in the list and on the note.',
    ],
    children: [],
    feed: [createdBy(133, 'amara', '2026-10-22T09:00:00')],
    worked: [{ personId: 'amara', minutes: 75 }],
  },
  {
    id: 'mos-141',
    number: 141,
    title: 'Share sheet on Android',
    type: 'task',
    status: 'done',
    priority: 'medium',
    labelIds: ['mobile'],
    assigneeIds: ['tomas'],
    due: '2026-11-03',
    estimateMinutes: 180,
    size: 'S',
    createdAt: '2026-10-27T13:00:00',
    updatedAt: '2026-11-03T10:45:00',
    reporterId: 'tomas',
    description: [
      'Sharing a note on Android opens the system share sheet with the note text and its first photo.',
    ],
    children: [],
    feed: [createdBy(141, 'tomas', '2026-10-27T13:00:00')],
    worked: [{ personId: 'tomas', minutes: 150 }],
  },
];

export const INBOX: InboxItem[] = [
  {
    id: 'n-1',
    kind: 'mention',
    senderId: 'sana',
    taskNumber: 148,
    taskTitle: 'Booking calendar skips the first week on Safari',
    taskType: 'bug',
    event: 'mentioned you',
    excerpt: 'Can you check the empty week on the mobile view?',
    age: '4m',
    isUnread: true,
  },
  {
    id: 'n-2',
    kind: 'comment',
    senderId: 'leo',
    taskNumber: 152,
    taskTitle: 'Offline drafts for field notes',
    taskType: 'story',
    event: 'commented',
    excerpt: 'Drafts now sync as soon as the tab is back online',
    age: '38m',
    isUnread: true,
  },
  {
    id: 'n-3',
    kind: 'assigned',
    senderId: 'mei',
    taskNumber: 164,
    taskTitle: 'Copy for the weekly digest email',
    taskType: 'task',
    event: 'assigned it to you',
    age: '2h',
    isUnread: true,
  },
  {
    id: 'n-4',
    kind: 'comment',
    senderId: 'tomas',
    taskNumber: 160,
    taskTitle: 'Sync photo captions across devices',
    taskType: 'story',
    event: 'commented',
    excerpt: 'Captions written offline keep their order now',
    age: 'Yesterday',
    isUnread: false,
  },
  {
    id: 'n-5',
    kind: 'status',
    senderId: 'sana',
    taskNumber: 139,
    taskTitle: 'Rate limit the public share links',
    taskType: 'task',
    event: 'moved it to In review',
    age: 'Tue',
    isUnread: false,
  },
  {
    id: 'n-6',
    kind: 'status',
    senderId: 'leo',
    taskNumber: 127,
    taskTitle: 'Paginate the notes list',
    taskType: 'task',
    event: 'moved it to Done',
    age: 'Mon',
    isUnread: false,
  },
];

export const PRESENCE_META: Record<Presence, GlyphMeta> = {
  tracking: {
    label: 'Tracking time',
    color: 'var(--primary)',
    icon: ClockIcon,
  },
  online: { label: 'Online', color: 'var(--success)', icon: CheckIcon },
  away: { label: 'Away', color: 'var(--warning)', icon: MoonIcon },
  offline: {
    label: 'Offline',
    color: 'var(--muted-foreground)',
    icon: MinusIcon,
  },
};

export const ROLE_LABEL: Record<Role, string> = {
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    title: 'Product designer',
    role: 'manager',
    presence: 'tracking',
    isCurrentUser: true,
    task: {
      id: 'mos-155',
      number: 'MOS-155',
      title: 'Empty states for the plant library',
      type: 'task',
      status: 'in_review',
    },
    estimateMinutes: 180,
    activity: [
      {
        taskId: 'mos-155',
        number: 'MOS-155',
        title: 'Empty states for the plant library',
        minutes: 40,
      },
      {
        taskId: 'mos-152',
        number: 'MOS-152',
        title: 'Offline drafts for field notes',
        minutes: 35,
      },
    ],
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    title: 'Frontend engineer',
    role: 'member',
    presence: 'tracking',
    isCurrentUser: false,
    task: {
      id: 'mos-148',
      number: 'MOS-148',
      title: 'Booking calendar skips the first week on Safari',
      type: 'bug',
      status: 'in_progress',
    },
    estimateMinutes: 480,
    activity: [
      {
        taskId: 'mos-148',
        number: 'MOS-148',
        title: 'Booking calendar skips the first week on Safari',
        minutes: 95,
      },
      {
        taskId: 'mos-166',
        number: 'MOS-166',
        title: 'Search across notes and tags',
        minutes: 20,
      },
    ],
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    title: 'Backend engineer',
    role: 'member',
    presence: 'online',
    isCurrentUser: false,
    task: {
      id: 'mos-139',
      number: 'MOS-139',
      title: 'Rate limit the public share links',
      type: 'task',
      status: 'in_review',
    },
    estimateMinutes: 240,
    activity: [
      {
        taskId: 'mos-139',
        number: 'MOS-139',
        title: 'Rate limit the public share links',
        minutes: 25,
      },
      {
        taskId: 'mos-166',
        number: 'MOS-166',
        title: 'Search across notes and tags',
        minutes: 50,
      },
    ],
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    title: 'Mobile engineer',
    role: 'member',
    presence: 'tracking',
    isCurrentUser: false,
    task: {
      id: 'mos-152',
      number: 'MOS-152',
      title: 'Offline drafts for field notes',
      type: 'story',
      status: 'in_progress',
    },
    estimateMinutes: 720,
    activity: [
      {
        taskId: 'mos-152',
        number: 'MOS-152',
        title: 'Offline drafts for field notes',
        minutes: 110,
      },
    ],
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    title: 'Product manager',
    role: 'manager',
    presence: 'away',
    isCurrentUser: false,
    task: {
      id: 'mos-166',
      number: 'MOS-166',
      title: 'Search across notes and tags',
      type: 'epic',
      status: 'todo',
    },
    estimateMinutes: 0,
    activity: [
      {
        taskId: 'mos-166',
        number: 'MOS-166',
        title: 'Search across notes and tags',
        minutes: 30,
      },
    ],
  },
];

export const OPEN_TASKS: MemberTask[] = [
  {
    id: 'mos-161',
    number: 'MOS-161',
    title: 'Keyboard shortcuts sheet',
    type: 'task',
    status: 'todo',
  },
  {
    id: 'mos-163',
    number: 'MOS-163',
    title: 'Map tiles flicker when zooming out',
    type: 'bug',
    status: 'todo',
  },
  {
    id: 'mos-174',
    number: 'MOS-174',
    title: 'Screen reader names for the map controls',
    type: 'bug',
    status: 'backlog',
  },
];

export const INVITATIONS: Invitation[] = [
  {
    id: 'invite-noor',
    email: 'noor.haddad@mossline.example',
    role: 'member',
    sentLabel: 'Sent 2 days ago',
  },
  {
    id: 'invite-kofi',
    email: 'kofi.mensah@mossline.example',
    role: 'viewer',
    sentLabel: 'Sent this morning',
  },
];
