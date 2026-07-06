import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  CalendarIcon,
  ChartBarIcon,
  FilterIcon,
  HomeIcon,
  LineChartIcon,
  RocketIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export const BRAND = { name: 'Tarnbrook' };

export const MARKETING_LEAD = {
  name: 'Mireille Kabasele',
  role: 'Marketing lead',
};

export type SectionId =
  | 'overview'
  | 'leads'
  | 'traffic'
  | 'channels'
  | 'funnel'
  | 'week'
  | 'campaigns';

export type NavItem = {
  id: SectionId;
  label: string;
  icon: Icon;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'overview', label: 'Overview', icon: HomeIcon },
      { id: 'leads', label: 'Leads', icon: UsersIcon },
      { id: 'traffic', label: 'Traffic', icon: LineChartIcon },
      { id: 'channels', label: 'Channels', icon: ChartBarIcon },
      { id: 'funnel', label: 'Funnel', icon: FilterIcon },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { id: 'week', label: 'This week', icon: CalendarIcon },
      { id: 'campaigns', label: 'Campaigns', icon: RocketIcon },
    ],
  },
];

export type PeriodId = '3m' | '6m' | '12m';

export type PeriodOption = {
  value: PeriodId;
  label: string;
  months: number;
};

export const PERIODS: PeriodOption[] = [
  { value: '3m', label: '3 months', months: 3 },
  { value: '6m', label: '6 months', months: 6 },
  { value: '12m', label: '12 months', months: 12 },
];

export function periodOf(id: PeriodId) {
  const period = PERIODS.find((candidate) => candidate.value === id);
  return period ?? PERIODS[1];
}

export type ChannelId = 'search' | 'social' | 'email';

export type Channel = {
  id: ChannelId;
  name: string;
  series: SeriesSlot;
};

export const CHANNELS: Channel[] = [
  { id: 'search', name: 'Search', series: 1 },
  { id: 'social', name: 'Social', series: 2 },
  { id: 'email', name: 'Email', series: 3 },
];

export function channelOf(id: ChannelId) {
  const channel = CHANNELS.find((candidate) => candidate.id === id);
  return channel ?? CHANNELS[0];
}

export type OriginId = 'search' | 'social' | 'email' | 'referral' | 'events';

export type Origin = {
  id: OriginId;
  name: string;
  series: SeriesSlot;
};

export const ORIGINS: Origin[] = [
  { id: 'search', name: 'Search', series: 1 },
  { id: 'social', name: 'Social', series: 2 },
  { id: 'email', name: 'Email', series: 3 },
  { id: 'referral', name: 'Referral', series: 4 },
  { id: 'events', name: 'Events', series: 5 },
];

export type GoalId = 'leads' | 'demos' | 'signups';

export type Goal = {
  id: GoalId;
  label: string;
  noun: string;
  targets: Record<PeriodId, number>;
};

export const GOALS: Goal[] = [
  {
    id: 'leads',
    label: 'Leads',
    noun: 'leads',
    targets: { '3m': 1800, '6m': 4400, '12m': 9800 },
  },
  {
    id: 'demos',
    label: 'Demo bookings',
    noun: 'demos',
    targets: { '3m': 500, '6m': 640, '12m': 1800 },
  },
  {
    id: 'signups',
    label: 'Newsletter signups',
    noun: 'signups',
    targets: { '3m': 1400, '6m': 2200, '12m': 3500 },
  },
];

export type StageId = 'leads' | 'qualified' | 'opportunities' | 'customers';

export type Stage = {
  id: StageId;
  label: string;
};

export const STAGES: Stage[] = [
  { id: 'leads', label: 'Leads' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'customers', label: 'Customers' },
];

export type CampaignStatus = 'live' | 'paused';

