import {
  ChartLineIcon,
  ClockIcon,
  GaugeIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type PageId = 'overview' | 'weekly-report' | 'project-health';

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

export const WORKSPACES: Workspace[] = [
  {
    id: 'tidewell',
    name: 'Tidewell Studio',
    initials: 'TS',
    color: 'var(--primary)',
    memberCount: 14,
  },
];

export const PRODUCT_TEAM: Entity = {
  id: 'product',
  name: 'Product team',
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

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'overview', label: 'Overview', icon: ChartLineIcon }],
  },
  {
    id: 'team',
    team: PRODUCT_TEAM,
    items: [
      { id: 'weekly-report', label: 'Weekly report', icon: ClockIcon },
      { id: 'project-health', label: 'Project health', icon: GaugeIcon },
    ],
  },
];

export function personOf(personId: string) {
  const person = PEOPLE.find((candidate) => candidate.id === personId);
  if (person) {
    return person;
  }
  return PEOPLE[0];
}

export type PeriodId = 'days' | 'weeks' | 'months';

export type MetricId = 'tracked' | 'closed' | 'billable' | 'review';

export type PeriodPoint = {
  axisLabel: string;
  label: string;
};

export type Period = {
  id: PeriodId;
  switchLabel: string;
  label: string;
  unitPlural: string;
  perUnit: string;
  fileSlug: string;
  points: PeriodPoint[];
};

export type MetricDefinition = {
  id: MetricId;
  label: string;
  chartTitle: string;
  csvHeading: string;
  aggregate: 'sum' | 'average';
  change: 'percent' | 'points' | 'hours-lower-is-better';
  suffix: string;
};

export type MetricSeries = {
  values: number[];
  previousTotal: number;
};

export const WORKSPACE = {
  name: WORKSPACES[0].name,
  peopleCount: WORKSPACES[0].memberCount,
};

export const PERIODS: Period[] = [
  {
    id: 'days',
    switchLabel: 'Days',
    label: 'Last 12 working days',
    unitPlural: 'working days',
    perUnit: 'per working day',
    fileSlug: 'last-12-working-days',
    points: [
      { axisLabel: '20 Oct', label: 'Tuesday 20 October' },
      { axisLabel: '21 Oct', label: 'Wednesday 21 October' },
      { axisLabel: '22 Oct', label: 'Thursday 22 October' },
      { axisLabel: '23 Oct', label: 'Friday 23 October' },
      { axisLabel: '26 Oct', label: 'Monday 26 October' },
      { axisLabel: '27 Oct', label: 'Tuesday 27 October' },
      { axisLabel: '28 Oct', label: 'Wednesday 28 October' },
      { axisLabel: '29 Oct', label: 'Thursday 29 October' },
      { axisLabel: '30 Oct', label: 'Friday 30 October' },
      { axisLabel: '2 Nov', label: 'Monday 2 November' },
      { axisLabel: '3 Nov', label: 'Tuesday 3 November' },
      { axisLabel: '4 Nov', label: 'Wednesday 4 November' },
    ],
  },
  {
    id: 'weeks',
    switchLabel: 'Weeks',
    label: 'Last 12 weeks',
    unitPlural: 'weeks',
    perUnit: 'per week',
    fileSlug: 'last-12-weeks',
    points: [
      { axisLabel: 'W33', label: 'Week 33, 10 to 16 August' },
      { axisLabel: 'W34', label: 'Week 34, 17 to 23 August' },
      { axisLabel: 'W35', label: 'Week 35, 24 to 30 August' },
      { axisLabel: 'W36', label: 'Week 36, 31 August to 6 September' },
      { axisLabel: 'W37', label: 'Week 37, 7 to 13 September' },
      { axisLabel: 'W38', label: 'Week 38, 14 to 20 September' },
      { axisLabel: 'W39', label: 'Week 39, 21 to 27 September' },
      { axisLabel: 'W40', label: 'Week 40, 28 September to 4 October' },
      { axisLabel: 'W41', label: 'Week 41, 5 to 11 October' },
      { axisLabel: 'W42', label: 'Week 42, 12 to 18 October' },
      { axisLabel: 'W43', label: 'Week 43, 19 to 25 October' },
      { axisLabel: 'W44', label: 'Week 44, 26 October to 1 November' },
    ],
  },
  {
    id: 'months',
    switchLabel: 'Months',
    label: 'Last 12 months',
    unitPlural: 'months',
    perUnit: 'per month',
    fileSlug: 'last-12-months',
    points: [
      { axisLabel: 'Nov', label: 'November 2025' },
      { axisLabel: 'Dec', label: 'December 2025' },
      { axisLabel: 'Jan', label: 'January 2026' },
      { axisLabel: 'Feb', label: 'February 2026' },
      { axisLabel: 'Mar', label: 'March 2026' },
      { axisLabel: 'Apr', label: 'April 2026' },
      { axisLabel: 'May', label: 'May 2026' },
      { axisLabel: 'Jun', label: 'June 2026' },
      { axisLabel: 'Jul', label: 'July 2026' },
      { axisLabel: 'Aug', label: 'August 2026' },
      { axisLabel: 'Sep', label: 'September 2026' },
      { axisLabel: 'Oct', label: 'October 2026' },
    ],
  },
];

