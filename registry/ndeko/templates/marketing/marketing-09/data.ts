import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';

export const CLOSING_ANCHOR = 'closing';

export const HEADER = {
  action: 'Start free',
  actionHref: `#${CLOSING_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'A short story in five chapters',
  title: 'The Monday memo used to take a morning',
  description:
    'Scroll to move the story along, or stop and let it carry on by itself. A click anywhere hands you the controls.',
  primaryAction: 'Start free',
  secondaryAction: 'Skip to the end',
};

export type ChapterId = 'memo' | 'cost' | 'swap' | 'people' | 'folder';

export type Chapter = {
  id: ChapterId;
  label: string;
  caption: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'memo',
    label: 'The memo',
    caption:
      'Every Monday began with a stack of exports and a blank memo. By the time the memo was written, the morning was gone and nobody had decided anything.',
  },
  {
    id: 'cost',
    label: 'The cost',
    caption:
      'Copying the numbers took two and a half hours each Monday. Across a year, that is sixteen working days spent moving figures from one file to another.',
  },
  {
    id: 'swap',
    label: 'The swap',
    caption:
      'Tidewell reads the exports and drafts the memo. The copying, the reformatting and the chasing go to it, and the judgment stays with the people who know the sites.',
  },
  {
    id: 'people',
    label: 'The people',
    caption:
      'With the busywork gone, each person in the weekly meeting does the part only they can do: choose, approve, explain, question and plan.',
  },
  {
    id: 'folder',
    label: 'The follow-through',
    caption:
      'Once the decisions are made, Tidewell opens a folder for the week and works through it as a live checklist, ticking each step when it sees the work done.',
  },
];

export const ILLUSTRATIVE_NOTE = 'Illustrative figures';

export type MemoLine = {
  text: string;
};

export const MEMO: { title: string; lines: MemoLine[]; status: string } = {
  title: 'Week 46 operations memo',
  lines: [
    { text: 'Open requests: 214 (+12)' },
    { text: 'Late deliveries: 9 of 61' },
    { text: 'Below minimum stock: 4 items' },
    { text: 'Busiest site: Lubumbashi' },
    { text: 'Decision: extra courier route' },
  ],
  status: 'Draft ready for review',
};

export const COST = {
  weeks: 52,
  hoursPerWeek: 2.5,
  hoursPerDay: 8,
  perWeekLabel: '2 h 30 min each Monday',
  hoursLabel: 'hours of copying in a year',
  daysLabel: 'working days',
};

export type SwapPair = {
  busywork: string;
  judgment: string;
};

export const SWAP_PAIRS: SwapPair[] = [
  { busywork: 'Copy', judgment: 'Decide' },
  { busywork: 'Paste', judgment: 'Approve' },
  { busywork: 'Reformat', judgment: 'Explain' },
  { busywork: 'Chase', judgment: 'Plan' },
  { busywork: 'Reconcile', judgment: 'Choose' },
  { busywork: 'Retype', judgment: 'Review' },
  { busywork: 'Forward', judgment: 'Ask why' },
  { busywork: 'Export', judgment: 'Coach' },
];

export const SWAP_LABELS = {
  before: 'Busywork',
  after: 'Judgment',
};

export type Role = {
  name: string;
  role: string;
  decision: string;
};

export const ROLES: Role[] = [
  {
    name: 'Amara Kasongo',
    role: 'Operations lead',
    decision: 'Chooses which sites get the extra courier',
  },
  {
    name: 'Grace Mwamba',
    role: 'Finance',
    decision: 'Approves the three exceptions over budget',
  },
  {
    name: 'Patrick Ilunga',
    role: 'Site manager, Lubumbashi',
    decision: 'Explains why Thursday ran late',
  },
  {
    name: 'Naomi Kabeya',
    role: 'Analyst',
    decision: 'Asks why stock dips every Tuesday',
  },
  {
    name: 'Samuel Mukendi',
    role: 'Courier desk',
    decision: 'Plans tomorrow’s routes with the new courier',
  },
];

export const FOLDER = {
  name: 'Week 46',
  status: 'Live',
  items: [
    'Extra courier route approved',
    'Lubumbashi stock reordered',
    'Memo sent to the four sites',
    'Next Monday scheduled',
  ],
};

export const CLOSING = {
  title: 'Start Monday at the decision',
  description:
    'Connect one export, read the first memo Tidewell drafts, and keep the parts you would have written yourself.',
  action: 'Start free',
  note: 'The figures in this story are Illustrative.',
};

export type FooterLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Tidewell',
  copyright: '© 2026 Tidewell Ltd',
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Product', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Tidewell on GitHub', href: '#', icon: GithubIcon },
  { label: 'Tidewell on X', href: '#', icon: TwitterXIcon },
  { label: 'Tidewell on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
