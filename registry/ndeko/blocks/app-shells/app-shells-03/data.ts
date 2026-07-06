import {
  BellIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  ClockIcon,
  FolderIcon,
  HashIcon,
  InboxIcon,
  LayersIcon,
  RefreshCwIcon,
  MonitorIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type AppPageId =
  | 'inbox'
  | 'my-tasks'
  | 'projects'
  | 'members'
  | 'team-tasks'
  | 'team-cycles'
  | 'team-timesheets';

export type SettingsPageId =
  | 'settings-profile'
  | 'settings-preferences'
  | 'settings-notifications'
  | 'settings-team-general'
  | 'settings-team-members'
  | 'settings-statuses'
  | 'settings-labels';

export type PageId = AppPageId | SettingsPageId;

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

export type Person = {
  id: string;
  name: string;
  role: string;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  leadId: string;
};

export type Task = {
  id: string;
  number: string;
  title: string;
  projectId: string;
  assigneeId: string;
  due: string;
  isDone: boolean;
};

export type Notification = {
  id: string;
  actorId: string;
  action: string;
  subject: string;
  time: string;
  isUnread: boolean;
};

export type EmptyPage = {
  title: string;
  line: string;
};

export const WORKSPACES: Workspace[] = [
  {
    id: 'lattice',
    name: 'Lattice Studio',
    memberCount: 6,
  },
  {
    id: 'quarry',
    name: 'Quarry Works',
    memberCount: 21,
  },
  {
    id: 'moonridge',
    name: 'Moonridge',
    memberCount: 1,
  },
];

export const PRODUCT_TEAM: Entity = {
  id: 'product',
  name: 'Product',
  color: 'var(--info)',
};

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    role: 'Product designer',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    role: 'Engineering lead',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    role: 'Frontend engineer',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    role: 'Backend engineer',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    role: 'Product manager',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    role: 'QA engineer',
  },
];

export const PROJECTS: Project[] = [
  {
    id: 'onboarding',
    name: 'Onboarding',
    color: 'var(--primary)',
    leadId: 'hana',
  },
  { id: 'reports', name: 'Reports', color: 'var(--info)', leadId: 'lucas' },
  { id: 'billing', name: 'Billing', color: 'var(--warning)', leadId: 'mateo' },
  {
    id: 'design-system',
    name: 'Design system',
    color: 'var(--success)',
    leadId: 'amara',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'personal',
    items: [
      { id: 'inbox', label: 'Inbox', icon: InboxIcon },
      { id: 'my-tasks', label: 'My tasks', icon: CircleCheckIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'projects', label: 'Projects', icon: FolderIcon },
      { id: 'members', label: 'Members', icon: UsersIcon },
    ],
  },
  {
    id: 'team',
    team: PRODUCT_TEAM,
    items: [
      { id: 'team-tasks', label: 'Tasks', icon: LayersIcon },
      { id: 'team-cycles', label: 'Cycles', icon: RefreshCwIcon },
      { id: 'team-timesheets', label: 'Timesheets', icon: ClockIcon },
    ],
  },
];

export const TASKS: Task[] = [
  {
    id: 'task-142',
    number: 'LAT-142',
    title: 'Redraw the onboarding checklist for small screens',
    projectId: 'onboarding',
    assigneeId: 'amara',
    due: 'Today',
    isDone: false,
  },
  {
    id: 'task-141',
    number: 'LAT-141',
    title: 'Paginate the invoices endpoint',
    projectId: 'billing',
    assigneeId: 'mateo',
    due: 'Today',
    isDone: false,
  },
  {
    id: 'task-138',
    number: 'LAT-138',
    title: 'Review the empty states of the reports page',
    projectId: 'reports',
    assigneeId: 'amara',
    due: 'Tomorrow',
    isDone: false,
  },
  {
    id: 'task-136',
    number: 'LAT-136',
    title: 'Chart the hours of the week as day bars',
    projectId: 'reports',
    assigneeId: 'priya',
    due: 'Thursday',
    isDone: false,
  },
  {
    id: 'task-131',
    number: 'LAT-131',
    title: 'Pick the icon set for the billing settings',
    projectId: 'billing',
    assigneeId: 'amara',
    due: 'Friday',
    isDone: false,
  },
  {
    id: 'task-129',
    number: 'LAT-129',
    title: 'Test the invitation flow on a slow network',
    projectId: 'onboarding',
    assigneeId: 'jonas',
    due: 'Friday',
    isDone: false,
  },
  {
    id: 'task-127',
    number: 'LAT-127',
    title: 'Write the copy for the invitation e-mail',
    projectId: 'onboarding',
    assigneeId: 'amara',
    due: 'Next week',
    isDone: false,
  },
  {
    id: 'task-119',
    number: 'LAT-119',
    title: 'Audit the contrast of the status chips',
    projectId: 'design-system',
    assigneeId: 'amara',
    due: 'Monday',
    isDone: true,
  },
  {
    id: 'task-117',
    number: 'LAT-117',
    title: 'Plan the reports beta with two customers',
    projectId: 'reports',
    assigneeId: 'hana',
    due: 'Monday',
    isDone: true,
  },
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'note-1',
    actorId: 'lucas',
    action: 'assigned you',
    subject: 'LAT-142 Redraw the onboarding checklist',
    time: '12 min',
    isUnread: true,
  },
  {
    id: 'note-2',
    actorId: 'priya',
    action: 'commented on',
    subject: 'LAT-138 Review the empty states',
    time: '1 h',
    isUnread: true,
  },
  {
    id: 'note-3',
    actorId: 'jonas',
    action: 'moved to In review',
    subject: 'LAT-131 Pick the icon set',
    time: '3 h',
    isUnread: true,
  },
  {
    id: 'note-4',
    actorId: 'mateo',
    action: 'mentioned you in',
    subject: 'LAT-141 Paginate the invoices endpoint',
    time: 'Yesterday',
    isUnread: false,
  },
];

