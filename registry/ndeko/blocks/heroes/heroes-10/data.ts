export type Member = {
  id: number;
  name: string;
};

export type Status = 'idle' | 'busy' | 'done';

export const HERO = {
  eyebrow: 'Opening in small groups',
  title: 'A calmer inbox for people who work alone',
  description:
    'Your mail sorts itself into what needs a reply today and what can wait. We let people in a few at a time, in the order they joined.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  emptyError: 'Enter your email address to join the waitlist',
  shapeError: 'Check the address, it should look like name@example.com',
  note: 'One email when a seat opens, nothing else',
  doneNote: 'We will email you when a seat opens',
  doneAnnouncement: 'You are on the list. We will email you when a seat opens.',
  useAnother: 'Use another address',
  countCaption: 'on the waitlist',
  countNote: 'Illustrative count',
};

export const BUTTON_LABELS: Record<Status, string> = {
  idle: 'Join the waitlist',
  busy: 'Joining',
  done: 'You are on the list',
};

export const DEMO_EMAIL = 'amara.n@example.com';

export const INITIAL_NAMES = [
  'Noor Haddad',
  'Patrick Kabongo',
  'Lea Fontaine',
  'Joseph Kasongo',
  'Ines Moreau',
];

export const DEMO_NAMES = [
  'Tomas Rivera',
  'Chantal Mbuyi',
  'Kwame Boateng',
  'Sofia Lindqvist',
  'Daniel Okoye',
  'Mireille Tshimanga',
  'Hana Sato',
  'Rafael Duarte',
  'Grace Ilunga',
  'Mateo Bianchi',
];

export const BASE_COUNT = 2418;

/** Avatars that show, and one more tucked under the counter while it leaves. */
export const VISIBLE_COUNT = 4;

export const KEPT_COUNT = VISIBLE_COUNT + 1;