export const METRICS: MetricDefinition[] = [
  {
    id: 'tracked',
    label: 'Tracked time',
    chartTitle: 'Hours tracked',
    csvHeading: 'Tracked time (hours)',
    aggregate: 'sum',
    change: 'percent',
    suffix: 'h',
  },
  {
    id: 'closed',
    label: 'Tasks closed',
    chartTitle: 'Tasks closed',
    csvHeading: 'Tasks closed',
    aggregate: 'sum',
    change: 'percent',
    suffix: '',
  },
  {
    id: 'billable',
    label: 'Billable share',
    chartTitle: 'Billable share of tracked time',
    csvHeading: 'Billable share (%)',
    aggregate: 'average',
    change: 'points',
    suffix: '%',
  },
  {
    id: 'review',
    label: 'Time in review',
    chartTitle: 'Average time in review',
    csvHeading: 'Time in review (hours)',
    aggregate: 'average',
    change: 'hours-lower-is-better',
    suffix: 'h',
  },
];

export const SERIES: Record<PeriodId, Record<MetricId, MetricSeries>> = {
  days: {
    tracked: {
      values: [78, 84, 81, 69, 88, 91, 86, 72, 80, 93, 89, 85],
      previousTotal: 948,
    },
    closed: {
      values: [14, 17, 12, 9, 19, 21, 16, 11, 15, 22, 18, 17],
      previousTotal: 176,
    },
    billable: {
      values: [66, 71, 69, 64, 72, 74, 70, 65, 68, 75, 73, 71],
      previousTotal: 67,
    },
    review: {
      values: [9, 7, 11, 14, 8, 6, 9, 12, 10, 7, 8, 9],
      previousTotal: 11,
    },
  },
  weeks: {
    tracked: {
      values: [402, 418, 436, 391, 447, 452, 438, 429, 461, 455, 470, 444],
      previousTotal: 5120,
    },
    closed: {
      values: [71, 78, 84, 66, 90, 88, 79, 83, 95, 87, 102, 91],
      previousTotal: 1046,
    },
    billable: {
      values: [63, 65, 68, 61, 70, 69, 67, 66, 71, 70, 72, 69],
      previousTotal: 66,
    },
    review: {
      values: [16, 14, 13, 18, 12, 11, 13, 12, 10, 11, 9, 10],
      previousTotal: 15,
    },
  },
  months: {
    tracked: {
      values: [
        1710, 1520, 1880, 1840, 1795, 1905, 1870, 1610, 1490, 1930, 1985, 2010,
      ],
      previousTotal: 20180,
    },
    closed: {
      values: [312, 268, 344, 351, 330, 372, 365, 290, 274, 381, 398, 412],
      previousTotal: 3720,
    },
    billable: {
      values: [61, 58, 64, 63, 62, 66, 65, 59, 57, 67, 68, 69],
      previousTotal: 61,
    },
    review: {
      values: [22, 25, 19, 18, 17, 16, 15, 19, 21, 14, 12, 11],
      previousTotal: 21,
    },
  },
};

export type WeekId = 'w43' | 'w44' | 'w45';

export type MemberId = 'amara' | 'lucas' | 'priya' | 'mateo' | 'jonas';

export type ProjectId =
  'harbor' | 'billing' | 'design' | 'support' | 'research' | 'hiring';

export type WeekDay = {
  name: string;
  short: string;
  date: number;
  month: string;
};

export type Week = {
  id: WeekId;
  number: number;
  rangeLabel: string;
  days: WeekDay[];
  /** Index of today in `days`, or null when the week is over. Days after it are ahead. */
  todayIndex: number | null;
};

export type Member = {
  id: MemberId;
  name: string;
  initials: string;
  avatar?: string;
};

export type Project = { id: ProjectId; name: string };

export type ProjectShare = { projectId: ProjectId; share: number };

