import {
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  EclipseIcon,
  EyeIcon,
  MinusIcon,
  MoonIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type Presence = 'tracking' | 'online' | 'away' | 'offline';

export type IssueType = 'task' | 'bug' | 'story' | 'epic';

export type StatusId =
  'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';

export type Role = 'manager' | 'member' | 'viewer';

export type MemberTask = {
  id: string;
  number: string;
  title: string;
  type: IssueType;
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

type Meta = { label: string; color: string; icon: Icon };

export const PRESENCE_META: Record<Presence, Meta> = {
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

export const ISSUE_TYPE_META: Record<IssueType, Meta> = {
  task: { label: 'Task', color: 'var(--info)', icon: CheckIcon },
  bug: { label: 'Bug', color: 'var(--destructive)', icon: CircleAlertIcon },
  story: { label: 'Story', color: 'var(--success)', icon: BookmarkIcon },
  epic: { label: 'Epic', color: 'var(--primary)', icon: ZapIcon },
};

export const STATUS_ORDER: StatusId[] = [
  'backlog',
  'todo',
  'in-progress',
  'in-review',
  'done',
];

export const STATUS_META: Record<StatusId, Meta> = {
  backlog: {
    label: 'Backlog',
    color: 'var(--muted-foreground)',
    icon: CircleDashedIcon,
  },
  todo: { label: 'Todo', color: 'var(--info)', icon: CircleIcon },
  'in-progress': {
    label: 'In progress',
    color: 'var(--warning)',
    icon: EclipseIcon,
  },
  'in-review': { label: 'In review', color: 'var(--primary)', icon: EyeIcon },
  done: { label: 'Done', color: 'var(--success)', icon: CircleCheckIcon },
};

export const ROLE_LABEL: Record<Role, string> = {
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export const TEAM_NAME = 'Product';

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    title: 'Product designer',
    role: 'manager',
    presence: 'tracking',
    isCurrentUser: true,
    task: {
      id: 'task-142',
      number: 'LAT-142',
      title: 'Redraw the onboarding checklist for small screens',
      type: 'story',
      status: 'in-progress',
    },
    estimateMinutes: 240,
    activity: [
      {
        taskId: 'task-142',
        number: 'LAT-142',
        title: 'Redraw the onboarding checklist for small screens',
        minutes: 135,
      },
      {
        taskId: 'task-138',
        number: 'LAT-138',
        title: 'Review the empty states of the reports page',
        minutes: 50,
      },
      {
        taskId: 'task-119',
        number: 'LAT-119',
        title: 'Audit the contrast of the status chips',
        minutes: 25,
      },
    ],
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    title: 'Engineering lead',
    role: 'manager',
    presence: 'tracking',
    isCurrentUser: false,
    task: {
      id: 'task-141',
      number: 'LAT-141',
      title: 'Paginate the invoices endpoint',
      type: 'task',
      status: 'in-progress',
    },
    estimateMinutes: 180,
    activity: [
      {
        taskId: 'task-141',
        number: 'LAT-141',
        title: 'Paginate the invoices endpoint',
        minutes: 95,
      },
      {
        taskId: 'task-130',
        number: 'LAT-130',
        title: 'Review the pull requests of the week',
        minutes: 70,
      },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    title: 'Frontend engineer',
    role: 'member',
    presence: 'online',
    isCurrentUser: false,
    task: {
      id: 'task-136',
      number: 'LAT-136',
      title: 'Chart the hours of the week as day bars',
      type: 'story',
      status: 'in-review',
    },
    estimateMinutes: 300,
    activity: [
      {
        taskId: 'task-136',
        number: 'LAT-136',
        title: 'Chart the hours of the week as day bars',
        minutes: 210,
      },
      {
        taskId: 'task-133',
        number: 'LAT-133',
        title: 'Fix the focus ring of the date picker',
        minutes: 40,
      },
    ],
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    title: 'Backend engineer',
    role: 'member',
    presence: 'away',
    isCurrentUser: false,
    task: {
      id: 'task-144',
      number: 'LAT-144',
      title: 'Invoices total rounds to the wrong cent',
      type: 'bug',
      status: 'todo',
    },
    estimateMinutes: 0,
    activity: [
      {
        taskId: 'task-144',
        number: 'LAT-144',
        title: 'Invoices total rounds to the wrong cent',
        minutes: 20,
      },
    ],
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    title: 'Product manager',
    role: 'member',
    presence: 'tracking',
    isCurrentUser: false,
    task: {
      id: 'task-120',
      number: 'LAT-120',
      title: 'Reports beta with two pilot customers',
      type: 'epic',
      status: 'in-progress',
    },
    estimateMinutes: 480,
    activity: [
      {
        taskId: 'task-120',
        number: 'LAT-120',
        title: 'Reports beta with two pilot customers',
        minutes: 160,
      },
    ],
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    title: 'QA engineer',
    role: 'member',
    presence: 'offline',
    isCurrentUser: false,
    task: null,
    estimateMinutes: 0,
    activity: [],
  },
  {
    id: 'zola',
    name: 'Zola Mbeki',
    title: 'Content designer',
    role: 'viewer',
    presence: 'online',
    isCurrentUser: false,
    task: null,
    estimateMinutes: 0,
    activity: [
      {
        taskId: 'task-127',
        number: 'LAT-127',
        title: 'Write the copy for the invitation e-mail',
        minutes: 45,
      },
    ],
  },
];

export const OPEN_TASKS: MemberTask[] = [
  {
    id: 'task-129',
    number: 'LAT-129',
    title: 'Test the invitation flow on a slow network',
    type: 'task',
    status: 'todo',
  },
  {
    id: 'task-146',
    number: 'LAT-146',
    title: 'Timesheet export drops the last day of the month',
    type: 'bug',
    status: 'todo',
  },
  {
    id: 'task-127',
    number: 'LAT-127',
    title: 'Write the copy for the invitation e-mail',
    type: 'task',
    status: 'backlog',
  },
];

export const INVITATIONS: Invitation[] = [
  {
    id: 'invite-noor',
    email: 'noor.haddad@lattice.example',
    role: 'member',
    sentLabel: 'Sent 2 days ago',
  },
  {
    id: 'invite-kofi',
    email: 'kofi.mensah@lattice.example',
    role: 'viewer',
    sentLabel: 'Sent this morning',
  },
];
