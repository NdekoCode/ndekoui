import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'badge-01',
    source: 'comp-413',
    title: 'Badge',
    description: 'The default badge on the soft brand pair.',
  },
  {
    name: 'badge-02',
    source: 'comp-414',
    title: 'Pill badge',
    description: 'A badge with fully rounded ends.',
  },
  {
    name: 'badge-03',
    source: 'comp-415',
    title: 'Badge with icon',
    description: 'A badge with a dimmed icon before its label.',
  },
  {
    name: 'badge-04',
    source: 'comp-416',
    title: 'Count badge',
    description: 'A compact badge that holds a single count.',
  },
  {
    name: 'badge-05',
    source: 'comp-417',
    title: 'Link badge',
    description: 'A badge that is a link and deepens its tint on hover.',
  },
  {
    name: 'badge-06',
    source: 'comp-418',
    title: 'Badge with count',
    description: 'A label followed by a smaller, quieter count.',
  },
  {
    name: 'badge-07',
    source: 'comp-419',
    title: 'Verified badge',
    description: 'An outline badge with a success check.',
  },
  {
    name: 'badge-08',
    source: 'comp-420',
    title: 'Active status badge',
    description: 'An outline badge with a success dot.',
  },
  {
    name: 'badge-09',
    source: 'comp-421',
    title: 'Pending status badge',
    description: 'An outline badge with a warning dot.',
  },
  {
    name: 'badge-10',
    source: 'comp-422',
    title: 'Failed status badge',
    description: 'An outline badge with a destructive dot.',
  },
  {
    name: 'badge-11',
    source: 'comp-423',
    title: 'Selectable badge',
    description:
      'A badge that toggles like a checkbox and shows a check when on.',
  },
  {
    name: 'badge-12',
    source: 'comp-424',
    title: 'Removable badge',
    description: 'A badge with a cross that removes it.',
  },
  {
    name: 'badge-13',
    source: 'comp-425',
    title: 'Removable tag',
    description: 'A taller outline tag with a roomy remove button.',
  },
  {
    name: 'badge-14',
    source: 'ndeko',
    title: 'Scan badge',
    description:
      'A drawn code whose cells fall like grains into a small badge once it is scanned, the badge filling with the success tint and reading Scanned as the last ones land, then the cells growing back from the top left corner; the cells only fade under reduced motion.',
  },
  {
    name: 'badge-15',
    source: 'ndeko',
    title: 'Price pill',
    description:
      'A pill whose price rolls figure by figure to a new amount while its width follows the figures, with the billing period under it where only the word that changed rolls.',
  },
  {
    name: 'badge-16',
    source: 'ndeko',
    title: 'Seal',
    description:
      'A round seal in one colour whose line of text circles a fixed centre label on a slow turn that holds off screen, under the pointer and under reduced motion, and that the demonstration can slow, quicken or pause.',
  },
];