export type Campaign = {
  id: string;
  name: string;
  channel: ChannelId;
  status: CampaignStatus;
  /** How many of the last twenty-four months the campaign has been running. */
  ageMonths: number;
  monthlySpend: number;
  monthlyClicks: number;
  monthlyLeads: number;
  /** The days of the current week it runs on, Monday first. A campaign not running this week has none. */
  weekFrom?: number;
  weekTo?: number;
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'brand-keywords',
    name: 'Brand keywords',
    channel: 'search',
    status: 'live',
    ageMonths: 24,
    monthlySpend: 3200,
    monthlyClicks: 5200,
    monthlyLeads: 118,
    weekFrom: 0,
    weekTo: 6,
  },
  {
    id: 'competitor-terms',
    name: 'Competitor terms',
    channel: 'search',
    status: 'live',
    ageMonths: 20,
    monthlySpend: 2400,
    monthlyClicks: 2900,
    monthlyLeads: 54,
  },
  {
    id: 'local-intent',
    name: 'Local intent, Kinshasa',
    channel: 'search',
    status: 'live',
    ageMonths: 4,
    monthlySpend: 1500,
    monthlyClicks: 2400,
    monthlyLeads: 71,
  },
  {
    id: 'creator-takeover',
    name: 'Creator takeover',
    channel: 'social',
    status: 'live',
    ageMonths: 10,
    monthlySpend: 2800,
    monthlyClicks: 3600,
    monthlyLeads: 62,
    weekFrom: 2,
    weekTo: 4,
  },
  {
    id: 'retargeting-stories',
    name: 'Retargeting stories',
    channel: 'social',
    status: 'paused',
    ageMonths: 19,
    monthlySpend: 1800,
    monthlyClicks: 2500,
    monthlyLeads: 41,
  },
  {
    id: 'community-ads',
    name: 'Community ads, Goma',
    channel: 'social',
    status: 'live',
    ageMonths: 2,
    monthlySpend: 1200,
    monthlyClicks: 1900,
    monthlyLeads: 38,
    weekFrom: 4,
    weekTo: 6,
  },
  {
    id: 'weekly-digest',
    name: 'Weekly digest',
    channel: 'email',
    status: 'live',
    ageMonths: 24,
    monthlySpend: 600,
    monthlyClicks: 2800,
    monthlyLeads: 49,
    weekFrom: 3,
    weekTo: 3,
  },
  {
    id: 'winback-series',
    name: 'Winback series',
    channel: 'email',
    status: 'live',
    ageMonths: 6,
    monthlySpend: 450,
    monthlyClicks: 1100,
    monthlyLeads: 33,
    weekFrom: 0,
    weekTo: 2,
  },
  {
    id: 'onboarding-drip',
    name: 'Onboarding drip',
    channel: 'email',
    status: 'live',
    ageMonths: 21,
    monthlySpend: 380,
    monthlyClicks: 900,
    monthlyLeads: 27,
  },
];

export function campaignOf(id: string) {
  const campaign = CAMPAIGNS.find((candidate) => candidate.id === id);
  return campaign ?? CAMPAIGNS[0];
}

export type WeekDay = {
  index: number;
  weekday: string;
  dayOfMonth: number;
};

/** The week the strip shows starts on a fixed Monday, so the server and the browser draw the same dates. */
export const WEEK_START = '2026-11-09';

export const TODAY_INDEX = 4;

const WEEKDAY = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

const DAY_MS = 86_400_000;

function weekDayOf(index: number): WeekDay {
  const start = Date.parse(`${WEEK_START}T00:00:00Z`);
  const date = new Date(start + index * DAY_MS);
  return {
    index,
    weekday: WEEKDAY.format(date),
    dayOfMonth: date.getUTCDate(),
  };
}

export const WEEK: WeekDay[] = Array.from({ length: 7 }, (_, index) =>
  weekDayOf(index)
);

export const WEEK_RANGE = 'Nov 9 to 15';

export const DEMO_CAMPAIGN = 'creator-takeover';
