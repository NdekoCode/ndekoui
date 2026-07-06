import {
  BookOpenIcon,
  CalendarIcon,
  ChartLineIcon,
  CircleCheckIcon,
  CircleIcon,
  EclipseIcon,
  GithubIcon,
  HistoryIcon,
  type Icon,
  LayersIcon,
  LayoutGridIcon,
  LinkedinBrandIcon,
  TwitterXIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';

export const FEATURES_ANCHOR = 'features';

const FEATURES_HREF = `#${FEATURES_ANCHOR}`;

export type MenuLink = {
  title: string;
  description: string;
  href: string;
  icon: Icon;
};

export type PlainLink = {
  title: string;
  href: string;
};

export type LinkGroup = {
  label: string;
  links: PlainLink[];
};

export const PRODUCT_LINKS: MenuLink[] = [
  {
    title: 'Boards',
    description: 'Lanes for every stage of the work',
    href: FEATURES_HREF,
    icon: LayoutGridIcon,
  },
  {
    title: 'Timelines',
    description: 'Dates and dependencies on one line',
    href: FEATURES_HREF,
    icon: CalendarIcon,
  },
  {
    title: 'Automations',
    description: 'Rules that move cards for you',
    href: FEATURES_HREF,
    icon: ZapIcon,
  },
  {
    title: 'Reports',
    description: 'Where the week went, team by team',
    href: FEATURES_HREF,
    icon: ChartLineIcon,
  },
];

export const SOLUTION_GROUPS: LinkGroup[] = [
  {
    label: 'By team',
    links: [
      { title: 'Design', href: '#' },
      { title: 'Engineering', href: '#' },
      { title: 'Marketing', href: '#' },
      { title: 'Operations', href: '#' },
    ],
  },
  {
    label: 'By size',
    links: [
      { title: 'Small teams', href: '#' },
      { title: 'Growing companies', href: '#' },
      { title: 'Agencies', href: '#' },
    ],
  },
];

export const RESOURCE_LINKS: MenuLink[] = [
  {
    title: 'Documentation',
    description: 'Set up a workspace step by step',
    href: '#',
    icon: BookOpenIcon,
  },
  {
    title: 'Changelog',
    description: 'What shipped this month',
    href: '#',
    icon: HistoryIcon,
  },
  {
    title: 'Templates',
    description: 'Boards other teams start from',
    href: '#',
    icon: LayersIcon,
  },
];

export const FEATURED_GUIDE = {
  label: 'Guide',
  title: 'Run Monday planning on one board',
  description:
    'A walkthrough of the board, the rules and the report a small studio uses each week',
  href: '#',
};

export type Person = {
  name: string;
};

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export const DAY_NAMES: Record<WeekDay, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

export type BoardCard = {
  id: string;
  title: string;
  label: string;
  due: WeekDay;
  owner: Person;
};

export type LaneId = 'todo' | 'doing' | 'done';

export type Columns = Record<LaneId, string[]>;

export type Lane = {
  id: LaneId;
  title: string;
  color: string;
  icon: Icon;
};

const AMA: Person = { name: 'Ama Mensah' };
const JONAS: Person = { name: 'Jonas Berg' };
const LUCIA: Person = { name: 'Lucia Ferro' };
const DEV: Person = { name: 'Dev Raman' };

export const PEOPLE: Person[] = [AMA, JONAS, LUCIA, DEV];

export const LANES: Lane[] = [
  { id: 'todo', title: 'To do', color: 'var(--info)', icon: CircleIcon },
  {
    id: 'doing',
    title: 'In progress',
    color: 'var(--warning)',
    icon: EclipseIcon,
  },
  {
    id: 'done',
    title: 'Done',
    color: 'var(--success)',
    icon: CircleCheckIcon,
  },
];

const CARD_LIST: BoardCard[] = [
  {
    id: 'launch-email',
    title: 'Write the launch email',
    label: 'Copy',
    due: 'Fri',
    owner: AMA,
  },
  {
    id: 'launch-photos',
    title: 'Book launch photos',
    label: 'Design',
    due: 'Thu',
    owner: JONAS,
  },
  {
    id: 'demo-video',
    title: 'Record the demo video',
    label: 'Product',
    due: 'Fri',
    owner: DEV,
  },
  {
    id: 'help-center',
    title: 'Update the help center',
    label: 'Copy',
    due: 'Thu',
    owner: LUCIA,
  },
  {
    id: 'pricing-copy',
    title: 'Pricing page copy',
    label: 'Copy',
    due: 'Tue',
    owner: LUCIA,
  },
  {
    id: 'onboarding',
    title: 'Onboarding checklist',
    label: 'Product',
    due: 'Thu',
    owner: DEV,
  },
  {
    id: 'social-posts',
    title: 'Launch day social posts',
    label: 'Design',
    due: 'Wed',
    owner: JONAS,
  },
  {
    id: 'beta-notes',
    title: 'Beta feedback notes',
    label: 'Research',
    due: 'Mon',
    owner: AMA,
  },
  {
    id: 'press-kit',
    title: 'Press kit',
    label: 'Design',
    due: 'Mon',
    owner: JONAS,
  },
  {
    id: 'changelog',
    title: 'Write the changelog',
    label: 'Copy',
    due: 'Wed',
    owner: AMA,
  },
  {
    id: 'landing-hero',
    title: 'Launch page hero',
    label: 'Design',
    due: 'Tue',
    owner: JONAS,
  },
  {
    id: 'pricing-tiers',
    title: 'Pricing tiers',
    label: 'Product',
    due: 'Mon',
    owner: DEV,
  },
  {
    id: 'faq',
    title: 'Update the FAQ',
    label: 'Copy',
    due: 'Mon',
    owner: LUCIA,
  },
  {
    id: 'translate-email',
    title: 'Translate the launch email',
    label: 'Copy',
    due: 'Fri',
    owner: LUCIA,
  },
  {
    id: 'customer-stories',
    title: 'Collect customer stories',
    label: 'Research',
    due: 'Wed',
    owner: AMA,
  },
  {
    id: 'status-page',
    title: 'Set up the status page',
    label: 'Product',
    due: 'Thu',
    owner: DEV,
  },
  {
    id: 'brand-colors',
    title: 'Brand colors',
    label: 'Design',
    due: 'Mon',
    owner: JONAS,
  },
  {
    id: 'invite-list',
    title: 'Beta invite list',
    label: 'Research',
    due: 'Mon',
    owner: AMA,
  },
];

const CARD_ENTRIES = CARD_LIST.map((card) => [card.id, card] as const);

export const CARDS: Record<string, BoardCard> =
  Object.fromEntries(CARD_ENTRIES);

export const COLUMNS: Columns = {
  todo: [
    'launch-email',
    'launch-photos',
    'demo-video',
    'help-center',
    'changelog',
    'translate-email',
  ],
  doing: [
    'pricing-copy',
    'onboarding',
    'social-posts',
    'landing-hero',
    'customer-stories',
    'status-page',
  ],
  done: [
    'beta-notes',
    'press-kit',
    'pricing-tiers',
    'faq',
    'brand-colors',
    'invite-list',
  ],
};

export const BOARD = {
  title: 'Launch plan',
  week: 'Week 46',
};

export const HERO = {
  eyebrow: 'Boards, timelines and reports',
  title: 'Plan the week on one board, with every card, date and owner',
  description:
    'Lanes, timelines and reports read the same cards, so Monday planning fits in one meeting instead of three threads.',
  primaryAction: 'Start planning',
  secondaryAction: 'Browse templates',
};

export type ShapeId =
  | 'orbit'
  | 'peaks'
  | 'stack'
  | 'petals'
  | 'arch'
  | 'hexagon'
  | 'split'
  | 'tiles';

export type PlaceholderMark = {
  name: string;
  shape: ShapeId;
};

export const LOGO_CLOUD = {
  title: 'Teams that plan their week on Loomboard',
  note: 'Example marks with fictional names, to replace with logos you have permission to show',
};

export const MARKS: PlaceholderMark[] = [
  { name: 'Basalt & Pine', shape: 'peaks' },
  { name: 'Cinderwell', shape: 'orbit' },
  { name: 'Oxbow Studio', shape: 'arch' },
  { name: 'Marrow Lane', shape: 'stack' },
  { name: 'Quietfield', shape: 'petals' },
  { name: 'Tern Assembly', shape: 'hexagon' },
  { name: 'Halcyon Row', shape: 'split' },
  { name: 'Lindqvist Ade', shape: 'tiles' },
];

export type FeatureId = 'boards' | 'timeline' | 'automations' | 'reports';

export type Feature = {
  id: FeatureId;
  icon: Icon;
  title: string;
  description: string;
};

export const FEATURES_SECTION = {
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

export const AUTOMATION_RULE = {
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

export const CTA_BAND = {
  title: 'Bring Monday’s plan onto one board',
  description:
    'Import cards from a spreadsheet or start from a template. Your first board stays free for as long as you use it.',
  action: 'Create your first board',
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterCategory = {
  title: string;
  links: FooterLink[];
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Loomboard',
  tagline: 'Boards, timelines and reports for teams that plan every week',
  copyright: '© 2026 Loomboard Ltd',
};

export const NEWSLETTER = {
  label: 'Product updates',
  description:
    'One email a month with what shipped, each with an unsubscribe link',
};

export const CATEGORIES: FooterCategory[] = [
  {
    title: 'Product',
    links: [
      { label: 'Boards', href: FEATURES_HREF },
      { label: 'Timelines', href: FEATURES_HREF },
      { label: 'Automations', href: FEATURES_HREF },
      { label: 'Reports', href: FEATURES_HREF },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Loomboard on GitHub', href: '#', icon: GithubIcon },
  { label: 'Loomboard on X', href: '#', icon: TwitterXIcon },
  { label: 'Loomboard on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
