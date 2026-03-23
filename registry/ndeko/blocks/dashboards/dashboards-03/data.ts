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
  { id: 'hana', name: 'Hana Kobayashi', initials: 'HK' },
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
