import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'application-11',
    title: 'Support inbox',
    description:
      'An Oatfield support inbox: tickets with status, priority and unread marks beside the conversation and a copilot that reads the ticket, fills the customer card and searches the help center, then its draft arrives in the reply box with its sources to insert, edit or discard, a refund waits for Allow or Deny and the answered ticket travels to Solved. Plug your help desk into onSend, onApprove and onDeny.',
    files: [
      'index.tsx',
      'ticket-list.tsx',
      'conversation.tsx',
      'reply-composer.tsx',
      'draft-card.tsx',
      'copilot-panel.tsx',
      'customer-card.tsx',
      'copilot-steps.tsx',
      'refund-request.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 860,
  },
];
