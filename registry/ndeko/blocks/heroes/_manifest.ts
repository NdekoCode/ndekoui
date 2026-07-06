import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'heroes-01',
    title: 'Split hero',
    description:
      'The title on the left, a short paragraph and two actions on the right, under an announcement link.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 520,
  },
  {
    name: 'heroes-02',
    title: 'Centered hero with a live board',
    description:
      'A centred title above a planning board drawn from primitives, where one card keeps travelling across the lanes and a rule reacts when it lands in Done.',
    files: ['index.tsx', 'board-stage.tsx', 'data.ts'],
    previewHeight: 920,
  },
  {
    name: 'heroes-03',
    title: 'Hero with an email capture',
    description:
      'A waitlist field that checks the address, shows its submitting state and morphs into a confirmation.',
    files: ['index.tsx', 'waitlist-form.tsx', 'issue-preview.tsx', 'data.ts'],
    previewHeight: 600,
  },
  {
    name: 'heroes-04',
    title: 'Statement hero',
    description:
      'An oversized statement above a row of the three facts it rests on: as the raised card travels from fact to fact, the part of the statement that fact backs takes the brand ink.',
    files: ['index.tsx', 'fact-picker.tsx', 'data.ts'],
    previewHeight: 700,
  },
  {
    name: 'heroes-05',
    title: 'Hero with a product view',
    description:
      'A centred hero over a framed view of the app, where requests arrive and ship on their own: the view starts tilted back in 3D and lays itself flat as the page scrolls.',
    files: ['index.tsx', 'tilt-frame.tsx', 'product-view.tsx', 'data.ts'],
    previewHeight: 660,
  },
  {
    name: 'heroes-06',
    title: 'Hero with a live run',
    description:
      'A hero for an AI product whose last word turns over, with an install command to copy and an agent run beside it: the plan ticks while two tool calls land their results under the ink of a run in progress.',
    files: [
      'index.tsx',
      'live-run.tsx',
      'run-script.ts',
      'install-chip.tsx',
      'data.ts',
    ],
    previewHeight: 640,
  },
  {
    name: 'heroes-07',
    title: 'Hero with a chat box',
    description:
      'A hero for an AI product whose prompt box types its own questions into the empty field, one after another, while app tiles orbit it on two dashed circles and stay upright as they turn.',
    files: ['index.tsx', 'prompt-box.tsx', 'orbit.tsx', 'data.ts'],
    previewHeight: 920,
  },
  {
    name: 'heroes-08',
    title: 'Hero on a grid',
    description:
      'A centred hero on a square grid where app tiles fade into its cells and out again, never two neighbours at once, around a headline that keeps the page colour.',
    files: ['index.tsx', 'grid-layer.tsx', 'data.ts'],
    previewHeight: 640,
  },
  {
    name: 'heroes-09',
    title: 'Hero with a word pill',
    description:
      'A centred hero whose headline ends in a pill that rolls to the next agent word while its colour sweeps in from the left, with the row of agent tiles above lighting the one the word belongs to.',
    files: ['index.tsx', 'agent-row.tsx', 'word-pill.tsx', 'data.ts'],
    previewHeight: 620,
  },
  {
    name: 'heroes-10',
    title: 'Waitlist hero',
    description:
      'A waitlist hero with an email field that checks the address and morphs into You are on the list, above a stack of avatars where each new member slides in while the oldest tucks under a rolling counter.',
    files: [
      'index.tsx',
      'email-form.tsx',
      'avatar-stack.tsx',
      'stack.ts',
      'data.ts',
    ],
    previewHeight: 640,
  },
  {
    name: 'heroes-11',
    title: 'Typographic hero',
    description:
      'A hero that is mostly its headline, set large: the words land one after another, with small icon tiles standing between some of them, and the lead and two actions follow.',
    files: ['index.tsx', 'headline.tsx', 'data.ts'],
    previewHeight: 720,
  },
  {
    name: 'heroes-12',
    title: 'Hero with a drawn agent',
    description:
      "A hero for a creator's home page with a drawn agent whose eyes follow the pointer and blink, beside a headline whose last words type, hold, erase and give way to the next phrase.",
    files: [
      'index.tsx',
      'agent-face.tsx',
      'use-gaze.ts',
      'typed-phrase.tsx',
      'data.ts',
    ],
    previewHeight: 600,
  },
];
