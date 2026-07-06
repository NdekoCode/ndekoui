import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type App = {
  id: string;
  name: string;
  brand: BrandSlug;
};

export type Ring = {
  id: 'inner' | 'outer';
  apps: App[];
  startDegrees: number;
  turnSeconds: number;
  isReversed: boolean;
};

export const HERO = {
  eyebrow: 'An assistant for teams of two to twenty',
  title: 'Ask one question and get the answer from every app you use',
  description:
    'Type it the way you would say it. The assistant reads your calendar, inbox, tracker and files, then answers with a link to where it found each part.',
  boxLabel: 'Ask a question',
  sendLabel: 'Ask',
  sentHint: 'Sign up to see the answer',
  sentAnnouncement: 'Sign up to see the answer to your question',
};

export const QUESTIONS = [
  'Which invoices are still unpaid this month?',
  'What did I promise to send before Friday?',
  'Move my 3 pm with Amara to tomorrow morning',
  'Summarize the design review thread',
];

export const INNER_RING: Ring = {
  id: 'inner',
  apps: [
    { id: 'calendar', name: 'Google Calendar', brand: 'googlecalendar' },
    { id: 'gmail', name: 'Gmail', brand: 'gmail' },
    { id: 'notion', name: 'Notion', brand: 'notion' },
    { id: 'drive', name: 'Google Drive', brand: 'googledrive' },
  ],
  startDegrees: 45,
  turnSeconds: 90,
  isReversed: false,
};

export const OUTER_RING: Ring = {
  id: 'outer',
  apps: [
    { id: 'linear', name: 'Linear', brand: 'linear' },
    { id: 'github', name: 'GitHub', brand: 'github' },
    { id: 'figma', name: 'Figma', brand: 'figma' },
    { id: 'stripe', name: 'Stripe', brand: 'stripe' },
    { id: 'jira', name: 'Jira', brand: 'jira' },
  ],
  startDegrees: -36,
  turnSeconds: 140,
  isReversed: true,
};

export const APPS: App[] = [...INNER_RING.apps, ...OUTER_RING.apps];
