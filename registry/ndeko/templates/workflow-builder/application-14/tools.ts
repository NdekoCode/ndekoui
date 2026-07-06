import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

import type { ToolId } from './model';

export type ToolField = {
  id: string;
  label: string;
  value: string;
};

export type ToolAction = {
  id: string;
  label: string;
  /** An event starts a flow. An action runs inside it. */
  isEvent: boolean;
  /** What the step calls its result, and what the result holds: {{order.total}}. */
  namespace: string;
  outputs: string[];
  fields: ToolField[];
};

/** A known product wears its real mark. Kestrel Post is invented, so it wears a drawn one. */
export type ToolMark =
  { kind: 'brand'; brand: BrandSlug } | { kind: 'company'; seed: string };

export type Tool = {
  id: ToolId;
  name: string;
  mark: ToolMark;
  actions: ToolAction[];
};

export const SUPPORT_MAILBOX = 'support@alderbank.example';

export const TOOLS: Tool[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    mark: { kind: 'brand', brand: 'gmail' },
    actions: [
      {
        id: 'new-email',
        label: 'New email',
        isEvent: true,
        namespace: 'email',
        outputs: ['from', 'subject', 'body'],
        fields: [{ id: 'mailbox', label: 'Mailbox', value: SUPPORT_MAILBOX }],
      },
      {
        id: 'send-reply',
        label: 'Send a reply',
        isEvent: false,
        namespace: 'sent',
        outputs: ['time'],
        fields: [
          { id: 'from', label: 'From', value: SUPPORT_MAILBOX },
          { id: 'body', label: 'Body', value: '{{reply}}' },
        ],
      },
      {
        id: 'add-label',
        label: 'Add a label',
        isEvent: false,
        namespace: 'label',
        outputs: ['name'],
        fields: [{ id: 'label', label: 'Label', value: 'Answered' }],
      },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    mark: { kind: 'brand', brand: 'stripe' },
    actions: [
      {
        id: 'find-payment',
        label: 'Find a payment',
        isEvent: false,
        namespace: 'order',
        outputs: ['id', 'total', 'item'],
        fields: [
          { id: 'order', label: 'Order number', value: '{{topic.order}}' },
        ],
      },
      {
        id: 'refund',
        label: 'Issue a refund',
        isEvent: false,
        namespace: 'refund',
        outputs: ['amount', 'status'],
        fields: [
          { id: 'payment', label: 'Payment', value: '{{order.id}}' },
          { id: 'amount', label: 'Amount', value: '{{order.total}}' },
        ],
      },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    mark: { kind: 'brand', brand: 'linear' },
    actions: [
      {
        id: 'open-issue',
        label: 'Open an issue',
        isEvent: false,
        namespace: 'issue',
        outputs: ['url'],
        fields: [
          { id: 'team', label: 'Team', value: 'Support' },
          { id: 'title', label: 'Title', value: '{{email.subject}}' },
        ],
      },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    mark: { kind: 'brand', brand: 'notion' },
    actions: [
      {
        id: 'add-page',
        label: 'Add a page',
        isEvent: false,
        namespace: 'page',
        outputs: ['url'],
        fields: [
          { id: 'database', label: 'Database', value: 'Customer notes' },
          { id: 'title', label: 'Title', value: '{{email.subject}}' },
        ],
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    mark: { kind: 'brand', brand: 'github' },
    actions: [
      {
        id: 'open-issue',
        label: 'Open an issue',
        isEvent: false,
        namespace: 'ticket',
        outputs: ['url'],
        fields: [
          { id: 'repository', label: 'Repository', value: 'alderbank/shop' },
          { id: 'title', label: 'Title', value: '{{email.subject}}' },
        ],
      },
    ],
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    mark: { kind: 'brand', brand: 'googledrive' },
    actions: [
      {
        id: 'save-file',
        label: 'Save a file',
        isEvent: false,
        namespace: 'file',
        outputs: ['url'],
        fields: [
          { id: 'folder', label: 'Folder', value: 'Support, replies' },
          { id: 'name', label: 'File name', value: '{{topic.order}}' },
        ],
      },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    mark: { kind: 'brand', brand: 'shopify' },
    actions: [
      {
        id: 'find-order',
        label: 'Find an order',
        isEvent: false,
        namespace: 'purchase',
        outputs: ['items', 'address'],
        fields: [
          { id: 'order', label: 'Order number', value: '{{topic.order}}' },
        ],
      },
    ],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    mark: { kind: 'brand', brand: 'airtable' },
    actions: [
      {
        id: 'add-record',
        label: 'Add a record',
        isEvent: false,
        namespace: 'record',
        outputs: ['id'],
        fields: [{ id: 'table', label: 'Table', value: 'Order questions' }],
      },
    ],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    mark: { kind: 'brand', brand: 'zendesk' },
    actions: [
      {
        id: 'add-note',
        label: 'Add a note',
        isEvent: false,
        namespace: 'note',
        outputs: ['id'],
        fields: [{ id: 'note', label: 'Note', value: '{{topic.label}}' }],
      },
    ],
  },
  {
    id: 'calder',
    name: 'Kestrel Post',
    mark: { kind: 'company', seed: 'Kestrel Post' },
    actions: [
      {
        id: 'track-parcel',
        label: 'Track a parcel',
        isEvent: false,
        namespace: 'parcel',
        outputs: ['status', 'due'],
        fields: [
          { id: 'order', label: 'Order number', value: '{{topic.order}}' },
        ],
      },
    ],
  },
];

export function toolOf(id: ToolId) {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  return tool ?? TOOLS[0];
}

export function actionOf(tool: Tool, actionId: string) {
  const action = tool.actions.find((candidate) => candidate.id === actionId);
  return action ?? tool.actions[0];
}

export function valuesOf(action: ToolAction) {
  const values: Record<string, string> = {};
  for (const field of action.fields) {
    values[field.id] = field.value;
  }
  return values;
}
