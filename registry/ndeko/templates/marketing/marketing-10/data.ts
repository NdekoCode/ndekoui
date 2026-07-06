import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';

export const WORK_ANCHOR = 'work';

export const ABOUT_ANCHOR = 'about';

export const TALKS_ANCHOR = 'talks';

export const CONTACT_ANCHOR = 'contact';

export const PERSON = {
  name: 'Patience Mbuyi',
  handle: 'pmbuyi',
  role: 'Software developer',
  place: 'Kinshasa, DR Congo',
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'work', label: 'Work', href: `#${WORK_ANCHOR}` },
  { id: 'about', label: 'About', href: `#${ABOUT_ANCHOR}` },
  { id: 'talks', label: 'Talks', href: `#${TALKS_ANCHOR}` },
  { id: 'contact', label: 'Contact', href: `#${CONTACT_ANCHOR}` },
];

export const HERO = {
  eyebrow: 'Software developer in Kinshasa',
  title: 'I build apps for places where the network comes and goes',
  description:
    'Mobile and web engineer. Right now I make field tools for a logistics team, and before that I worked on payments and messaging. I like small teams, plain interfaces and apps that still work in a lift.',
  primaryAction: 'See my work',
  secondaryAction: 'Say hello',
};

export const BENTO = {
  title: 'A few things about how I work',
};

export type Job = {
  company: string;
  role: string;
  years: string;
  summary: string;
};

export const EXPERIENCE: Job[] = [
  {
    company: 'Kasai Logistics',
    role: 'Senior engineer',
    years: '2024 to now',
    summary: 'Offline-first field tools for drivers and warehouse teams.',
  },
  {
    company: 'Mwana Pay',
    role: 'Mobile engineer',
    years: '2021 to 2024',
    summary: 'Payments and messaging on low-cost phones.',
  },
  {
    company: 'Independent',
    role: 'Web developer',
    years: '2019 to 2021',
    summary: 'Sites and dashboards for clinics and small shops.',
  },
];

export type ReadingItem = {
  title: string;
  author: string;
  progress: number;
};

export const READING: ReadingItem[] = [
  {
    title: 'Small Systems, Large Rivers',
    author: 'Elise Moreau',
    progress: 64,
  },
  { title: 'Notes on Queues', author: 'Tendai Moyo', progress: 31 },
  { title: 'The Unhurried Merge', author: 'Adaeze Obi', progress: 88 },
];

export const PLACE = {
  city: 'Kinshasa',
  country: 'DR Congo',
  location: { lat: -4.32, lng: 15.31 },
  hours: 'Online 8:00 to 17:00, UTC+1',
  note: 'Overlaps European mornings and East African afternoons',
};

export type Step = {
  id: string;
  title: string;
  description: string;
};

export const METHOD: Step[] = [
  {
    id: 'listen',
    title: 'Listen',
    description:
      'A day with the people who will use it, on the phones they own, on the network they have.',
  },
  {
    id: 'sketch',
    title: 'Sketch',
    description:
      'Paper first, then the smallest screen that could work, shown to the same people the next morning.',
  },
  {
    id: 'build',
    title: 'Build',
    description:
      'Small releases every week, each one tested offline, with a note on what changed and why.',
  },
  {
    id: 'hand-over',
    title: 'Hand over',
    description:
      'Docs written for the next developer, a recorded walkthrough, and a call a month later to see what broke.',
  },
];

export const ABOUT = {
  title: 'About',
  paragraphs: [
    'I grew up in Kinshasa, where a phone call can drop in the middle of a sentence and an app has to cope with that. It taught me to treat the network as a guest, not as the floor.',
    'I studied computer science at the University of Kinshasa and learned most of the rest by shipping small things for clinics, shops and delivery crews. I write about what I get wrong, because that is where the useful part is.',
  ],
  facts: [
    { label: 'Languages', value: 'French, English, Lingala' },
    { label: 'Stack', value: 'TypeScript, React Native, Postgres' },
    { label: 'Open to', value: 'Part-time contracts and talks' },
  ],
};

