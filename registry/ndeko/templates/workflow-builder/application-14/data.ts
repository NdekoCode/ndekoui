import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

import type {
  Creativity,
  LoopRounds,
  ModelId,
  PersonId,
  TimeoutHours,
  TimeoutRule,
  WaitDuration,
  Workflow,
} from './model';
import { SUPPORT_MAILBOX } from './tools';

export const BRAND = { name: 'Alderbank' };

export type Person = {
  id: PersonId;
  name: string;
  role: string;
};

/** Invented people of an invented shop: the ones a step can ask before it goes on. */
export const PEOPLE: Person[] = [
  { id: 'maren', name: 'Maren Solberg', role: 'Support lead' },
  { id: 'idris', name: 'Idris Achebe', role: 'Finance' },
  { id: 'lotte', name: 'Lotte Verhoeven', role: 'Store manager' },
];

export function personOf(id: PersonId) {
  const person = PEOPLE.find((candidate) => candidate.id === id);
  return person ?? PEOPLE[0];
}

export type Model = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
};

export const MODELS: Model[] = [
  { id: 'claude-haiku', name: 'Claude Haiku', brand: 'claude' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', brand: 'claude' },
  { id: 'gpt-mini', name: 'GPT mini', brand: 'openai' },
  { id: 'gemini-flash', name: 'Gemini Flash', brand: 'gemini' },
];

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? MODELS[0];
}

export type Choice<Value extends string> = {
  value: Value;
  label: string;
};

export const CREATIVITIES: Choice<Creativity>[] = [
  { value: 'precise', label: 'Precise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'creative', label: 'Creative' },
];

export const TIMEOUTS: Choice<TimeoutHours>[] = [
  { value: '1', label: 'After 1 hour' },
  { value: '4', label: 'After 4 hours' },
  { value: '24', label: 'After 1 day' },
];

export const TIMEOUT_RULES: Choice<TimeoutRule>[] = [
  { value: 'deny', label: 'Deny and tell the customer' },
  { value: 'wait', label: 'Keep waiting' },
  { value: 'escalate', label: 'Ask the next person' },
];

export const WAITS: Choice<WaitDuration>[] = [
  { value: '5m', label: '5 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
];

export const ROUNDS: Choice<LoopRounds>[] = [
  { value: '2', label: '2 times' },
  { value: '3', label: '3 times' },
  { value: '5', label: '5 times' },
];

export const WORKFLOW: Workflow = {
  id: 'order-triage',
  name: 'Order question triage',
  steps: [
    {
      id: 'trigger',
      kind: 'trigger',
      name: 'New email',
      tool: {
        toolId: 'gmail',
        actionId: 'new-email',
        values: { mailbox: SUPPORT_MAILBOX },
      },
    },
    {
      id: 'classify',
      kind: 'agent',
      name: 'Read and classify',
      seed: 'Read and classify',
      series: 1,
      agent: {
        instructions:
          'Read the email. Say whether it is about a refund, a delivery or something else, and pull out the order number.',
        modelId: 'claude-haiku',
        creativity: 'precise',
        streams: false,
        remembers: false,
        retries: true,
        outputName: 'topic',
        outputParts: ['label', 'order'],
      },
    },
    {
      id: 'route',
      kind: 'branch',
      name: 'Route by topic',
      outputs: [
        {
          id: 'refund',
          label: 'Refund',
          steps: [
            {
              id: 'find',
              kind: 'tool',
              name: 'Find the order',
              tool: {
                toolId: 'stripe',
                actionId: 'find-payment',
                values: { order: '{{topic.order}}' },
              },
            },
            {
              id: 'ask',
              kind: 'approval',
              name: 'Ask before refunding',
              approval: {
                approverId: 'maren',
                timeoutHours: '4',
                onTimeout: 'deny',
              },
            },
            {
              id: 'issue',
              kind: 'tool',
              name: 'Issue the refund',
              tool: {
                toolId: 'stripe',
                actionId: 'refund',
                values: { payment: '{{order.id}}', amount: '{{order.total}}' },
              },
            },
          ],
        },
        {
          id: 'delivery',
          label: 'Delivery',
          steps: [
            {
              id: 'track',
              kind: 'tool',
              name: 'Track the parcel',
              tool: {
                toolId: 'calder',
                actionId: 'track-parcel',
                values: { order: '{{topic.order}}' },
              },
            },
          ],
        },
        {
          id: 'other',
          label: 'Other',
          steps: [
            {
              id: 'open',
              kind: 'tool',
              name: 'Open an issue',
              tool: {
                toolId: 'linear',
                actionId: 'open-issue',
                values: { team: 'Support', title: '{{email.subject}}' },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'write',
      kind: 'agent',
      name: 'Write the reply',
      seed: 'Write the reply',
      series: 2,
      agent: {
        instructions:
          'Write a short, warm reply that answers the question with what the branch found. Sign as the Alderbank team.',
        modelId: 'claude-sonnet',
        creativity: 'balanced',
        streams: true,
        remembers: true,
        retries: true,
        outputName: 'reply',
        outputParts: [],
      },
    },
    {
      id: 'send',
      kind: 'output',
      name: 'Send the reply',
      tool: {
        toolId: 'gmail',
        actionId: 'send-reply',
        values: { from: SUPPORT_MAILBOX, body: '{{reply}}' },
      },
    },
  ],
};

/** What the demonstration adds to the Delivery branch, under the step it selects first. */
export const DEMO_STEP = {
  id: 'draft',
  name: 'Draft the update',
  afterId: 'track',
  entryId: 'model-claude-haiku',
  instructions:
    'Say where the parcel is and when it should arrive. Two sentences, no jargon.',
};
