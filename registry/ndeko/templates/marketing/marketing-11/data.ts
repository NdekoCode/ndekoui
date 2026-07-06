import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';

export const CONTACT_ANCHOR = 'contact';

export type SectionId =
  'studio' | 'mobile' | 'web' | 'dashboards' | 'reach' | 'systems' | 'craft';

export type StudioSection = {
  id: SectionId;
  number: string;
  name: string;
  title: string;
  description: string;
  points: string[];
  linkLabel: string;
};

export const SECTIONS: StudioSection[] = [
  {
    id: 'studio',
    number: '01',
    name: 'Studio',
    title: 'Scattered work, gathered into calm software',
    description:
      'Lisanga Studio designs and builds products for teams that work across cities and unreliable connections. A small studio in Kinshasa and Lubumbashi, with a partner desk in Lisbon.',
    points: [
      'Design and engineering in one team',
      'Short projects with a date set on day one',
      'English, French and Lingala at the table',
    ],
    linkLabel: 'How we work',
  },
  {
    id: 'mobile',
    number: '02',
    name: 'Mobile',
    title: 'Apps that keep working when the network does not',
    description:
      'We build mobile apps that save work on the phone first, sync when a signal returns, and stay light on a small data plan.',
    points: [
      'Offline first, with a sync you can see',
      'Light enough for a low-cost phone',
      'Mobile money and WhatsApp built in',
    ],
    linkLabel: 'See mobile work',
  },
  {
    id: 'web',
    number: '03',
    name: 'Web',
    title: 'Websites and web apps that load on the first try',
    description:
      'Fast pages, clear forms, and accounts that people can recover without calling anyone.',
    points: [
      'Pages that hold up on a slow connection',
      'Forms that explain their errors',
      'Accounts with a way back in',
    ],
    linkLabel: 'See web work',
  },
  {
    id: 'dashboards',
    number: '04',
    name: 'Dashboards',
    title: 'Dashboards that people actually read',
    description:
      'We turn the spreadsheet everyone dreads into one screen with the few numbers that decide the week.',
    points: [
      'One screen and a handful of numbers',
      'Every figure traced back to its source',
      'A print view for the Monday meeting',
    ],
    linkLabel: 'See dashboard work',
  },
  {
    id: 'reach',
    number: '05',
    name: 'Reach',
    title: 'Teams spread over more than one time zone',
    description:
      'We work in French, English and Lingala, and we keep a fixed overlap with the mornings of Kinshasa, Lubumbashi and Lisbon.',
    points: [
      'A daily overlap you can plan around',
      'Written updates in two languages',
      'A named person behind every decision',
    ],
    linkLabel: 'Meet the team',
  },
  {
    id: 'systems',
    number: '06',
    name: 'Systems',
    title: 'Systems that talk to each other without drama',
    description:
      'Payments, messaging and maps connected through plain interfaces, so one supplier changing does not rewrite your product.',
    points: [
      'Payments, messaging and maps',
      'Plain interfaces between the parts',
      'Logs that a person can read',
    ],
    linkLabel: 'See how we connect',
  },
  {
    id: 'craft',
    number: '07',
    name: 'Craft',
    title: 'We measure what we ship',
    description:
      'Every project ships with a short list of numbers agreed on day one: speed, errors, and the task people came to do.',
    points: [
      'Targets written before the first sketch',
      'A review after launch, already on the calendar',
      'Numbers you can check yourself',
    ],
    linkLabel: 'Read our approach',
  },
];

export const HEADER = {
  meta: 'Kinshasa, Lubumbashi and Lisbon',
  action: 'Start a project',
  actionHref: `#${CONTACT_ANCHOR}`,
};

export const HERO_ACTIONS = {
  primary: 'Start a project',
  primaryHref: `#${CONTACT_ANCHOR}`,
  secondary: 'See how we work',
  secondaryHref: '#craft',
};

export const CONTACT = {
  title: 'Tell us what is scattered',
  description:
    'Write two lines about the work that lives in too many places. We answer within two working days, with questions rather than a quote.',
  action: 'Write to the studio',
  secondaryAction: 'See recent work',
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
  name: 'Lisanga Studio',
  tagline:
    'A small product studio that gathers scattered work into calm software',
  copyright: '© 2026 Lisanga Studio SARL',
  note: 'A sample studio with fictional work, made to show the template',
};

export const NEWSLETTER = {
  label: 'Studio notes',
  description:
    'One short email each month about what we shipped, with an unsubscribe link',
};

export const CATEGORIES: FooterCategory[] = [
  {
    title: 'Studio',
    links: [
      { label: 'About', href: '#studio' },
      { label: 'Work', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: `#${CONTACT_ANCHOR}` },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Mobile apps', href: '#mobile' },
      { label: 'Web apps', href: '#web' },
      { label: 'Dashboards', href: '#dashboards' },
      { label: 'Systems', href: '#systems' },
    ],
  },
  {
    title: 'Desks',
    links: [
      { label: 'Kinshasa', href: '#' },
      { label: 'Lubumbashi', href: '#' },
      { label: 'Lisbon', href: '#' },
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
  { label: 'Lisanga Studio on GitHub', href: '#', icon: GithubIcon },
  { label: 'Lisanga Studio on X', href: '#', icon: TwitterXIcon },
  { label: 'Lisanga Studio on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