export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  city: string;
  year: string;
  location: [latitude: number, longitude: number];
};

export const PROJECTS_SECTION = {
  title: 'Selected work',
  description:
    'Six projects, each with the place it was built for. Hover one and the globe turns to it.',
};

export const PROJECTS: Project[] = [
  {
    id: 'field-sync',
    title: 'Field Sync',
    description:
      'Uploads that resume after the signal drops, for delivery drivers.',
    tags: ['React Native', 'SQLite'],
    city: 'Kinshasa',
    year: '2026',
    location: [-4.32, 15.31],
  },
  {
    id: 'stockline',
    title: 'Stockline',
    description:
      'A stock count a warehouse can finish on one phone in one shift.',
    tags: ['TypeScript', 'Postgres'],
    city: 'Lubumbashi',
    year: '2025',
    location: [-11.66, 27.48],
  },
  {
    id: 'clinic-queue',
    title: 'Clinic Queue',
    description: 'A waiting list that texts patients when their turn is near.',
    tags: ['Next.js', 'SMS'],
    city: 'Goma',
    year: '2024',
    location: [-1.68, 29.22],
  },
  {
    id: 'route-notes',
    title: 'Route Notes',
    description: 'Voice notes from drivers, turned into a daily route report.',
    tags: ['Expo', 'Speech'],
    city: 'Nairobi',
    year: '2023',
    location: [-1.29, 36.82],
  },
  {
    id: 'plain-ledger',
    title: 'Plain Ledger',
    description: 'Bookkeeping for small shops, in French, with no jargon.',
    tags: ['React', 'Accessibility'],
    city: 'Kinshasa',
    year: '2022',
    location: [-4.33, 15.3],
  },
  {
    id: 'bridge-desk',
    title: 'Bridge Desk',
    description:
      'A shared inbox for a partner team in Lisbon and a crew in Kinshasa.',
    tags: ['Node', 'Queues'],
    city: 'Lisbon',
    year: '2021',
    location: [38.72, -9.14],
  },
];

export const TALKS_SECTION = {
  title: 'Talks',
  description: 'Where I have spoken, and what about.',
};

export type Talk = {
  date: string;
  isoDate: string;
  title: string;
  venue: string;
  city: string;
};

export const TALKS: Talk[] = [
  {
    date: '12 Oct 2026',
    isoDate: '2026-10-12',
    title: 'Offline first is a promise to the user',
    venue: 'Kinshasa Dev Day',
    city: 'Kinshasa',
  },
  {
    date: '21 Jun 2026',
    isoDate: '2026-06-21',
    title: 'Syncing without a server in the middle',
    venue: 'Lubumbashi JS Meetup',
    city: 'Lubumbashi',
  },
  {
    date: '08 Mar 2026',
    isoDate: '2026-03-08',
    title: 'Mobile money APIs, honestly',
    venue: 'East Africa API Days',
    city: 'Nairobi',
  },
  {
    date: '30 Nov 2025',
    isoDate: '2025-11-30',
    title: 'Small teams over long distances',
    venue: 'Lisbon Product Meetup',
    city: 'Lisbon',
  },
];

export const SUBSCRIBE = {
  title: 'Notes from the field',
  description:
    'A short email when I publish something new, never more than twice a month.',
};

export const NEWSLETTER = {
  label: 'Your email',
  description: 'One email at most twice a month, each with an unsubscribe link',
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const FOOTER = {
  copyright: '© 2026 Patience Mbuyi',
  note: 'A sample portfolio of a fictional developer, made to show the template',
};

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Patience Mbuyi on GitHub', href: '#', icon: GithubIcon },
  { label: 'Patience Mbuyi on X', href: '#', icon: TwitterXIcon },
  { label: 'Patience Mbuyi on LinkedIn', href: '#', icon: LinkedinBrandIcon },
];
