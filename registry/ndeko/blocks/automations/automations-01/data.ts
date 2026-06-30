export type TriggerId =
  'card-payment' | 'expense-submitted' | 'refund-requested';

export type FieldId = 'amount' | 'category' | 'team' | 'merchant';

export type OperatorId = 'over' | 'under' | 'is' | 'is-not' | 'contains';

export type ValueKind = 'amount' | 'choice' | 'text';

export type MatchMode = 'all' | 'any';

export type ActionKind =
  | 'require-receipt'
  | 'ask-approval'
  | 'flag-review'
  | 'post-channel'
  | 'decline-payment';

export type TargetKind = 'person' | 'channel';

export type Option<Value extends string> = { value: Value; label: string };

export type FieldDefinition = {
  id: FieldId;
  label: string;
  /** How the field reads inside the rule sentence: "the amount". */
  noun: string;
  kind: ValueKind;
  operators: Option<OperatorId>[];
  choices: Option<string>[];
  defaultValue: string;
};

export type ActionDefinition = {
  kind: ActionKind;
  label: string;
  target: TargetKind | null;
};

export type Condition = {
  id: string;
  field: FieldId;
  operator: OperatorId;
  value: string;
};

export type Action = {
  id: string;
  kind: ActionKind;
  target: string;
};

export type Rule = {
  trigger: TriggerId;
  match: MatchMode;
  conditions: Condition[];
  actions: Action[];
};

export const RULE_NAME = 'Large card payments need a receipt';

export const WORKSPACE_LINE = 'Spending rules · Fernhollow Studio';

export const TRIGGERS: (Option<TriggerId> & { phrase: string })[] = [
  {
    value: 'card-payment',
    label: 'A card payment is made',
    phrase: 'a card payment is made',
  },
  {
    value: 'expense-submitted',
    label: 'An expense is submitted',
    phrase: 'an expense is submitted',
  },
  {
    value: 'refund-requested',
    label: 'A refund is requested',
    phrase: 'a refund is requested',
  },
];

export const MATCH_MODES: Option<MatchMode>[] = [
  { value: 'all', label: 'All' },
  { value: 'any', label: 'Any' },
];

const AMOUNT_OPERATORS: Option<OperatorId>[] = [
  { value: 'over', label: 'is over' },
  { value: 'under', label: 'is under' },
];

const CHOICE_OPERATORS: Option<OperatorId>[] = [
  { value: 'is', label: 'is' },
  { value: 'is-not', label: 'is not' },
];

const TEXT_OPERATORS: Option<OperatorId>[] = [
  { value: 'contains', label: 'contains' },
];

export const FIELDS: FieldDefinition[] = [
  {
    id: 'amount',
    label: 'Amount',
    noun: 'the amount',
    kind: 'amount',
    operators: AMOUNT_OPERATORS,
    choices: [],
    defaultValue: '100',
  },
  {
    id: 'category',
    label: 'Category',
    noun: 'the category',
    kind: 'choice',
    operators: CHOICE_OPERATORS,
    choices: [
      { value: 'travel', label: 'Travel' },
      { value: 'meals', label: 'Meals' },
      { value: 'software', label: 'Software' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'office', label: 'Office supplies' },
    ],
    defaultValue: 'travel',
  },
  {
    id: 'team',
    label: 'Team',
    noun: 'the team',
    kind: 'choice',
    operators: CHOICE_OPERATORS,
    choices: [
      { value: 'design', label: 'Design' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'sales', label: 'Sales' },
      { value: 'operations', label: 'Operations' },
    ],
    defaultValue: 'sales',
  },
  {
    id: 'merchant',
    label: 'Merchant',
    noun: 'the merchant',
    kind: 'text',
    operators: TEXT_OPERATORS,
    choices: [],
    defaultValue: '',
  },
];

export const ACTIONS: ActionDefinition[] = [
  { kind: 'require-receipt', label: 'Require a receipt', target: null },
  { kind: 'ask-approval', label: 'Ask for approval', target: 'person' },
  { kind: 'flag-review', label: 'Flag for review', target: null },
  { kind: 'post-channel', label: 'Post in a channel', target: 'channel' },
  { kind: 'decline-payment', label: 'Decline the payment', target: null },
];

export const TARGETS: Record<TargetKind, Option<string>[]> = {
  person: [
    { value: 'rosa', label: 'Rosa Ilunga' },
    { value: 'tomas', label: 'Tomás Reyes' },
    { value: 'amara', label: 'Amara Diallo' },
    { value: 'jonas', label: 'Jonas Weber' },
  ],
  channel: [
    { value: 'finance', label: '#finance' },
    { value: 'ops-alerts', label: '#ops-alerts' },
    { value: 'team-leads', label: '#team-leads' },
  ],
};

export const INITIAL_RULE: Rule = {
  trigger: 'card-payment',
  match: 'all',
  conditions: [
    { id: 'condition-1', field: 'amount', operator: 'over', value: '75' },
    {
      id: 'condition-2',
      field: 'category',
      operator: 'is-not',
      value: 'software',
    },
  ],
  actions: [
    { id: 'action-1', kind: 'require-receipt', target: '' },
    { id: 'action-2', kind: 'ask-approval', target: 'rosa' },
  ],
};
