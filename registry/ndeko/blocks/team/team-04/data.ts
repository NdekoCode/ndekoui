export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type Role = 'manager' | 'member' | 'viewer';

export type IssueType = 'task' | 'bug' | 'story';

export type Period = 'this' | 'last';

export type MemberTask = {
  key: string;
  title: string;
  type: IssueType;
};

export type Member = {
  id: string;
  name: string;
  title: string;
  role: Role;
  presence: Presence;
  task: MemberTask | null;
  minutes: Record<Period, number>;
};

export type ActivityKind = 'closed' | 'commented' | 'moved' | 'created';

export type Activity = {
  id: string;
  memberId: string;
  kind: ActivityKind;
  task: MemberTask;
  detail?: string;
  age: string;
};

export type TeamFigures = {
  openTasks: number;
  doneTasks: number;
  trackedMinutes: number;
};

export const WORKSPACE_NAME = 'Fernhall';

export const TEAM = {
  name: 'Atlas Redesign',
  color: 'var(--info)',
  description:
    'Redraws the booking flow and the onboarding for the spring release.',
};

export const PERIOD_LABELS: Record<Period, string> = {
  this: 'This week',
  last: 'Last week',
};

export const FIGURES: Record<Period, TeamFigures> = {
  this: { openTasks: 14, doneTasks: 23, trackedMinutes: 7720 },
  last: { openTasks: 19, doneTasks: 17, trackedMinutes: 9105 },
};

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    title: 'Product designer',
    role: 'manager',
    presence: 'tracking',
    task: {
      key: 'FRN-158',
      title: 'Onboarding checklist on small screens',
      type: 'story',
    },
    minutes: { this: 1835, last: 2220 },
  },
  {
    id: 'leo',
    name: 'Léo Martin',
    title: 'Frontend engineer',
    role: 'member',
    presence: 'online',
    task: {
      key: 'FRN-152',
      title: 'Offline drafts for field notes',
      type: 'story',
    },
    minutes: { this: 2010, last: 2385 },
  },
  {
    id: 'sana',
    name: 'Sana Iqbal',
    title: 'Backend engineer',
    role: 'member',
    presence: 'tracking',
    task: {
      key: 'FRN-148',
      title: 'Booking calendar skips a week',
      type: 'bug',
    },
    minutes: { this: 1690, last: 2140 },
  },
  {
    id: 'tomas',
    name: 'Tomás Rivera',
    title: 'QA engineer',
    role: 'member',
    presence: 'away',
    task: null,
    minutes: { this: 1240, last: 1600 },
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    title: 'Content designer',
    role: 'viewer',
    presence: 'offline',
    task: {
      key: 'FRN-164',
      title: 'Copy for the weekly digest',
      type: 'task',
    },
    minutes: { this: 945, last: 760 },
  },
];

export const ACTIVITY: Activity[] = [
  {
    id: 'a1',
    memberId: 'sana',
    kind: 'moved',
    task: {
      key: 'FRN-148',
      title: 'Booking calendar skips a week',
      type: 'bug',
    },
    detail: 'to In progress',
    age: '12m',
  },
  {
    id: 'a2',
    memberId: 'leo',
    kind: 'commented',
    task: {
      key: 'FRN-152',
      title: 'Offline drafts for field notes',
      type: 'story',
    },
    detail: 'Drafts now sync as soon as the tab is back online',
    age: '40m',
  },
  {
    id: 'a3',
    memberId: 'amara',
    kind: 'created',
    task: {
      key: 'FRN-173',
      title: 'Empty state for a team without plans',
      type: 'task',
    },
    age: '1h',
  },
  {
    id: 'a4',
    memberId: 'tomas',
    kind: 'closed',
    task: {
      key: 'FRN-127',
      title: 'Paginate the notes list',
      type: 'task',
    },
    age: '3h',
  },
  {
    id: 'a5',
    memberId: 'mei',
    kind: 'commented',
    task: {
      key: 'FRN-164',
      title: 'Copy for the weekly digest',
      type: 'task',
    },
    detail: 'First draft is in the doc, the subject line still needs a pass',
    age: 'Yesterday',
  },
  {
    id: 'a6',
    memberId: 'leo',
    kind: 'closed',
    task: {
      key: 'FRN-131',
      title: 'Retry failed photo uploads',
      type: 'bug',
    },
    age: 'Yesterday',
  },
  {
    id: 'a7',
    memberId: 'amara',
    kind: 'moved',
    task: {
      key: 'FRN-158',
      title: 'Onboarding checklist on small screens',
      type: 'story',
    },
    detail: 'to In review',
    age: 'Mon',
  },
];
