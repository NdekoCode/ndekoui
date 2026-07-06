import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'text-effect-01',
    source: 'ndeko',
    title: 'Typewriter',
    description:
      'A line that types itself with human timing, cycling through phrases or clearing itself to type again, where a slip of two swapped letters is noticed, taken back and fixed while the caret blinks only when the hand rests.',
  },
  {
    name: 'text-effect-02',
    source: 'ndeko',
    title: 'Slice text',
    description:
      'A large word drawn as horizontal strips that fly in from the left and the right in turn and settle into its letters, then come apart around the pointer, the strips above it sliding one way and those under it the other.',
  },
  {
    name: 'text-effect-03',
    source: 'ndeko',
    title: 'Lit find',
    description:
      'Find in an article by light: everything dims but the sentences that hold the word, and one plate travels from match to match with Enter while the article scrolls it into view and the count rolls.',
  },
  {
    name: 'text-effect-04',
    source: 'ndeko',
    title: 'Glyph art',
    description:
      'A word or an icon drawn in characters lit from the top left, where a band of light crosses it, the characters travel to their new cells when the shape changes, the pointer lights those near it and a press sends a ripple.',
  },
];
