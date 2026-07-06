import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'application-05',
    title: 'Assistant',
    description:
      'A Quillstone assistant: conversations on the left that go into a sheet on phones, a reply that streams in while Send becomes Stop, a composer that takes files and a model, a reply that folds its reasoning and runs two tool calls, and a new chat that starts from suggested prompts.',
    files: [
      'index.tsx',
      'conversation-list.tsx',
      'sidebar-parts.tsx',
      'account-menu.tsx',
      'conversation-view.tsx',
      'turns.tsx',
      'reply-actions.tsx',
      'use-copied.ts',
      'reasoning-reply.tsx',
      'reply-sources.tsx',
      'composer.tsx',
      'attachment-list.tsx',
      'model-picker.tsx',
      'presence.ts',
      'data.ts',
    ],
    previewHeight: 860,
  },
  {
    name: 'application-08',
    title: 'Chat with run details',
    description:
      'A Quenby chat with run details: chats grouped by day with a search, a sidebar that collapses and goes into a sheet on phones, a thread where the assistant thinks, asks before it reads a shared file and cites numbered sources that light up, a model picker, Send that becomes Stop, and a details panel from the header whose plan, calls, tokens and cost move as the run goes. Plug your assistant into onSend, onApprove, onDeny and onStop.',
    files: [
      'index.tsx',
      'app-sidebar.tsx',
      'approval-card.tsx',
      'chat-header.tsx',
      'cited-answer.tsx',
      'composer.tsx',
      'data.ts',
      'model-picker.tsx',
      'run-details.tsx',
      'session.ts',
      'thinking-block.tsx',
      'thread.tsx',
      'work-line.tsx',
    ],
    previewHeight: 860,
  },
];
