import {
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  EclipseIcon,
  EyeIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type LaneId = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';

export type IssueType = 'task' | 'bug' | 'story' | 'epic';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Size = 'S' | 'M' | 'L' | 'XL';

export type LabelId = 'design' | 'web' | 'mobile' | 'api' | 'research';

export type Person = {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
};

export type Task = {
  id: string;
  number: string;
  title: string;
  type: IssueType;
  priority: Priority;
  size: Size | null;
  labels: LabelId[];
  assigneeIds: string[];
  estimateMinutes: number;
  workedMinutes: number;
  isTracked: boolean;
};

export type Columns = Record<LaneId, string[]>;

type Meta = { label: string; color: string };

type GlyphMeta = Meta & { icon: Icon };

export const LANES: (GlyphMeta & { id: LaneId })[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    color: 'var(--muted-foreground)',
    icon: CircleDashedIcon,
  },
  { id: 'todo', label: 'Todo', color: 'var(--info)', icon: CircleIcon },
  {
    id: 'in-progress',
    label: 'In progress',
    color: 'var(--warning)',
    icon: EclipseIcon,
  },
  {
    id: 'in-review',
    label: 'In review',
    color: 'var(--primary)',
    icon: EyeIcon,
  },
  { id: 'done', label: 'Done', color: 'var(--success)', icon: CircleCheckIcon },
];

export const ISSUE_TYPES: Record<IssueType, GlyphMeta> = {
  task: { label: 'Task', color: 'var(--info)', icon: CheckIcon },
  bug: { label: 'Bug', color: 'var(--destructive)', icon: CircleAlertIcon },
  story: { label: 'Story', color: 'var(--success)', icon: BookmarkIcon },
  epic: { label: 'Epic', color: 'var(--primary)', icon: ZapIcon },
};

export const PRIORITIES: Record<Priority, Meta> = {
  urgent: { label: 'Urgent', color: 'var(--destructive)' },
  high: { label: 'High', color: 'var(--warning)' },
  medium: { label: 'Medium', color: 'var(--info)' },
  low: { label: 'Low', color: 'var(--muted-foreground)' },
};

export const LABELS: Record<LabelId, Meta> = {
  design: { label: 'Design', color: 'var(--primary)' },
  web: { label: 'Web', color: 'var(--info)' },
  mobile: { label: 'Mobile', color: 'var(--success)' },
  api: { label: 'API', color: 'var(--warning)' },
  research: { label: 'Research', color: 'var(--muted-foreground)' },
};

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    initials: 'AO',
    avatar: '/avatars/avatar-03.svg',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
    initials: 'LM',
    avatar: '/avatars/avatar-04.svg',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    initials: 'PR',
    avatar: '/avatars/avatar-05.svg',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
    initials: 'MS',
    avatar: '/avatars/avatar-06.svg',
  },
  {
    id: 'hana',
    name: 'Hana Kobayashi',
    initials: 'HK',
    avatar: '/avatars/avatar-07.svg',
  },
  { id: 'jonas', name: 'Jonas Weber', initials: 'JW' },
];

export const TEAM_NAME = 'Product';

export const TASK_PREFIX = 'LAT';

