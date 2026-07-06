import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'effect-01',
    source: 'ndeko',
    title: 'Fan stack',
    description:
      'A stack of cards that fans out under the pointer or the keyboard focus, each card turning around a point below the stack one after another, and closes again when they leave; a tap opens it on a phone.',
  },
  {
    name: 'effect-02',
    source: 'ndeko',
    title: 'Parallax card',
    description:
      'A link card that leans away from the pointer, its surface shifting a few pixels and growing to 102% while the text and the picture that bleeds past its frame travel further, so the three read at different depths.',
  },
  {
    name: 'effect-03',
    source: 'ndeko',
    title: 'Named cursor',
    description:
      'The pointer drawn inside an area on a light spring: an arrow with the name of its owner, a dot that grows into the word of what it is over, or a crosshair with its coordinates; fields keep the cursor of the system.',
  },
  {
    name: 'effect-04',
    source: 'ndeko',
    title: 'Announcement pill',
    description:
      'The pill above a headline, where a light runs once round its edge from the side the pointer comes from as it gets within reach, then rests, and the arrow of the tag that says what a press does nudges forward.',
  },
];
