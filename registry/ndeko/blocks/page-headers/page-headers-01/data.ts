export type TabId = 'overview' | 'tasks' | 'files' | 'activity';

export type MilestoneState = 'done' | 'current' | 'upcoming';

export type TaskState = 'todo' | 'doing' | 'done';

export type Person = {
  name: string;
};

export type Milestone = {
  id: string;
  title: string;
  date: string;
  state: MilestoneState;
};

export type Task = {
  id: string;
  title: string;
  owner: string;
  due: string;
  state: TaskState;
};

export type ProjectFile = {
  id: string;
  name: string;
  kind: 'drawing' | 'sheet' | 'document';
  size: string;
  updatedBy: string;
  updated: string;
};

export type ActivityItem = {
  id: string;
  person: string;
  action: string;
  target: string;
  when: string;
};

export const WORKSPACE = {
  name: 'Morrow Studio',
  href: '#',
  projectsHref: '#projects',
};

export const PROJECT = {
  title: 'Harbour Street clinic fit-out',
  status: 'On track',
  lead: 'Noor Haddad',
  due: 'Due 18 Dec',
  tasksDone: 24,
  tasksTotal: 36,
  summary:
    'A ground-floor clinic in a former bank: four treatment rooms, a reception that keeps the old counter, and a step-free entrance on Harbour Street. The landlord signs off the drawings before the builder starts on 6 January.',
};

export const MEMBERS: Person[] = [
  { name: 'Noor Haddad' },
  { name: 'Tomasz Wilk' },
  { name: 'Ama Owusu' },
  { name: 'Lise Berg' },
  { name: 'Jonah Reyes' },
  { name: 'Priya Natarajan' },
];

export const TABS: { id: TabId; label: string; count?: number }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks', count: 36 },
  { id: 'files', label: 'Files', count: 8 },
  { id: 'activity', label: 'Activity' },
];

export const MILESTONES: Milestone[] = [
  {
    id: 'survey',
    title: 'Measured survey',
    date: '2 Sep',
    state: 'done',
  },
  {
    id: 'concept',
    title: 'Concept layout agreed',
    date: '27 Sep',
    state: 'done',
  },
  {
    id: 'planning',
    title: 'Change of use approved',
    date: '14 Nov',
    state: 'done',
  },
  {
    id: 'drawings',
    title: 'Construction drawings',
    date: '18 Dec',
    state: 'current',
  },
  {
    id: 'tender',
    title: 'Builder starts on site',
    date: '6 Jan',
    state: 'upcoming',
  },
];

export const TASKS: Task[] = [
  {
    id: 'ramp',
    title: 'Detail the entrance ramp at 1:12',
    owner: 'Tomasz Wilk',
    due: '9 Dec',
    state: 'doing',
  },
  {
    id: 'counter',
    title: 'Survey the old banking counter for reuse',
    owner: 'Ama Owusu',
    due: '10 Dec',
    state: 'doing',
  },
  {
    id: 'acoustic',
    title: 'Acoustic walls between treatment rooms',
    owner: 'Lise Berg',
    due: '11 Dec',
    state: 'todo',
  },
  {
    id: 'lighting',
    title: 'Lighting layout for rooms 1 to 4',
    owner: 'Jonah Reyes',
    due: '12 Dec',
    state: 'todo',
  },
  {
    id: 'finishes',
    title: 'Finishes schedule for the reception',
    owner: 'Noor Haddad',
    due: '13 Dec',
    state: 'todo',
  },
  {
    id: 'drainage',
    title: 'Confirm drainage under the new sinks',
    owner: 'Priya Natarajan',
    due: '15 Dec',
    state: 'todo',
  },
  {
    id: 'fire',
    title: 'Fire strategy sign-off',
    owner: 'Tomasz Wilk',
    due: '16 Dec',
    state: 'todo',
  },
  {
    id: 'landlord',
    title: 'Send drawings to the landlord',
    owner: 'Noor Haddad',
    due: '18 Dec',
    state: 'todo',
  },
  {
    id: 'demolition',
    title: 'Mark the walls to demolish',
    owner: 'Ama Owusu',
    due: '28 Nov',
    state: 'done',
  },
  {
    id: 'asbestos',
    title: 'Asbestos survey of the ceiling void',
    owner: 'Lise Berg',
    due: '21 Nov',
    state: 'done',
  },
];

export const FILES: ProjectFile[] = [
  {
    id: 'ground-floor',
    name: 'Ground floor plan, rev F.pdf',
    kind: 'drawing',
    size: '4.2 MB',
    updatedBy: 'Tomasz Wilk',
    updated: 'Today',
  },
  {
    id: 'sections',
    name: 'Sections A to D, rev C.pdf',
    kind: 'drawing',
    size: '3.1 MB',
    updatedBy: 'Tomasz Wilk',
    updated: 'Yesterday',
  },
  {
    id: 'door-schedule',
    name: 'Door schedule.xlsx',
    kind: 'sheet',
    size: '96 KB',
    updatedBy: 'Ama Owusu',
    updated: '3 Dec',
  },
  {
    id: 'finishes',
    name: 'Finishes schedule.xlsx',
    kind: 'sheet',
    size: '120 KB',
    updatedBy: 'Noor Haddad',
    updated: '2 Dec',
  },
  {
    id: 'brief',
    name: 'Client brief, signed.pdf',
    kind: 'document',
    size: '880 KB',
    updatedBy: 'Noor Haddad',
    updated: '12 Sep',
  },
  {
    id: 'survey',
    name: 'Measured survey.pdf',
    kind: 'drawing',
    size: '6.8 MB',
    updatedBy: 'Lise Berg',
    updated: '2 Sep',
  },
  {
    id: 'planning',
    name: 'Change of use decision.pdf',
    kind: 'document',
    size: '410 KB',
    updatedBy: 'Priya Natarajan',
    updated: '14 Nov',
  },
  {
    id: 'budget',
    name: 'Cost plan, stage 4.xlsx',
    kind: 'sheet',
    size: '64 KB',
    updatedBy: 'Jonah Reyes',
    updated: '29 Nov',
  },
];

export const ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    person: 'Tomasz Wilk',
    action: 'uploaded',
    target: 'Ground floor plan, rev F',
    when: '2 h ago',
  },
  {
    id: 'a2',
    person: 'Ama Owusu',
    action: 'started',
    target: 'Survey the old banking counter',
    when: '4 h ago',
  },
  {
    id: 'a3',
    person: 'Noor Haddad',
    action: 'moved the due date of',
    target: 'Send drawings to the landlord',
    when: 'Yesterday',
  },
  {
    id: 'a4',
    person: 'Lise Berg',
    action: 'finished',
    target: 'Asbestos survey of the ceiling void',
    when: '21 Nov',
  },
  {
    id: 'a5',
    person: 'Priya Natarajan',
    action: 'attached',
    target: 'Change of use decision',
    when: '14 Nov',
  },
  {
    id: 'a6',
    person: 'Jonah Reyes',
    action: 'updated',
    target: 'Cost plan, stage 4',
    when: '29 Nov',
  },
];
