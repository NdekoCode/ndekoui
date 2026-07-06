import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ThemeId = 'replies' | 'handoffs' | 'setup';

export type ThemeChoice = ThemeId | 'all';

export type Theme = {
  id: ThemeId;
  label: string;
  spoken: string;
};

/** A quote is written in parts: the phrase is the one its theme lights, a brand part wears its real mark. */
export type QuotePart =
  | { kind: 'text'; text: string }
  | { kind: 'phrase'; text: string }
  | { kind: 'brand'; brand: BrandSlug; text: string };

export type Person = {
  name: string;
  role: string;
  company: string;
};

export type Quote = {
  id: string;
  theme: ThemeId;
  parts: QuotePart[];
  person: Person;
};

export const SECTION = {
  label: 'Customer quotes',
  title: 'What support teams say after a month on Tidewell',
  lead: 'Leads and agents on replies that arrive drafted, on fewer handoffs and on a setup that took an afternoon.',
};

export const THEMES: Theme[] = [
  { id: 'replies', label: 'Faster replies', spoken: 'faster replies' },
  { id: 'handoffs', label: 'Fewer handoffs', spoken: 'fewer handoffs' },
  { id: 'setup', label: 'Quick setup', spoken: 'a quick setup' },
];

/** Invented people and companies. The quotes are samples written for this block. */
export const QUOTES: Quote[] = [
  {
    id: 'mara',
    theme: 'replies',
    parts: [
      {
        kind: 'text',
        text: 'By the time I open a ticket the reply is already written, with the order pulled from ',
      },
      { kind: 'brand', brand: 'shopify', text: 'Shopify' },
      {
        kind: 'text',
        text: '. Most mornings I read it, change a line and send. ',
      },
      {
        kind: 'phrase',
        text: 'Our first reply went from hours to minutes',
      },
      { kind: 'text', text: ' without anyone working faster.' },
    ],
    person: {
      name: 'Mara Lindqvist',
      role: 'Head of Support',
      company: 'Northfold Outdoor',
    },
  },
  {
    id: 'tomas',
    theme: 'handoffs',
    parts: [
      {
        kind: 'text',
        text: 'Refunds used to bounce between three of us. Now the draft already holds the charge from ',
      },
      { kind: 'brand', brand: 'stripe', text: 'Stripe' },
      { kind: 'text', text: ' and the policy line, so ' },
      { kind: 'phrase', text: 'one person closes it' },
      { kind: 'text', text: ' from start to finish.' },
    ],
    person: {
      name: 'Tomás Ferreira',
      role: 'Support engineer',
      company: 'Parcelwise',
    },
  },
  {
    id: 'aiko',
    theme: 'setup',
    parts: [
      {
        kind: 'phrase',
        text: 'We were answering with it the same afternoon.',
      },
      { kind: 'text', text: ' It read our help pages in ' },
      { kind: 'brand', brand: 'notion', text: 'Notion' },
      {
        kind: 'text',
        text: ' and asked about the two policies it could not find.',
      },
    ],
    person: {
      name: 'Aiko Tanabe',
      role: 'Operations lead',
      company: 'Kettle & Crumb',
    },
  },
  {
    id: 'daniel',
    theme: 'replies',
    parts: [
      { kind: 'text', text: 'Patients write to us at night. ' },
      { kind: 'phrase', text: 'The drafts are waiting when we come in' },
      { kind: 'text', text: ', sorted by what is urgent.' },
    ],
    person: {
      name: 'Daniel Osei',
      role: 'Support lead',
      company: 'Lumen Dental Group',
    },
  },
  {
    id: 'priya',
    theme: 'handoffs',
    parts: [
      {
        kind: 'text',
        text: 'Warranty claims come in tagged, with the photos attached and the frame number read off them, so ',
      },
      { kind: 'phrase', text: 'nothing waits a day in the wrong queue' },
      { kind: 'text', text: ' any more.' },
    ],
    person: {
      name: 'Priya Raman',
      role: 'Customer care manager',
      company: 'Orbitwheel Bikes',
    },
  },
  {
    id: 'jonas',
    theme: 'replies',
    parts: [
      { kind: 'text', text: 'I am the support team. ' },
      { kind: 'phrase', text: 'A forty minute inbox now takes me ten' },
      { kind: 'text', text: ', and I still sign every reply myself.' },
    ],
    person: {
      name: 'Jonas Weber',
      role: 'Founder',
      company: 'Fernhill Studio',
    },
  },
  {
    id: 'sofia',
    theme: 'handoffs',
    parts: [
      { kind: 'text', text: 'Bugs go straight to ' },
      { kind: 'brand', brand: 'linear', text: 'Linear' },
      {
        kind: 'text',
        text: ' with the steps the customer took written out. ',
      },
      { kind: 'phrase', text: 'Engineering stopped asking us for details' },
      { kind: 'text', text: ' the week we switched.' },
    ],
    person: {
      name: 'Sofia Marchetti',
      role: 'Head of Customer Experience',
      company: 'Brightmoor Insurance',
    },
  },
  {
    id: 'kwame',
    theme: 'setup',
    parts: [
      { kind: 'text', text: 'There was no training week. ' },
      { kind: 'phrase', text: 'I learned it by sending my first ten replies' },
      {
        kind: 'text',
        text: ', and the drafts got closer to how I write by the end of the day.',
      },
    ],
    person: {
      name: 'Kwame Asante',
      role: 'Support agent',
      company: 'Saltmarsh Coffee',
    },
  },
  {
    id: 'elif',
    theme: 'replies',
    parts: [
      { kind: 'text', text: 'On Mondays ' },
      { kind: 'phrase', text: 'the weekend backlog is gone before lunch' },
      {
        kind: 'text',
        text: ', and the tone still sounds like us because it learned from our old replies.',
      },
    ],
    person: {
      name: 'Elif Kaya',
      role: 'Team lead',
      company: 'Quillstack',
    },
  },
];