export const EMPTY_PAGES: Partial<Record<AppPageId, EmptyPage>> = {
  'team-cycles': {
    title: 'No cycle running',
    line: 'A cycle is a time box of one or two weeks for the team’s tasks',
  },
  'team-timesheets': {
    title: 'No time logged this week',
    line: 'Hours the team logs on tasks appear here, day by day',
  },
};

export function personOf(personId: string) {
  const person = PEOPLE.find((candidate) => candidate.id === personId);
  if (person) {
    return person;
  }
  return PEOPLE[0];
}

export function projectOf(projectId: string) {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);
  if (project) {
    return project;
  }
  return PROJECTS[0];
}

export type MemberRole = 'manager' | 'member' | 'viewer';

export type PropertyValue = {
  id: string;
  name: string;
  color: string;
  taskCount: number;
};

export type Visibility = 'public' | 'private';

export const SETTINGS_GROUPS: NavGroup[] = [
  {
    id: 'account',
    label: 'Account',
    items: [
      { id: 'settings-profile', label: 'Profile', icon: UserIcon },
      { id: 'settings-preferences', label: 'Preferences', icon: MonitorIcon },
      { id: 'settings-notifications', label: 'Notifications', icon: BellIcon },
    ],
  },
  {
    id: 'team-settings',
    team: PRODUCT_TEAM,
    items: [
      { id: 'settings-team-general', label: 'General', icon: SettingsIcon },
      { id: 'settings-team-members', label: 'Members', icon: UsersIcon },
    ],
  },
  {
    id: 'task-properties',
    label: 'Task properties',
    items: [
      { id: 'settings-statuses', label: 'Statuses', icon: CircleDashedIcon },
      { id: 'settings-labels', label: 'Labels', icon: HashIcon },
    ],
  },
];

export const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export const INITIAL_ROLES: Record<string, MemberRole> = {
  amara: 'manager',
  lucas: 'manager',
  priya: 'member',
  mateo: 'member',
  hana: 'member',
  jonas: 'viewer',
};

export const TIME_ZONES = [
  { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
];

export const WEEK_STARTS = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
];

export const STATUSES: PropertyValue[] = [
  {
    id: 'backlog',
    name: 'Backlog',
    color: 'var(--muted-foreground)',
    taskCount: 1,
  },
  { id: 'todo', name: 'Todo', color: 'var(--info)', taskCount: 2 },
  {
    id: 'in-progress',
    name: 'In progress',
    color: 'var(--warning)',
    taskCount: 3,
  },
  { id: 'in-review', name: 'In review', color: 'var(--primary)', taskCount: 1 },
  { id: 'done', name: 'Done', color: 'var(--success)', taskCount: 2 },
];

export const LABELS: PropertyValue[] = [
  { id: 'design', name: 'Design', color: 'var(--primary)', taskCount: 4 },
  { id: 'web', name: 'Web', color: 'var(--info)', taskCount: 5 },
  { id: 'mobile', name: 'Mobile', color: 'var(--success)', taskCount: 1 },
  { id: 'api', name: 'API', color: 'var(--warning)', taskCount: 2 },
  {
    id: 'research',
    name: 'Research',
    color: 'var(--muted-foreground)',
    taskCount: 1,
  },
];

export const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  line: string;
}[] = [
  {
    value: 'public',
    label: 'Public',
    line: 'Everyone in Lattice Studio can find the team and join it',
  },
  {
    value: 'private',
    label: 'Private',
    line: 'Only the 6 members and the people they invite see the team and its tasks',
  },
];
