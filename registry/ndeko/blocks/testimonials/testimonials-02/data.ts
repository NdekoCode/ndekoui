import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type QuotePart =
  | { kind: 'text'; text: string }
  | { kind: 'brand'; brand: BrandSlug; text: string };

export type Person = {
  name: string;
  role: string;
  company: string;
};

export type Slide = {
  id: string;
  parts: QuotePart[];
  person: Person;
};

export const SECTION = {
  label: 'Customer quotes',
  title: 'Teams that stopped taking meeting notes',
  lead: 'Fieldnote writes the summary while you talk and files each follow-up where it belongs.',
};

/** Invented people and companies. The quotes are samples written for this block. */
export const SLIDES: Slide[] = [
  {
    id: 'ines',
    parts: [
      {
        kind: 'text',
        text: 'I stopped typing during client calls. Fieldnote joins from ',
      },
      { kind: 'brand', brand: 'googlecalendar', text: 'Google Calendar' },
      {
        kind: 'text',
        text: ', writes the summary while we talk and has the follow-ups in ',
      },
      { kind: 'brand', brand: 'hubspot', text: 'HubSpot' },
      { kind: 'text', text: ' before I close the tab.' },
    ],
    person: {
      name: 'Ines Carvalho',
      role: 'Account director',
      company: 'Harbourline Logistics',
    },
  },
  {
    id: 'rafael',
    parts: [
      {
        kind: 'text',
        text: 'Our standups used to repeat themselves. Now the notes land in ',
      },
      { kind: 'brand', brand: 'linear', text: 'Linear' },
      {
        kind: 'text',
        text: ' as issues with an owner, and the next standup starts from what moved.',
      },
    ],
    person: {
      name: 'Rafael Moreno',
      role: 'Engineering manager',
      company: 'Mossgrove Labs',
    },
  },
  {
    id: 'hannah',
    parts: [
      {
        kind: 'text',
        text: 'The summaries read as if a colleague wrote them: short, in our words, and they never record a decision we did not make.',
      },
    ],
    person: {
      name: 'Hannah Kowalczyk',
      role: 'Chief of staff',
      company: 'Ostrava Labs',
    },
  },
  {
    id: 'amara',
    parts: [
      {
        kind: 'text',
        text: 'We run interviews in five languages. Every transcript comes back in English with the quotes kept in the original, which is exactly what our researchers asked for.',
      },
    ],
    person: {
      name: 'Amara Nwosu',
      role: 'Research lead',
      company: 'Tallgrass Health',
    },
  },
  {
    id: 'mateo',
    parts: [
      { kind: 'text', text: 'Every decision goes into ' },
      { kind: 'brand', brand: 'notion', text: 'Notion' },
      {
        kind: 'text',
        text: ' under the project it belongs to. Six months in, our wiki finally knows why things are the way they are.',
      },
    ],
    person: {
      name: 'Mateo Silva',
      role: 'Product lead',
      company: 'Windrose Travel',
    },
  },
];
