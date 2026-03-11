import {
  CircleCheckIcon,
  ClockIcon,
  FolderIcon,
  InboxIcon,
  LayersIcon,
  RefreshCwIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type PageId =
  | 'inbox'
  | 'my-tasks'
  | 'projects'
  | 'members'
  | 'team-tasks'
  | 'team-cycles'
  | 'team-timesheets';

export type Entity = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type Workspace = Entity & { memberCount: number };

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
  initials: string;
  role: string;
  avatar?: string;
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
    initials: 'LS',
    color: 'var(--primary)',
    memberCount: 6,
  },
  {
    id: 'quarry',
    name: 'Quarry Works',
    initials: 'QW',
    color: 'var(--success)',
    memberCount: 21,
  },
  {
    id: 'moonridge',
    name: 'Moonridge',
    initials: 'MR',
    color: 'var(--warning)',
    memberCount: 1,
  },
];

export const PRODUCT_TEAM: Entity = {
  id: 'product',
  name: 'Product',
  initials: 'P',
  color: 'var(--info)',
};

export const CURRENT_USER_ID = 'amara';

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    role: 'Product designer',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    initials: 'LM',
    role: 'Engineering lead',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    initials: 'PR',
    role: 'Frontend engineer',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    initials: 'MS',
    role: 'Backend engineer',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    initials: 'HK',
    role: 'Product manager',
    avatar: '/avatars/avatar-07.svg',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    initials: 'JW',
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

export const EMPTY_PAGES: Partial<Record<PageId, EmptyPage>> = {
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
