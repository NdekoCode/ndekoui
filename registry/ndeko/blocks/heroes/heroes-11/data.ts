export type MarkId = 'plan' | 'agent' | 'review';

export type Token =
  | { id: string; kind: 'word'; text: string }
  | { id: string; kind: 'mark'; mark: MarkId };

export const HERO = {
  description:
    'Describe the outcome you want. Agents break it into steps, do the work in the open, and stop for your approval before anything leaves your workspace.',
  primaryAction: 'Start a project',
  secondaryAction: 'Watch a run',
};

export const TOKENS: Token[] = [
  { id: 'plan', kind: 'word', text: 'Plan' },
  { id: 'the', kind: 'word', text: 'the' },
  { id: 'work', kind: 'word', text: 'work' },
  { id: 'plan-mark', kind: 'mark', mark: 'plan' },
  { id: 'hand', kind: 'word', text: 'hand' },
  { id: 'it', kind: 'word', text: 'it' },
  { id: 'to', kind: 'word', text: 'to' },
  { id: 'an', kind: 'word', text: 'an' },
  { id: 'agent', kind: 'word', text: 'agent' },
  { id: 'agent-mark', kind: 'mark', mark: 'agent' },
  { id: 'review', kind: 'word', text: 'review' },
  { id: 'what', kind: 'word', text: 'what' },
  { id: 'ships', kind: 'word', text: 'ships' },
];
