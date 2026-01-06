import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'radio-01',
    source: 'comp-152',
    title: 'Basic radio group',
    description: 'Three options stacked, one of them always picked.',
  },
  {
    name: 'radio-02',
    source: 'comp-153',
    title: 'Coloured radio group',
    description: 'A radio group whose picked option takes the info hue.',
  },
  {
    name: 'radio-03',
    source: 'comp-154',
    title: 'Disabled radio group',
    description:
      'A radio group and its labels dimmed because they cannot be changed.',
  },
  {
    name: 'radio-04',
    source: 'comp-155',
    title: 'Radio group with descriptions',
    description: 'Each option has a quiet sublabel and a line of help.',
  },
  {
    name: 'radio-05',
    source: 'comp-156',
    title: 'Radio with field',
    description:
      'Picking the first option opens a field below it and focuses it.',
  },
  {
    name: 'radio-06',
    source: 'comp-157',
    title: 'Review filter',
    description: 'Filter reviews by star rating, each option with its count.',
  },
  {
    name: 'radio-07',
    source: 'comp-158',
    title: 'Colour swatches',
    description: 'Round swatches in the theme hues for picking a label colour.',
  },
  {
    name: 'radio-08',
    source: 'comp-159',
    title: 'Radio cards',
    description:
      'Two plan cards where the picked one takes a primary hairline.',
  },
  {
    name: 'radio-09',
    source: 'comp-160',
    title: 'Payment card picker',
    description: 'Radio cards for saved cards, each led by its brand mark.',
  },
  {
    name: 'radio-10',
    source: 'comp-161',
    title: 'Provider picker',
    description:
      'Radio cards for database providers, each led by its logo on a key cap.',
  },
  {
    name: 'radio-11',
    source: 'comp-162',
    title: 'Radio tiles',
    description: 'A two-column grid of tool tiles where one is picked.',
  },
  {
    name: 'radio-12',
    source: 'comp-163',
    title: 'Payment method tiles',
    description:
      'Three centred tiles with an icon and a name for the payment method.',
  },
  {
    name: 'radio-13',
    source: 'comp-164',
    title: 'Option tiles',
    description: 'A grid of CPU sizes where the largest one is not available.',
  },
  {
    name: 'radio-14',
    source: 'comp-165',
    title: 'Radio chips',
    description: 'Small cards in a row for picking a server location.',
  },
  {
    name: 'radio-15',
    source: 'comp-166',
    title: 'Plan list',
    description: 'Joined plan rows with prices and a popular badge.',
  },
  {
    name: 'radio-16',
    source: 'comp-171',
    title: 'Star rating',
    description:
      'Five stars that light up under the pointer and keep the chosen rating.',
  },
  {
    name: 'radio-17',
    source: 'comp-167',
    title: 'Mood picker',
    description: 'Five round faces, from angry to laughing.',
  },
  {
    name: 'radio-18',
    source: 'comp-168',
    title: 'Score scale',
    description: 'A joined scale from 0 to 5 with its two ends named below.',
  },
  {
    name: 'radio-19',
    source: 'comp-169',
    title: 'Theme picker',
    description:
      'Small sketches of the light, dark and system themes to pick from.',
  },
  {
    name: 'radio-20',
    source: 'comp-170',
    title: 'Billing period toggle',
    description:
      'Monthly or yearly, with an indicator that slides to the choice.',
  },
];
