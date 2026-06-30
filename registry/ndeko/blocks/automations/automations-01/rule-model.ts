import {
  ACTIONS,
  FIELDS,
  TARGETS,
  TRIGGERS,
  type Action,
  type ActionDefinition,
  type ActionKind,
  type Condition,
  type FieldDefinition,
  type FieldId,
  type Option,
  type Rule,
} from './data';

export type RuleErrors = Record<string, string>;

export const ACTIONS_ERROR_KEY = 'actions';

const CURRENCY = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const MISSING_VALUE = '…';

export function fieldOf(id: FieldId): FieldDefinition {
  const field = FIELDS.find((candidate) => candidate.id === id);
  if (field) {
    return field;
  }
  return FIELDS[0];
}

export function actionDefinitionOf(kind: ActionKind): ActionDefinition {
  const action = ACTIONS.find((candidate) => candidate.kind === kind);
  if (action) {
    return action;
  }
  return ACTIONS[0];
}

function labelIn(options: Option<string>[], value: string) {
  const option = options.find((candidate) => candidate.value === value);
  if (option) {
    return option.label;
  }
  return MISSING_VALUE;
}

export function targetOptionsOf(kind: ActionKind) {
  const definition = actionDefinitionOf(kind);
  if (definition.target === null) {
    return [];
  }
  return TARGETS[definition.target];
}

export function firstTargetOf(kind: ActionKind) {
  const options = targetOptionsOf(kind);
  if (options.length === 0) {
    return '';
  }
  return options[0].value;
}

export function digitsOf(text: string) {
  return text.replace(/\D/g, '');
}

function amountLabelOf(value: string) {
  if (!value) {
    return MISSING_VALUE;
  }
  const amount = Number(value);
  return CURRENCY.format(amount);
}

function valueLabelOf(condition: Condition, field: FieldDefinition) {
  if (field.kind === 'amount') {
    return amountLabelOf(condition.value);
  }
  if (field.kind === 'choice') {
    return labelIn(field.choices, condition.value);
  }
  const trimmed = condition.value.trim();
  if (!trimmed) {
    return MISSING_VALUE;
  }
  return `“${trimmed}”`;
}

export function conditionPhraseOf(condition: Condition) {
  const field = fieldOf(condition.field);
  const operator = labelIn(field.operators, condition.operator);
  const value = valueLabelOf(condition, field);
  return `${field.noun} ${operator} ${value}`;
}

export function actionPhraseOf(action: Action) {
  const options = targetOptionsOf(action.kind);
  const target = labelIn(options, action.target);
  if (action.kind === 'ask-approval') {
    return `ask ${target} to approve`;
  }
  if (action.kind === 'post-channel') {
    return `post in ${target}`;
  }
  if (action.kind === 'flag-review') {
    return 'flag it for review';
  }
  if (action.kind === 'decline-payment') {
    return 'decline the payment';
  }
  return 'require a receipt';
}

function listOf(phrases: string[], joiner: string) {
  if (phrases.length <= 1) {
    return phrases.join('');
  }
  const leading = phrases.slice(0, -1);
  const head = leading.join(', ');
  const last = phrases[phrases.length - 1];
  return `${head} ${joiner} ${last}`;
}

function joinerOf(rule: Rule) {
  if (rule.match === 'any') {
    return 'or';
  }
  return 'and';
}

function triggerPhraseOf(rule: Rule) {
  const trigger = TRIGGERS.find((option) => option.value === rule.trigger);
  if (trigger) {
    return trigger.phrase;
  }
  return MISSING_VALUE;
}

function actionsPhraseOf(rule: Rule) {
  if (rule.actions.length === 0) {
    return 'nothing happens yet';
  }
  const phrases = rule.actions.map(actionPhraseOf);
  return listOf(phrases, 'and');
}

/** The rule read back as one sentence, so the person can check it says what they mean. */
export function sentenceOf(rule: Rule) {
  const trigger = triggerPhraseOf(rule);
  const actions = actionsPhraseOf(rule);
  if (rule.conditions.length === 0) {
    return `When ${trigger}, ${actions}.`;
  }
  const conditionPhrases = rule.conditions.map(conditionPhraseOf);
  const conditions = listOf(conditionPhrases, joinerOf(rule));
  return `When ${trigger}, if ${conditions}, ${actions}.`;
}

function conditionErrorOf(condition: Condition) {
  const field = fieldOf(condition.field);
  if (field.kind === 'amount') {
    const amount = Number(condition.value);
    if (amount > 0) {
      return null;
    }
    return 'Enter an amount above €0';
  }
  if (field.kind === 'text') {
    const hasText = condition.value.trim().length > 0;
    if (hasText) {
      return null;
    }
    return 'Enter part of the merchant name';
  }
  return null;
}

export function errorsOf(rule: Rule) {
  const errors: RuleErrors = {};
  for (const condition of rule.conditions) {
    const error = conditionErrorOf(condition);
    if (error) {
      errors[condition.id] = error;
    }
  }
  if (rule.actions.length === 0) {
    errors[ACTIONS_ERROR_KEY] =
      'Add at least one action, or the rule does nothing';
  }
  return errors;
}

export function hasErrors(errors: RuleErrors) {
  return Object.keys(errors).length > 0;
}

export function sameRule(first: Rule, second: Rule) {
  const firstText = JSON.stringify(first);
  const secondText = JSON.stringify(second);
  return firstText === secondText;
}

export function conditionForField(id: string, fieldId: FieldId): Condition {
  const field = fieldOf(fieldId);
  return {
    id,
    field: fieldId,
    operator: field.operators[0].value,
    value: field.defaultValue,
  };
}

export function actionForKind(id: string, kind: ActionKind): Action {
  return { id, kind, target: firstTargetOf(kind) };
}

/** The first field the conditions do not test yet, so a new row starts on something useful. */
export function unusedFieldOf(conditions: Condition[]) {
  const usedFields = conditions.map((condition) => condition.field);
  const unused = FIELDS.find((field) => !usedFields.includes(field.id));
  if (unused) {
    return unused.id;
  }
  return FIELDS[0].id;
}

/** The first kind the rule does not use yet, so a new action row starts on something useful. */
export function unusedActionKindOf(actions: Action[]) {
  const usedKinds = actions.map((action) => action.kind);
  const unused = ACTIONS.find(
    (definition) => !usedKinds.includes(definition.kind)
  );
  if (unused) {
    return unused.kind;
  }
  return ACTIONS[0].kind;
}

export function replacedById<Item extends { id: string }>(
  items: Item[],
  next: Item
) {
  return items.map((item) => {
    if (item.id === next.id) {
      return next;
    }
    return item;
  });
}

export function withoutId<Item extends { id: string }>(
  items: Item[],
  id: string
) {
  return items.filter((item) => item.id !== id);
}
