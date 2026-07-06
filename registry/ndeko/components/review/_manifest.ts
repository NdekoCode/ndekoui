import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'review-01',
    source: 'ndeko',
    title: 'Approval prompt',
    description:
      'Requests stacked under a waiting count, the first open with its preview, where the Approve key becomes its result, a one-line trace with Undo, and the next request slides up.',
  },
  {
    name: 'review-02',
    source: 'ndeko',
    title: 'Permission request',
    description:
      'An agent asks to run an exact command with its risk, and the choice of how long it lasts (once, this session or always) unfolds a warning before the card resizes into what was allowed.',
  },
  {
    name: 'review-03',
    source: 'ndeko',
    title: 'Autonomy dial',
    description:
      'A dial that catches on its stops for how much an agent may do alone, then each tool on its own switch that follows the default or asks to confirm.',
  },
  {
    name: 'review-04',
    source: 'ndeko',
    title: 'Diff review',
    description:
      'Hunks stream in line by line and take a verdict stamp from Keep or Reject, rejected ones fold, J, K, Y and N drive it, and unified slides apart into split.',
  },
  {
    name: 'review-05',
    source: 'ndeko',
    title: 'Inline diff',
    description:
      'Two versions compared in the browser, changed words tinted inside their lines, unchanged runs folded behind a count, and each hunk settled by Accept or Reject.',
  },
  {
    name: 'review-06',
    source: 'ndeko',
    title: 'Change summary',
    description:
      'Every file an agent changed with a status tile, a five-block bar and counts, filtered by status, each row unfolding its own diff.',
  },
  {
    name: 'review-07',
    source: 'ndeko',
    title: 'Branch graph',
    description:
      'Agent branches as coloured lanes with a live commit and a checkpoint to restore, where Merge, Rebase and Squash previews glide the dots and rows into place before Apply.',
  },
  {
    name: 'review-08',
    source: 'ndeko',
    title: 'Branch conflicts',
    description:
      'A file by agent grid of live edits where a conflict opens both approaches side by side, Use or Combine settles it, and Merge waits until none is open.',
  },
  {
    name: 'review-09',
    source: 'ndeko',
    title: 'Extraction review',
    description:
      'Fields read from a drawn invoice stream in with their confidence, a thread runs from each one to where it came from, and the unsure ones are checked first.',
  },
  {
    name: 'review-10',
    source: 'ndeko',
    title: 'Computer use viewer',
    description:
      'An agent drives a drawn booking site with a named pointer that glides and ripples, a log and a scrubber to replay its steps, Pause, Take over and an approval before it pays.',
  },
  {
    name: 'review-11',
    source: 'ndeko',
    title: 'Prose diff',
    description:
      'Suggested edits marked inside a paragraph, each accepted or rejected from a card that glides to it or with Y and N, with J and K to move, Undo and a count that rolls.',
  },
  {
    name: 'review-12',
    source: 'ndeko',
    title: 'Agent question',
    description:
      'The agent stops to ask with the reason why, choices you pick with the number keys or answer in your own words, and the card folds into one line that says what you answered, with Change.',
  },
  {
    name: 'review-13',
    source: 'ndeko',
    title: 'Staged action',
    description:
      'What the agent is about to run as fields you can correct, where a changed field marks itself as edited with Reset, and Approve becomes the result while Discard folds away with Undo.',
  },
  {
    name: 'review-14',
    source: 'ndeko',
    title: 'Secret request',
    description:
      'A masked field for a key that never enters the thread, whose prefix check answers as you type and turns right, then Save folds the card into where the key went and its last four characters.',
  },
];
