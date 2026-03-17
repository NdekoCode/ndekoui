export type StatusId =
  'in_progress' | 'in_review' | 'todo' | 'backlog' | 'done';

export type PriorityId = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type IssueTypeId = 'task' | 'bug' | 'story' | 'epic';

export type Person = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
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
  subTasks?: SubTaskCount;
  trackedById?: string;
};

export const TEAM_KEY = 'MOS';

export const TODAY = '2026-11-05';

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
  { id: 'in_progress', name: 'In progress', color: 'var(--warning)' },
  { id: 'in_review', name: 'In review', color: 'var(--primary)' },
  { id: 'todo', name: 'Todo', color: 'var(--muted-foreground)' },
  { id: 'backlog', name: 'Backlog', color: 'var(--muted-foreground)' },
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
    trackedById: 'leo',
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
    subTasks: { done: 2, total: 5 },
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
    subTasks: { done: 0, total: 3 },
  },
  {
    id: 'mos-161',
    number: 161,
    title: 'Keyboard shortcuts sheet',
    type: 'task',
    status: 'todo',
    priority: 'low',
    labelIds: ['frontend', 'accessibility'],
    assigneeIds: ['leo'],
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
  },
  {
    id: 'mos-164',
    number: 164,
    title: 'Copy for the weekly digest email',
    type: 'task',
    status: 'todo',
    priority: 'low',
    labelIds: ['design'],
    assigneeIds: ['mei'],
    due: '2026-11-20',
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
    subTasks: { done: 1, total: 6 },
  },
  {
    id: 'mos-170',
    number: 170,
    title: 'Dark mode for the print view',
    type: 'task',
    status: 'backlog',
    priority: 'none',
    labelIds: ['design'],
    assigneeIds: [],
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
  },
  {
    id: 'mos-174',
    number: 174,
    title: 'Screen reader names for the map controls',
    type: 'bug',
    status: 'backlog',
    priority: 'high',
    labelIds: ['accessibility'],
    assigneeIds: [],
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
    subTasks: { done: 4, total: 4 },
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
  },
];
