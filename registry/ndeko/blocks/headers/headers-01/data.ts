import {
  BookOpenIcon,
  CalendarIcon,
  ChartLineIcon,
  HistoryIcon,
  type Icon,
  LayersIcon,
  LayoutGridIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';

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
    href: '#',
    icon: LayoutGridIcon,
  },
  {
    title: 'Timelines',
    description: 'Dates and dependencies on one line',
    href: '#',
    icon: CalendarIcon,
  },
  {
    title: 'Automations',
    description: 'Rules that move cards for you',
    href: '#',
    icon: ZapIcon,
  },
  {
    title: 'Reports',
    description: 'Where the week went, team by team',
    href: '#',
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
