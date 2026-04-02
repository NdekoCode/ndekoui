import {
  CalendarIcon,
  ChartLineIcon,
  type Icon,
  LayoutGridIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';

export type FeatureId = 'boards' | 'timeline' | 'automations' | 'reports';

export type Feature = {
  id: FeatureId;
  icon: Icon;
  title: string;
  description: string;
};

export const SECTION = {
  title: 'Board, timeline, rules and report on the same cards',
  description:
    'Every view reads the same cards, so a date moved on the timeline is already moved on the board.',
};

export const FEATURES: Feature[] = [
  {
    id: 'boards',
    icon: LayoutGridIcon,
    title: 'Boards',
    description: 'Lanes for each stage, with owners and labels on every card',
  },
  {
    id: 'timeline',
    icon: CalendarIcon,
    title: 'Timeline',
    description: 'The same cards laid out on the week, so overlaps show early',
  },
  {
    id: 'automations',
    icon: ZapIcon,
    title: 'Automations',
    description: 'Rules that post, assign or move cards when something changes',
  },
  {
    id: 'reports',
    icon: ChartLineIcon,
    title: 'Reports',
    description: 'Where the hours of the week went, day by day',
  },
];

export const DEFAULT_FEATURE_ID: FeatureId = 'boards';

export type MiniCard = {
  title: string;
  label: string;
};

export type MiniLane = {
  title: string;
  cards: MiniCard[];
};

export const MINI_LANES: MiniLane[] = [
  {
    title: 'To do',
    cards: [
      { title: 'Pricing page copy', label: 'Copy' },
      { title: 'Launch photos', label: 'Design' },
    ],
  },
  {
    title: 'In progress',
    cards: [{ title: 'Onboarding checklist', label: 'Product' }],
  },
  {
    title: 'Done',
    cards: [
      { title: 'Beta feedback notes', label: 'Research' },
      { title: 'Press kit', label: 'Design' },
    ],
  },
];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export type TimelineBar = {
  title: string;
  startDay: number;
  dayCount: number;
};

export const TIMELINE_BARS: TimelineBar[] = [
  {
    title: 'Pricing page copy',
    startDay: 1,
    dayCount: 2,
  },
  {
    title: 'Onboarding checklist',
    startDay: 2,
    dayCount: 3,
  },
  { title: 'Launch photos', startDay: 3, dayCount: 2 },
  { title: 'Launch email', startDay: 4, dayCount: 2 },
];

export const RULE = {
  name: 'Announce finished work',
  triggerField: 'Status',
  triggerValue: 'Done',
  action: 'Post in',
  channel: '#launch',
  runsThisWeek: 3,
};

export type DayHours = {
  day: string;
  hours: number;
};

export const HOURS_BY_DAY: DayHours[] = [
  { day: 'Mon', hours: 6.5 },
  { day: 'Tue', hours: 7.5 },
  { day: 'Wed', hours: 5 },
  { day: 'Thu', hours: 8 },
  { day: 'Fri', hours: 4.5 },
];
