import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'chat-01',
    title: 'Conversation about a page',
    description:
      'A writing assistant beside a docs page: the reply streams in word by word, Send becomes Stop while it does, and the list follows new text until you scroll up.',
    files: [
      'index.tsx',
      'turns.tsx',
      'reply-actions.tsx',
      'presence.ts',
      'use-copied.ts',
      'data.ts',
    ],
    previewHeight: 640,
  },
  {
    name: 'chat-02',
    title: 'Prompt composer',
    description:
      'A composer that grows with the text, takes files from the picker or a drop, lets you pick a model and fills itself from suggested prompts.',
    files: [
      'index.tsx',
      'attachment-list.tsx',
      'model-picker.tsx',
      'submit-button.tsx',
      'presence.ts',
      'data.ts',
    ],
    previewHeight: 560,
  },
  {
    name: 'chat-03',
    title: 'Reasoning and tool calls',
    description:
      'A reply that shows how long it thought, folds its reasoning, runs two tool calls from running to done and cites its sources.',
    files: ['index.tsx', 'reply-sources.tsx', 'presence.ts', 'data.ts'],
    previewHeight: 720,
  },
];
