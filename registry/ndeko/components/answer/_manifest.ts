import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'answer-01',
    source: 'ndeko',
    title: 'Answer with citations',
    description:
      'An answer that streams word by word under a steps line that opens, with numbered marks that preview their source and light its pill, then Copy, Regenerate, thumbs and follow-ups that fill the composer.',
  },
  {
    name: 'answer-02',
    source: 'ndeko',
    title: 'Grounded answer',
    description:
      'Marks that tint their sentence and raise their source, whose passage unfolds with the shared words marked, under a line that counts how much of the answer is backed.',
  },
  {
    name: 'answer-03',
    source: 'ndeko',
    title: 'Message actions',
    description:
      'The quiet bar under a reply: Copy that turns into a check, Regenerate with versions that crossfade, thumbs with a reason picker, Read aloud with a live equalizer and a menu.',
  },
  {
    name: 'answer-04',
    source: 'ndeko',
    title: 'Thinking state',
    description:
      'Steps, sources and a timed tool call grow live while the reasoning streams under a fade, then the block folds into one line that says how long it thought.',
  },
  {
    name: 'answer-05',
    source: 'ndeko',
    title: 'Model arena',
    description:
      'Models answer one prompt side by side with live meters, blind until you vote, when the names roll in, rounds reshuffle and a leaderboard sums them; a narrow piece swipes between tabs.',
  },
  {
    name: 'answer-06',
    source: 'ndeko',
    title: 'Artifact canvas',
    description:
      'A chat beside the document it made, split by a handle you drag or move with the arrows, with versions that crossfade, changes marked against the last one, Copy and Apply.',
  },
  {
    name: 'answer-07',
    source: 'ndeko',
    title: 'Retrieved passages',
    description:
      'The passages an answer was built from, with similarity bars and the shared words marked, each on a switch: leaving one out writes the answer again word by word, and the count of passages used rolls.',
  },
];
