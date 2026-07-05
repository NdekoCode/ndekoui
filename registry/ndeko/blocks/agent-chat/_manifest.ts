import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'agent-chat-01',
    title: 'Agent chat with its run',
    description:
      'A conversation that thinks, reads its sources and streams, with the plan checking itself off beside it: when the agent needs a yes, the field you were typing in becomes the request and turns back once you answer.',
    files: [
      'index.tsx',
      'composer.tsx',
      'run-panel.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'agent-chat-02',
    title: 'Chat with an artifact',
    description:
      'A chat beside the code an agent wrote, in panels you resize: the revision lands in place and only its new lines light up, with versions, a Changes view, Copy and Apply, and a sheet you drag down on phones.',
    files: [
      'index.tsx',
      'artifact-panel.tsx',
      'split.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'agent-chat-03',
    title: 'Agent canvas',
    description:
      'Someone says what should happen, the assistant checks off its work in the chat and three cards type their own fields on a canvas, one after the other, until Run it becomes Live.',
    files: ['index.tsx', 'cards.tsx', 'session.ts', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'agent-chat-04',
    title: 'Voice mode',
    description:
      'A voice call whose disc breathes with whoever speaks while the page beside it fills in: notes as they are said, to-dos with an owner and a date, and the ones the assistant does tick themselves, with Undo.',
    files: [
      'index.tsx',
      'call-panel.tsx',
      'notes-page.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
];
