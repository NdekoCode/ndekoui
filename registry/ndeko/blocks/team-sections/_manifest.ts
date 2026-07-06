import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'team-sections-01',
    title: 'Team grid',
    description:
      'The people behind a product as cards with their drawn picture, role, city, a bio clamped to three lines and labelled social links, beside a dashed seat for the open role: Read more opens a bio in place, the card growing to fit it while its label rolls to Show less.',
    files: [
      'index.tsx',
      'member-card.tsx',
      'member-bio.tsx',
      'opening-card.tsx',
      'data.ts',
    ],
    previewHeight: 1000,
  },
  {
    name: 'team-sections-02',
    title: 'Team list',
    description:
      'The team as rows grouped by team, each with its drawn picture, role and city and a bio behind a toggle: the open row lifts onto a card while its bio and social links unfold under it and its chevron turns.',
    files: ['index.tsx', 'member-row.tsx', 'data.ts'],
    previewHeight: 900,
  },
  {
    name: 'team-sections-03',
    title: 'Team showcase',
    description:
      'The team as a spotlight over a picker of people: picking someone sends the raised spotlight gliding to them while their profile opens in place on the featured card, with what to ask them about, their links and a button that copies their email address.',
    files: ['index.tsx', 'people-picker.tsx', 'member-profile.tsx', 'data.ts'],
    previewHeight: 800,
  },
];