export type MemberWeek = {
  /** Minutes tracked from Monday to Sunday. */
  days: number[];
  mix: ProjectShare[];
};

export const TEAM_NAME = PRODUCT_TEAM.name;

const DAY_NAMES = [
  { name: 'Monday', short: 'Mon' },
  { name: 'Tuesday', short: 'Tue' },
  { name: 'Wednesday', short: 'Wed' },
  { name: 'Thursday', short: 'Thu' },
  { name: 'Friday', short: 'Fri' },
  { name: 'Saturday', short: 'Sat' },
  { name: 'Sunday', short: 'Sun' },
];

/** The seven days of a week that stays inside one month. */
function weekDays(month: string, firstDate: number): WeekDay[] {
  return DAY_NAMES.map((day, index) => {
    const date = firstDate + index;
    return { name: day.name, short: day.short, date, month };
  });
}

export const WEEKS: Week[] = [
  {
    id: 'w43',
    number: 43,
    rangeLabel: '19 to 25 October 2026',
    days: weekDays('October', 19),
    todayIndex: null,
  },
  {
    id: 'w44',
    number: 44,
    rangeLabel: '26 October to 1 November 2026',
    days: [
      { name: 'Monday', short: 'Mon', date: 26, month: 'October' },
      { name: 'Tuesday', short: 'Tue', date: 27, month: 'October' },
      { name: 'Wednesday', short: 'Wed', date: 28, month: 'October' },
      { name: 'Thursday', short: 'Thu', date: 29, month: 'October' },
      { name: 'Friday', short: 'Fri', date: 30, month: 'October' },
      { name: 'Saturday', short: 'Sat', date: 31, month: 'October' },
      { name: 'Sunday', short: 'Sun', date: 1, month: 'November' },
    ],
    todayIndex: null,
  },
  {
    id: 'w45',
    number: 45,
    rangeLabel: '2 to 8 November 2026',
    days: weekDays('November', 2),
    todayIndex: 3,
  },
];

export const MEMBERS: Member[] = [
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
  { id: 'jonas', name: 'Jonas Weber', initials: 'JW' },
];

export const PROJECTS: Project[] = [
  { id: 'harbor', name: 'Harbor mobile app' },
  { id: 'billing', name: 'Billing revamp' },
  { id: 'design', name: 'Design system' },
  { id: 'support', name: 'Support rotation' },
  { id: 'research', name: 'Customer interviews' },
  { id: 'hiring', name: 'Hiring loop' },
];

export const MEMBER_WEEKS: Record<MemberId, Record<WeekId, MemberWeek>> = {
  amara: {
    w43: {
      days: [450, 480, 420, 510, 390, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.45 },
        { projectId: 'design', share: 0.35 },
        { projectId: 'research', share: 0.2 },
      ],
    },
    w44: {
      days: [465, 500, 480, 455, 420, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.5 },
        { projectId: 'design', share: 0.3 },
        { projectId: 'research', share: 0.2 },
      ],
    },
    w45: {
      days: [470, 455, 490, 245, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.55 },
        { projectId: 'design', share: 0.3 },
        { projectId: 'hiring', share: 0.15 },
      ],
    },
  },
  lucas: {
    w43: {
      days: [480, 465, 500, 440, 360, 60, 0],
      mix: [
        { projectId: 'billing', share: 0.4 },
        { projectId: 'harbor', share: 0.3 },
        { projectId: 'hiring', share: 0.2 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w44: {
      days: [500, 470, 485, 510, 390, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.45 },
        { projectId: 'harbor', share: 0.3 },
        { projectId: 'hiring', share: 0.15 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w45: {
      days: [485, 500, 470, 260, 0, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.5 },
        { projectId: 'harbor', share: 0.25 },
        { projectId: 'hiring', share: 0.25 },
      ],
    },
  },
  priya: {
    w43: {
      days: [420, 450, 435, 480, 405, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.6 },
        { projectId: 'design', share: 0.4 },
      ],
    },
    w44: {
      days: [440, 470, 455, 0, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.7 },
        { projectId: 'design', share: 0.3 },
      ],
    },
    w45: {
      days: [450, 465, 480, 230, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.65 },
        { projectId: 'design', share: 0.25 },
        { projectId: 'support', share: 0.1 },
      ],
    },
  },
  mateo: {
    w43: {
      days: [390, 410, 0, 455, 430, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.7 },
        { projectId: 'support', share: 0.3 },
      ],
    },
    w44: {
      days: [420, 445, 430, 460, 410, 90, 0],
      mix: [
        { projectId: 'billing', share: 0.6 },
        { projectId: 'support', share: 0.25 },
        { projectId: 'harbor', share: 0.15 },
      ],
    },
    w45: {
      days: [430, 410, 445, 215, 0, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.75 },
        { projectId: 'support', share: 0.25 },
      ],
    },
  },
  jonas: {
    w43: {
      days: [400, 420, 410, 380, 300, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.5 },
        { projectId: 'billing', share: 0.3 },
        { projectId: 'support', share: 0.2 },
      ],
    },
    w44: {
      days: [380, 410, 395, 420, 280, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.55 },
        { projectId: 'billing', share: 0.35 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w45: {
      days: [0, 0, 0, 0, 0, 0, 0],
      mix: [],
    },
  },
};

