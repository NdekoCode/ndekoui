import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'textarea-01',
    source: 'comp-59',
    title: 'Basic textarea',
    description: 'A labelled field that grows with its text.',
  },
  {
    name: 'textarea-02',
    source: 'comp-60',
    title: 'Required textarea',
    description: 'A required field marked with an asterisk after its label.',
  },
  {
    name: 'textarea-03',
    source: 'comp-61',
    title: 'Textarea with hint',
    description: 'A field with a short hint below, read out with the field.',
  },
  {
    name: 'textarea-04',
    source: 'comp-62',
    title: 'Optional textarea',
    description: 'A field that says it is optional beside its label.',
  },
  {
    name: 'textarea-05',
    source: 'comp-63',
    title: 'Textarea with brand focus',
    description:
      'A field whose border and halo take the brand colour on focus.',
  },
  {
    name: 'textarea-06',
    source: 'comp-64',
    title: 'Textarea with error',
    description: 'An invalid field with the message that explains the fix.',
  },
  {
    name: 'textarea-07',
    source: 'comp-65',
    title: 'Filled textarea',
    description: 'A tinted field without an outline until it takes focus.',
  },
  {
    name: 'textarea-08',
    source: 'comp-66',
    title: 'Compact textarea',
    description: 'A field that starts at two lines before it grows.',
  },
  {
    name: 'textarea-09',
    source: 'comp-67',
    title: 'Disabled textarea',
    description: 'A dimmed field and label that cannot be edited.',
  },
  {
    name: 'textarea-10',
    source: 'comp-68',
    title: 'Textarea with button',
    description: 'A field with its send button aligned to the start.',
  },
  {
    name: 'textarea-11',
    source: 'comp-69',
    title: 'Textarea with end button',
    description: 'A field with its send button aligned to the end.',
  },
  {
    name: 'textarea-12',
    source: 'comp-70',
    title: 'Textarea with full-width button',
    description: 'A field with a send button as wide as the field.',
  },
  {
    name: 'textarea-13',
    source: 'comp-71',
    title: 'Textarea with overlapping label',
    description: 'A small label that sits on the top edge of the field.',
  },
  {
    name: 'textarea-14',
    source: 'comp-72',
    title: 'Textarea with floating label',
    description: 'A label that rises to the top edge on focus or once filled.',
  },
  {
    name: 'textarea-15',
    source: 'comp-73',
    title: 'Textarea with inset label',
    description: 'A label drawn inside the field, above the text.',
  },
  {
    name: 'textarea-16',
    source: 'comp-74',
    title: 'Textarea with character limit',
    description:
      'A counter of characters left that warns near the limit and turns red at it.',
  },
  {
    name: 'textarea-17',
    source: 'comp-75',
    title: 'Fixed-height textarea',
    description:
      'A field that keeps its height and scrolls instead of growing.',
  },
  {
    name: 'textarea-18',
    source: 'comp-76',
    title: 'Read-only textarea',
    description: 'A flat, tinted field whose text can be read and copied.',
  },
  {
    name: 'textarea-19',
    source: 'comp-77',
    title: 'Auto-growing textarea',
    description: 'A field that starts at one line and grows up to five.',
  },
  {
    name: 'textarea-20',
    source: 'ndeko',
    title: 'Rewind',
    description:
      'A textarea that records versions as you write: drag the scrubber back and the words you deleted later return in colour, then keep that version or press Escape to return to now.',
  },
];
