import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type QuotePart =
  | { kind: 'text'; text: string }
  | { kind: 'brand'; brand: BrandSlug; text: string };

export type Person = {
  name: string;
  role: string;
  company: string;
};

export type Story = {
  id: string;
  parts: QuotePart[];
  person: Person;
};

export const SECTION = {
  label: 'Customer stories',
  title: 'Shops that stopped reordering by feel',
  lead: 'Stowly reads what sold and what is on the way, and tells you what will run out before it does.',
};

/** Invented people and companies. The quotes are samples written for this block. */
export const STORIES: Story[] = [
  {
    id: 'grace',
    parts: [
      {
        kind: 'text',
        text: 'We used to reorder on Sunday nights, by feel. Now Stowly tells us on Thursday what will run out next week, and it has been right often enough that we stopped checking twice.',
      },
    ],
    person: {
      name: 'Grace Mwangi',
      role: 'Operations lead',
      company: 'Pallet & Pine',
    },
  },
  {
    id: 'lukas',
    parts: [
      { kind: 'text', text: 'It reads our sales from ' },
      { kind: 'brand', brand: 'shopify', text: 'Shopify' },
      {
        kind: 'text',
        text: ' and the lead times of every supplier in one place. The reorder list is ready before I open the shop.',
      },
    ],
    person: {
      name: 'Lukas Brenner',
      role: 'Founder',
      company: 'Brenner Bikes',
    },
  },
  {
    id: 'nadia',
    parts: [
      {
        kind: 'text',
        text: 'The forecast explains itself. When it asks for twice the usual olive oil, it shows me the festival weekend it found in last year’s sales.',
      },
    ],
    person: {
      name: 'Nadia Haddad',
      role: 'Buyer',
      company: 'Cedar & Salt',
    },
  },
  {
    id: 'owen',
    parts: [
      { kind: 'text', text: 'Purchase orders go straight to ' },
      { kind: 'brand', brand: 'quickbooks', text: 'QuickBooks' },
      {
        kind: 'text',
        text: ', so closing the month is one check instead of an afternoon of matching receipts.',
      },
    ],
    person: {
      name: 'Owen Prescott',
      role: 'Finance manager',
      company: 'Northline Pharmacy',
    },
  },
];
