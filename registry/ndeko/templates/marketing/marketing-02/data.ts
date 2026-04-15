import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  LockIcon,
  SendIcon,
  TwitterXIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

export const WAITLIST_ANCHOR = 'waitlist';

export const FEATURES_ANCHOR = 'features';

export const PRICING_ANCHOR = 'pricing';

export const FAQ_ANCHOR = 'faq';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'features', label: 'Features', href: `#${FEATURES_ANCHOR}` },
  { id: 'pricing', label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { id: 'changelog', label: 'Changelog', href: '#' },
  { id: 'docs', label: 'Docs', href: '#' },
];

export const CURRENT_LINK_ID: string | null = null;

export const HEADER = {
  tagline: 'Newsletters for people who write every week',
  action: 'Join the beta',
  actionHref: `#${WAITLIST_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Private beta',
  title: 'You write the issue, Fernpost sends it to every reader',
  description:
    'Drafts, schedules and subscriber lists in one quiet editor. Leave your address and we send an invite as soon as a seat opens.',
  note: 'One email when your invite is ready, nothing else until you sign in',
};

export const ISSUE = {
  author: { name: 'Ama Mensah', image: '/avatars/avatar-07.svg' },
  publication: 'Notes from the reading room',
  number: 'Issue 48',
  subject: 'Three books about rivers, and one about leaving',
  excerpt:
    'This week I read slowly on purpose. Here is what stayed with me, and the passage I copied into the margin of my notebook.',
  status: 'Scheduled',
  sendsAt: 'Tue 07:00',
};

export type MediaId = 'schedule' | 'subscribers' | 'archive';

export type FeatureRow = {
  id: MediaId;
  icon: Icon;
  title: string;
  description: string;
  linkLabel: string;
};

export const FEATURES_SECTION = {
  title: 'Everything an issue needs before it reaches a reader',
  description:
    'Write it, schedule it and send it to the list you brought with you.',
};

export const ROWS: FeatureRow[] = [
  {
    id: 'schedule',
    icon: CalendarIcon,
    title: 'Draft the issue, then pick the hour it leaves',
    description:
      'Drafts and schedules sit in one quiet editor. Choose the day and the time, and Fernpost sends the issue to every reader on your list.',
    linkLabel: 'How scheduling works',
  },
  {
    id: 'subscribers',
    icon: UsersIcon,
    title: 'Bring your subscribers when you switch',
    description:
      'Upload a CSV or connect your old account. Subscribers keep their sign-up date, and anyone who unsubscribed before stays unsubscribed.',
    linkLabel: 'Import your list',
  },
  {
    id: 'archive',
    icon: LockIcon,
    title: 'Paid issues beside a public archive',
    description:
      'On Studio, mark an issue as paid and free subscribers receive a preview with a link to subscribe. The web archive keeps paid issues behind the subscription too.',
    linkLabel: 'See paid subscriptions',
  },
];

export type QueuedIssue = {
  icon: Icon;
  number: string;
  subject: string;
  when: string;
  status: string;
  color: string;
};

export const ISSUE_QUEUE: QueuedIssue[] = [
  {
    icon: FileTextIcon,
    number: 'Issue 49',
    subject: 'A month of short stories',
    when: 'Not scheduled',
    status: 'Draft',
    color: 'var(--muted-foreground)',
  },
  {
    icon: ClockIcon,
    number: ISSUE.number,
    subject: ISSUE.subject,
    when: ISSUE.sendsAt,
    status: ISSUE.status,
    color: 'var(--info)',
  },
  {
    icon: SendIcon,
    number: 'Issue 47',
    subject: 'What the library kept',
    when: 'Tue 4 Nov',
    status: 'Sent',
    color: 'var(--success)',
  },
];

export type ImportedSubscriber = {
  name: string;
  since: string;
  status: string;
  color: string;
};

export const SUBSCRIBER_IMPORT = {
  file: 'subscribers.csv',
  notice: 'Sign-up dates kept',
};

export const SUBSCRIBERS: ImportedSubscriber[] = [
  {
    name: 'Inès Duarte',
    since: 'Since March 2024',
    status: 'Subscribed',
    color: 'var(--success)',
  },
  {
    name: 'Kofi Asante',
    since: 'Since June 2023',
    status: 'Subscribed',
    color: 'var(--success)',
  },
  {
    name: 'Mira Holm',
    since: 'Since January 2025',
    status: 'Unsubscribed',
    color: 'var(--muted-foreground)',
  },
];

export type ArchivedIssue = {
  icon: Icon;
  number: string;
  subject: string;
  access: string;
  color: string;
};

export const ARCHIVE = {
  title: 'Web archive',
  visibility: 'Public',
};

export const ARCHIVED_ISSUES: ArchivedIssue[] = [
  {
    icon: BookOpenIcon,
    number: 'Issue 47',
    subject: 'What the library kept',
    access: 'Free',
    color: 'var(--muted-foreground)',
  },
  {
    icon: LockIcon,
    number: 'Issue 46',
    subject: 'Notes on a slow winter',
    access: 'Paid',
    color: 'var(--primary)',
  },
  {
    icon: BookOpenIcon,
    number: 'Issue 45',
    subject: 'Margins, and what I write in them',
    access: 'Free',
    color: 'var(--muted-foreground)',
  },
];

export type BillingPeriod = 'monthly' | 'yearly';

export type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  action: string;
  isFeatured: boolean;
  tag?: string;
};

export const DEFAULT_PERIOD: BillingPeriod = 'monthly';

export const PRICING = {
  title: 'Two plans, both with every editor feature',
  description:
    'Start alone and move to Studio when other people write with you. Your subscribers and archive come along.',
  yearlyNote: 'Two months free',
  footnote:
    'Example prices in a placeholder currency (¤), taxes added at checkout',
};

export const PLANS: Plan[] = [
  {
    id: 'writer',
    name: 'Writer',
    description: 'For one person and one newsletter',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: [
      'One newsletter',
      'Up to 2,000 subscribers',
      'Scheduled sends',
      'Your own domain',
    ],
    action: 'Start with Writer',
    isFeatured: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For a small team with several publications',
    monthlyPrice: 30,
    yearlyPrice: 300,
    features: [
      'Everything in Writer',
      'Up to five newsletters',
      'Up to 20,000 subscribers',
      'Three editor seats',
      'Paid subscriptions',
    ],
    action: 'Start with Studio',
    isFeatured: true,
    tag: 'For teams',
  },
];

export type Question = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ = {
  title: 'Questions about Fernpost',
  description: 'What writers ask most before sending their first issue',
};

export const QUESTIONS: Question[] = [
  {
    id: 'import',
    question: 'Can I bring my subscribers from another service?',
    answer:
      'Yes. Upload a CSV or connect your old account. Subscribers keep their sign-up date, and anyone who unsubscribed before stays unsubscribed.',
  },
  {
    id: 'domain',
    question: 'Do issues go out from my own domain?',
    answer:
      'On both plans. Add two DNS records and Fernpost checks them for you. Until then, issues are sent from a shared Fernpost address.',
  },
  {
    id: 'paid',
    question: 'Can readers pay for some issues?',
    answer:
      'On Studio. Mark an issue as paid and free subscribers receive a preview with a link to subscribe.',
  },
  {
    id: 'archive',
    question: 'Is there a public archive?',
    answer:
      'Every newsletter gets a web archive you can turn off. Paid issues stay behind the subscription there too.',
  },
  {
    id: 'leave',
    question: 'What happens if I leave?',
    answer:
      'Export your subscribers and every issue as HTML at any time. Nothing is deleted until you close the account yourself.',
  },
];

export const CONTACT = {
  person: { name: 'Lucia Ferro', image: '/avatars/avatar-05.svg' },
  lead: 'Still wondering about something?',
  linkLabel: 'Write to hello@fernpost.example',
  href: 'mailto:hello@fernpost.example',
  tail: 'and a person from the team answers.',
};

export type PackageManagerId = 'npm' | 'pnpm' | 'yarn' | 'bun';

export type InstallCommand = {
  id: PackageManagerId;
  label: string;
  command: string;
};

export const INSTALL_COMMANDS: InstallCommand[] = [
  { id: 'npm', label: 'npm', command: 'npm install @fernpost/sdk' },
  { id: 'pnpm', label: 'pnpm', command: 'pnpm add @fernpost/sdk' },
  { id: 'yarn', label: 'yarn', command: 'yarn add @fernpost/sdk' },
  { id: 'bun', label: 'bun', command: 'bun add @fernpost/sdk' },
];

export const DEFAULT_MANAGER: PackageManagerId = 'npm';

export const SDK_CARD = {
  eyebrow: 'Fernpost SDK',
  title: 'Send your first issue from code',
  description:
    'Install the SDK, keep your API key on the server and publish drafts from any script, CMS or scheduled job.',
  links: [
    { label: 'Read the quickstart', href: '#' },
    { label: 'Browse the API reference', href: '#' },
  ],
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
  name: 'Fernpost',
  copyright: '© 2026 Fernpost',
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { label: 'Changelog', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Fernpost on GitHub', href: '#', icon: GithubIcon },
  { label: 'Fernpost on X', href: '#', icon: TwitterXIcon },
  { label: 'Fernpost on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
