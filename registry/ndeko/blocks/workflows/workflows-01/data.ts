import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const WORKFLOW_NAME = 'Signup routing';

export type StepKind = 'trigger' | 'agent' | 'tool' | 'condition';

export const KIND_WORD: Record<StepKind, string> = {
  trigger: 'Trigger',
  agent: 'Agent',
  tool: 'Tool',
  condition: 'Condition',
};

export type OutputId = 'next' | 'yes' | 'no';

export const OUTPUT_IDS: OutputId[] = ['next', 'yes', 'no'];

export const OUTPUT_WORD: Record<OutputId, string> = {
  next: 'Next',
  yes: 'Yes',
  no: 'No',
};

/** A condition leaves by Yes or by No. Every other step has one way out. */
export const OUTPUTS_OF: Record<StepKind, OutputId[]> = {
  trigger: ['next'],
  agent: ['next'],
  tool: ['next'],
  condition: ['yes', 'no'],
};

export type FieldId =
  'source' | 'event' | 'model' | 'instructions' | 'app' | 'action' | 'rule';

export type Choice = {
  value: string;
  label: string;
  brand?: BrandSlug;
};

export type FieldSpec = {
  id: FieldId;
  label: string;
  control: 'text' | 'textarea' | 'select';
  placeholder: string;
  choices?: Choice[];
  /** Said under the field and on the step while the field is empty: a workflow cannot be published without it. */
  missingLine: string;
};

const SOURCES: Choice[] = [
  { value: 'stripe', label: 'Stripe', brand: 'stripe' },
  { value: 'hubspot', label: 'HubSpot', brand: 'hubspot' },
  { value: 'intercom', label: 'Intercom', brand: 'intercom' },
];

const EVENTS: Choice[] = [
  { value: 'Account created', label: 'Account created' },
  { value: 'Plan changed', label: 'Plan changed' },
  { value: 'Trial ended', label: 'Trial ended' },
];

const MODELS: Choice[] = [
  { value: 'claude', label: 'Claude', brand: 'claude' },
  { value: 'openai', label: 'ChatGPT', brand: 'openai' },
  { value: 'gemini', label: 'Gemini', brand: 'gemini' },
  { value: 'mistral', label: 'Mistral', brand: 'mistral' },
];

const APPS: Choice[] = [
  { value: 'hubspot', label: 'HubSpot', brand: 'hubspot' },
  { value: 'gmail', label: 'Gmail', brand: 'gmail' },
  { value: 'linear', label: 'Linear', brand: 'linear' },
  { value: 'notion', label: 'Notion', brand: 'notion' },
];

export const FIELDS_OF: Record<StepKind, FieldSpec[]> = {
  trigger: [
    {
      id: 'source',
      label: 'Source',
      control: 'select',
      placeholder: 'Choose a source',
      choices: SOURCES,
      missingLine: 'Choose where the workflow starts',
    },
    {
      id: 'event',
      label: 'Event',
      control: 'select',
      placeholder: 'Choose an event',
      choices: EVENTS,
      missingLine: 'Choose the event that starts it',
    },
  ],
  agent: [
    {
      id: 'model',
      label: 'Model',
      control: 'select',
      placeholder: 'Choose a model',
      choices: MODELS,
      missingLine: 'Choose a model',
    },
    {
      id: 'instructions',
      label: 'Instructions',
      control: 'textarea',
      placeholder: 'What should the agent do?',
      missingLine: 'Tell the agent what to do',
    },
  ],
  tool: [
    {
      id: 'app',
      label: 'App',
      control: 'select',
      placeholder: 'Choose an app',
      choices: APPS,
      missingLine: 'Choose the app to act in',
    },
    {
      id: 'action',
      label: 'Action',
      control: 'text',
      placeholder: 'Create a deal',
      missingLine: 'Say what the tool does',
    },
  ],
  condition: [
    {
      id: 'rule',
      label: 'Rule',
      control: 'text',
      placeholder: 'seats is 20 or more',
      missingLine: 'Write the rule to check',
    },
  ],
};

export type StepValues = Partial<Record<FieldId, string>>;

export type Step = {
  id: string;
  kind: StepKind;
  name: string;
  /** Its place along the flow and across it, in grid units. The layout turns them into pixels. */
  level: number;
  lane: number;
  /** The colour of an agent, kept when the step is renamed. */
  series?: SeriesSlot;
  values: StepValues;
};

export type Connection = {
  from: string;
  output: OutputId;
  to: string;
};

/**
 * An invented workflow. The agent has no instructions yet and nothing leaves the No output: the
 * three problems the builder counts when it opens.
 */
export const STEPS: Step[] = [
  {
    id: 'signup',
    kind: 'trigger',
    name: 'New signup',
    level: 0,
    lane: 2,
    values: { source: 'stripe', event: 'Account created' },
  },
  {
    id: 'enrich',
    kind: 'agent',
    name: 'Enrich the account',
    level: 12,
    lane: 2,
    series: 2,
    values: { model: 'claude', instructions: '' },
  },
  {
    id: 'size',
    kind: 'condition',
    name: 'Team of 20 or more?',
    level: 24,
    lane: 2,
    values: { rule: 'seats is 20 or more' },
  },
  {
    id: 'deal',
    kind: 'tool',
    name: 'Create a deal',
    level: 38,
    lane: -1,
    values: { app: 'hubspot', action: 'Create a deal in Inbound' },
  },
  {
    id: 'welcome',
    kind: 'tool',
    name: 'Send the welcome',
    level: 38,
    lane: 5,
    values: { app: 'gmail', action: 'Send the Welcome template' },
  },
];

export const CONNECTIONS: Connection[] = [
  { from: 'signup', output: 'next', to: 'enrich' },
  { from: 'enrich', output: 'next', to: 'size' },
  { from: 'size', output: 'yes', to: 'deal' },
];

/** What the demonstration types into the agent that has no instructions. */
export const DEMO_INSTRUCTIONS = 'Look up the company and count its seats';

export function choiceOf(spec: FieldSpec, value: string | undefined) {
  return spec.choices?.find((choice) => choice.value === value);
}

/** A step whose name was cleared still has to be called something on the canvas and in a sentence. */
export function shownNameOf(step: Step) {
  const name = step.name.trim();
  if (name === '') {
    return 'Unnamed step';
  }
  return name;
}