export type SprintId = 's21' | 's22' | 's23';

export type Health = 'on-track' | 'at-risk' | 'off-track';

export type LeadId = 'amara' | 'lucas' | 'priya' | 'mateo' | 'hana';

export type Lead = {
  id: LeadId;
  name: string;
  initials: string;
  avatar?: string;
};

export type WorkstreamFigures = {
  workstreamId: string;
  done: number;
  open: number;
  /** Blocked tasks are counted inside `open`. */
  blocked: number;
  health: Health;
};

export type Workstream = {
  id: string;
  name: string;
  leadId: LeadId;
};

export type Sprint = {
  id: SprintId;
  number: number;
  rangeLabel: string;
  goal: string;
  workingDays: number;
  /** Working days already behind the team. Equal to `workingDays` once the sprint is over. */
  daysElapsed: number;
  workstreams: WorkstreamFigures[];
};

export const PROJECT = {
  name: 'Harbor mobile app',
  release: 'Release 2.4',
  peopleCount: 6,
  fileSlug: 'harbor-mobile-app',
};

export const HEALTH_META: Record<Health, { label: string; color: string }> = {
  'on-track': { label: 'On track', color: 'var(--success)' },
  'at-risk': { label: 'At risk', color: 'var(--warning)' },
  'off-track': { label: 'Off track', color: 'var(--destructive)' },
};

export const LEADS: Lead[] = [
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
];

export const WORKSTREAMS: Workstream[] = [
  { id: 'offline', name: 'Offline drafts', leadId: 'priya' },
  { id: 'sync', name: 'Sync engine', leadId: 'mateo' },
  { id: 'push', name: 'Push notifications', leadId: 'lucas' },
  { id: 'a11y', name: 'Accessibility pass', leadId: 'amara' },
  { id: 'release', name: 'Release checklist', leadId: 'hana' },
];

export const SPRINTS: Sprint[] = [
  {
    id: 's21',
    number: 21,
    rangeLabel: '28 September to 9 October 2026',
    goal: 'Offline drafts open without a connection',
    workingDays: 10,
    daysElapsed: 10,
    workstreams: [
      {
        workstreamId: 'offline',
        done: 8,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'sync',
        done: 6,
        open: 1,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'push',
        done: 4,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'a11y',
        done: 4,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'release',
        done: 3,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
    ],
  },
  {
    id: 's22',
    number: 22,
    rangeLabel: '12 to 23 October 2026',
    goal: 'Drafts sync back when the phone reconnects',
    workingDays: 10,
    daysElapsed: 10,
    workstreams: [
      {
        workstreamId: 'offline',
        done: 9,
        open: 1,
        blocked: 0,
        health: 'on-track',
      },
      { workstreamId: 'sync', done: 5, open: 2, blocked: 1, health: 'at-risk' },
      {
        workstreamId: 'push',
        done: 6,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'a11y',
        done: 4,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'release',
        done: 3,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
    ],
  },
  {
    id: 's23',
    number: 23,
    rangeLabel: '26 October to 6 November 2026',
    goal: 'Offline drafts reach the beta group',
    workingDays: 10,
    daysElapsed: 8,
    workstreams: [
      {
        workstreamId: 'offline',
        done: 7,
        open: 2,
        blocked: 0,
        health: 'on-track',
      },
      {
        workstreamId: 'sync',
        done: 4,
        open: 4,
        blocked: 2,
        health: 'off-track',
      },
      {
        workstreamId: 'push',
        done: 5,
        open: 1,
        blocked: 0,
        health: 'on-track',
      },
      { workstreamId: 'a11y', done: 3, open: 2, blocked: 1, health: 'at-risk' },
      {
        workstreamId: 'release',
        done: 3,
        open: 0,
        blocked: 0,
        health: 'on-track',
      },
    ],
  },
];
