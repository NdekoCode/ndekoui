export const PROMPT =
  'When a customer reports a bug, open an issue and tell the support channel';

export const READY_LINE =
  'Drafted. Check the three cards, change what you like, then run it.';

export const LIVE_LINE =
  'The rule is live. The next bug report opens an issue and posts to #support.';

export const CHECK_LABELS = [
  'Understood the request',
  'Found the Support project',
  'Drafted the rule',
];

export type FieldId =
  'when' | 'if' | 'then' | 'title' | 'team' | 'channel' | 'post';

export type CardId = 'rule' | 'issue' | 'post';

export type CardField = {
  id: FieldId;
  label: string;
};

export const CARD_ORDER: CardId[] = ['rule', 'issue', 'post'];

export const CARD_FIELDS: Record<CardId, CardField[]> = {
  rule: [
    { id: 'when', label: 'When' },
    { id: 'if', label: 'If' },
    { id: 'then', label: 'Then' },
  ],
  issue: [
    { id: 'title', label: 'Title' },
    { id: 'team', label: 'Team' },
  ],
  post: [
    { id: 'channel', label: 'Channel' },
    { id: 'post', label: 'Message' },
  ],
};

export const FIELD_TEXT: Record<FieldId, string> = {
  when: 'A customer reports a bug',
  if: 'The message describes something broken',
  then: 'Open an issue and post to #support',
  title: 'Bug from {customer}: {summary}',
  team: 'Support',
  channel: '#support',
  post: 'New bug from {customer}. Tracked in {issue}.',
};

export const ISSUE_LABELS = [
  { name: 'Bug', color: 'var(--destructive)' },
  { name: 'From support', color: 'var(--muted-foreground)' },
];

/** An invented workspace: it has no mark, so it wears a drawn initial. */
export const WORKSPACE = { name: 'Harbour chat', initial: 'H' };

export function typedLengthOf(card: CardId) {
  let total = 0;
  for (const field of CARD_FIELDS[card]) {
    total += FIELD_TEXT[field.id].length;
  }
  return total;
}
