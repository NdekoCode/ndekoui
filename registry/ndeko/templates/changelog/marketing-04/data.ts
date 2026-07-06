import {
  BookOpenIcon,
  CalendarIcon,
  ChartLineIcon,
  GithubIcon,
  HistoryIcon,
  type Icon,
  LayersIcon,
  LayoutGridIcon,
  LinkedinBrandIcon,
  TwitterXIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';

export type MenuLink = {
  title: string;
  description: string;
  href: string;
  icon: Icon;
  isCurrent?: boolean;
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
    isCurrent: true,
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

export type ChangeTag = 'new' | 'improved' | 'fixed';

export type Release = {
  version: string;
  date: string;
  title: string;
  tags: ChangeTag[];
  summary: string;
  changes: string[];
};

export const TAG_STYLES: Record<ChangeTag, { label: string; color: string }> = {
  new: { label: 'New', color: 'var(--primary)' },
  improved: { label: 'Improved', color: 'var(--info)' },
  fixed: { label: 'Fixed', color: 'var(--success)' },
};

export const CHANGELOG = {
  title: 'Changelog',
  description: 'What changed in Loomboard, newest first',
};

export const PAGE_SIZE = 3;

export const RELEASES: Release[] = [
  {
    version: '4.12',
    date: '2026-10-28',
    title: 'Dependencies on the timeline',
    tags: ['new', 'improved'],
    summary:
      'Link two cards and the second one moves when the first one slips. The timeline draws the link and warns you before a date collides.',
    changes: [
      'Drag from the edge of a bar to another bar to link them',
      'Moving a card shifts every card that depends on it',
      'The board shows a small mark on cards that wait for another',
    ],
  },
  {
    version: '4.11',
    date: '2026-10-14',
    title: 'Quieter notifications',
    tags: ['improved'],
    summary:
      'Notifications about the same card are grouped, and nothing arrives outside the working hours you set in your profile.',
    changes: [
      'One notification per card instead of one per change',
      'Working hours per person, with a catch-up summary in the morning',
    ],
  },
  {
    version: '4.10.2',
    date: '2026-10-03',
    title: 'Fixes for shared boards',
    tags: ['fixed'],
    summary:
      'Guests invited to a single board could see the names of other boards in the search. They now only see the board they were invited to.',
    changes: [
      'Search results respect board access for guests',
      'Archived lanes no longer reappear after a page refresh',
    ],
  },
  {
    version: '4.10',
    date: '2026-09-22',
    title: 'Rules that post to a channel',
    tags: ['new'],
    summary:
      'An automation can now post a message in a team channel when a card reaches a lane, with the card title and its owner.',
    changes: [
      'New action: post in a channel',
      'Pick which card fields appear in the message',
    ],
  },
  {
    version: '4.9',
    date: '2026-09-08',
    title: 'Weekly report by person',
    tags: ['new', 'improved'],
    summary:
      'The weekly report splits the hours by person as well as by board, and exports to CSV with the same columns.',
    changes: [
      'A person filter on every report',
      'CSV export keeps the grouping you see on screen',
    ],
  },
  {
    version: '4.8.1',
    date: '2026-08-25',
    title: 'Keyboard fixes',
    tags: ['fixed'],
    summary:
      'Moving a card with the keyboard skipped empty lanes. Arrow keys now stop on every lane, empty or not.',
    changes: ['Arrow keys stop on empty lanes', 'Escape closes the card panel'],
  },
  {
    version: '4.8',
    date: '2026-08-11',
    title: 'Templates for recurring work',
    tags: ['new'],
    summary:
      'Save a board as a template and start the next sprint, launch or onboarding from it with the lanes and rules already in place.',
    changes: [
      'Save any board as a template',
      'Templates keep lanes, labels and automations',
    ],
  },
  {
    version: '4.7',
    date: '2026-07-28',
    title: 'Faster boards with many cards',
    tags: ['improved'],
    summary:
      'Boards with several hundred cards open and scroll without the delay some teams reported on large launches.',
    changes: [
      'Lanes load the cards you can see first',
      'Dragging stays smooth on long lanes',
    ],
  },
];

export type FooterLink = {
  label: string;
  href: string;
  isCurrent?: boolean;
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
      { label: 'Boards', href: '#' },
      { label: 'Timelines', href: '#' },
      { label: 'Automations', href: '#' },
      { label: 'Reports', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Changelog', href: '#', isCurrent: true },
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