const TASK_LIST: Task[] = [
  {
    id: 'task-151',
    number: 'LAT-151',
    title: 'Let managers export a timesheet as CSV',
    type: 'story',
    priority: 'medium',
    size: 'M',
    labels: ['web', 'api'],
    assigneeIds: [],
    estimateMinutes: 0,
    workedMinutes: 0,
    isTracked: false,
  },
  {
    id: 'task-150',
    number: 'LAT-150',
    title: 'Interview three teams about weekly planning',
    type: 'task',
    priority: 'low',
    size: 'S',
    labels: ['research'],
    assigneeIds: ['hana'],
    estimateMinutes: 180,
    workedMinutes: 0,
    isTracked: false,
  },
  {
    id: 'task-149',
    number: 'LAT-149',
    title: 'Dark mode for the public report pages',
    type: 'epic',
    priority: 'low',
    size: 'XL',
    labels: ['design', 'web'],
    assigneeIds: [],
    estimateMinutes: 0,
    workedMinutes: 0,
    isTracked: false,
  },
  {
    id: 'task-146',
    number: 'LAT-146',
    title: 'Timesheet export drops the last day of the month',
    type: 'bug',
    priority: 'urgent',
    size: 'S',
    labels: ['api'],
    assigneeIds: ['mateo'],
    estimateMinutes: 120,
    workedMinutes: 25,
    isTracked: false,
  },
  {
    id: 'task-145',
    number: 'LAT-145',
    title: 'Empty state for a project without tasks',
    type: 'task',
    priority: 'medium',
    size: 'S',
    labels: ['design'],
    assigneeIds: ['amara'],
    estimateMinutes: 90,
    workedMinutes: 0,
    isTracked: false,
  },
  {
    id: 'task-129',
    number: 'LAT-129',
    title: 'Test the invitation flow on a slow network',
    type: 'task',
    priority: 'high',
    size: 'M',
    labels: ['web', 'mobile', 'research'],
    assigneeIds: ['jonas'],
    estimateMinutes: 240,
    workedMinutes: 0,
    isTracked: false,
  },
  {
    id: 'task-142',
    number: 'LAT-142',
    title: 'Redraw the onboarding checklist for small screens',
    type: 'story',
    priority: 'high',
    size: 'L',
    labels: ['design', 'mobile'],
    assigneeIds: ['amara', 'priya'],
    estimateMinutes: 480,
    workedMinutes: 305,
    isTracked: true,
  },
  {
    id: 'task-141',
    number: 'LAT-141',
    title: 'Paginate the invoices endpoint',
    type: 'task',
    priority: 'medium',
    size: 'M',
    labels: ['api'],
    assigneeIds: ['lucas'],
    estimateMinutes: 180,
    workedMinutes: 95,
    isTracked: true,
  },
  {
    id: 'task-120',
    number: 'LAT-120',
    title: 'Reports beta with two pilot customers',
    type: 'epic',
    priority: 'high',
    size: 'XL',
    labels: ['research', 'web'],
    assigneeIds: ['hana', 'lucas', 'amara'],
    estimateMinutes: 0,
    workedMinutes: 640,
    isTracked: false,
  },
  {
    id: 'task-144',
    number: 'LAT-144',
    title: 'Invoices total rounds to the wrong cent',
    type: 'bug',
    priority: 'urgent',
    size: 'S',
    labels: ['api'],
    assigneeIds: ['mateo'],
    estimateMinutes: 60,
    workedMinutes: 20,
    isTracked: false,
  },
  {
    id: 'task-136',
    number: 'LAT-136',
    title: 'Chart the hours of the week as day bars',
    type: 'story',
    priority: 'medium',
    size: 'M',
    labels: ['web', 'design'],
    assigneeIds: ['priya'],
    estimateMinutes: 300,
    workedMinutes: 290,
    isTracked: false,
  },
  {
    id: 'task-133',
    number: 'LAT-133',
    title: 'Fix the focus ring of the date picker',
    type: 'bug',
    priority: 'low',
    size: 'S',
    labels: ['web'],
    assigneeIds: ['priya'],
    estimateMinutes: 45,
    workedMinutes: 40,
    isTracked: false,
  },
  {
    id: 'task-119',
    number: 'LAT-119',
    title: 'Audit the contrast of the status chips',
    type: 'task',
    priority: 'medium',
    size: 'S',
    labels: ['design'],
    assigneeIds: ['amara'],
    estimateMinutes: 120,
    workedMinutes: 110,
    isTracked: false,
  },
  {
    id: 'task-117',
    number: 'LAT-117',
    title: 'Plan the reports beta with two customers',
    type: 'task',
    priority: 'medium',
    size: 'M',
    labels: ['research'],
    assigneeIds: ['hana'],
    estimateMinutes: 150,
    workedMinutes: 165,
    isTracked: false,
  },
  {
    id: 'task-112',
    number: 'LAT-112',
    title: 'Sign in with a magic link on mobile',
    type: 'story',
    priority: 'high',
    size: 'L',
    labels: ['mobile', 'api'],
    assigneeIds: ['mateo', 'jonas'],
    estimateMinutes: 600,
    workedMinutes: 540,
    isTracked: false,
  },
];

export const TASKS: Record<string, Task> = Object.fromEntries(
  TASK_LIST.map((task) => [task.id, task])
);

export const COLUMNS: Columns = {
  backlog: ['task-151', 'task-150', 'task-149'],
  todo: ['task-146', 'task-145', 'task-129'],
  'in-progress': ['task-142', 'task-141', 'task-120', 'task-144'],
  'in-review': ['task-136', 'task-133'],
  done: ['task-119', 'task-117', 'task-112'],
};
