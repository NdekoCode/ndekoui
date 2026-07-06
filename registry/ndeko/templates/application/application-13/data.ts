import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const BRAND = { name: 'Wrenfield' };

export type AgentId = 'planner' | 'researcher' | 'writer' | 'coder';

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const AGENTS: Record<AgentId, Agent> = {
  planner: { name: 'Planner', series: 1 },
  researcher: { name: 'Researcher', series: 2 },
  writer: { name: 'Writer', series: 3 },
  coder: { name: 'Coder', series: 5 },
};

/** A new session goes to the planner, which hands the work to the others. */
export const STARTING_AGENT: AgentId = 'planner';

export type ModelId =
  'claude-sonnet' | 'claude-opus' | 'gpt-mini' | 'gemini-pro';

export type ModelOption = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
};

export const MODELS: ModelOption[] = [
  { id: 'claude-sonnet', name: 'Claude Sonnet', brand: 'claude' },
  { id: 'claude-opus', name: 'Claude Opus', brand: 'claude' },
  { id: 'gpt-mini', name: 'GPT mini', brand: 'openai' },
  { id: 'gemini-pro', name: 'Gemini Pro', brand: 'gemini' },
];

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? MODELS[0];
}

export type ModeId = 'ask' | 'plan' | 'act';

export type ModeOption = {
  id: ModeId;
  label: string;
  hint: string;
};

export const MODES: ModeOption[] = [
  { id: 'ask', label: 'Ask first', hint: 'Asks before every action' },
  {
    id: 'plan',
    label: 'Plan first',
    hint: 'Writes a plan and waits for your yes',
  },
  {
    id: 'act',
    label: 'Act',
    hint: 'Works until done, asks before anything risky',
  },
];

export function modeOf(id: ModeId) {
  const mode = MODES.find((candidate) => candidate.id === id);
  return mode ?? MODES[0];
}

export type SuggestionKind = 'data' | 'writing' | 'search' | 'code';

export type Suggestion = {
  id: string;
  kind: SuggestionKind;
  title: string;
  hint: string;
  prompt: string;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'invoices',
    kind: 'data',
    title: 'Reconcile last month',
    hint: 'Invoices against the bank export',
    prompt:
      'Reconcile the March invoices with the bank export and list what does not match.',
  },
  {
    id: 'newsletter',
    kind: 'writing',
    title: 'Draft the newsletter',
    hint: 'From what shipped this month',
    prompt:
      'Draft the spring newsletter from the changelog of this month, in our usual tone.',
  },
  {
    id: 'spam',
    kind: 'search',
    title: 'Find a cause',
    hint: 'Why our emails land in spam',
    prompt:
      'Find out why our checkout emails land in spam and say what to change.',
  },
  {
    id: 'rename',
    kind: 'code',
    title: 'Rename across the code',
    hint: 'One field, every file',
    prompt:
      'Rename the price fields to amount across the API and update the tests.',
  },
];

export const DEMO_SUGGESTION = SUGGESTIONS[0];

export type Attachment = {
  id: string;
  name: string;
  bytes: number;
};

export const DEMO_ATTACHMENT: Attachment = {
  id: 'demo',
  name: 'bank-export-march.csv',
  bytes: 48_200,
};

export const MAX_ATTACHMENTS = 4;

export type RunStatus = 'queued' | 'running' | 'waiting' | 'done' | 'failed';

export type RunSeed = {
  id: string;
  agentId: AgentId;
  title: string;
  status: RunStatus;
  startedMinutesAgo: number;
  endedMinutesAgo?: number;
  costUsd: number;
  request?: string;
  failure?: string;
};

export const WAITING_RUN = 'rename';

/** Invented tasks, times and costs. The figures are illustrative. */
export const RUNS: RunSeed[] = [
  {
    id: 'couriers',
    agentId: 'researcher',
    title: 'Compare three couriers for parcels under 2 kg',
    status: 'running',
    startedMinutesAgo: 3,
    costUsd: 0.214,
  },
  {
    id: WAITING_RUN,
    agentId: 'coder',
    title: 'Rename the price fields across the API',
    status: 'waiting',
    startedMinutesAgo: 9,
    endedMinutesAgo: 2,
    costUsd: 0.482,
    request: 'Asks to run the migration on staging',
  },
  {
    id: 'returns',
    agentId: 'writer',
    title: 'Draft the returns page',
    status: 'done',
    startedMinutesAgo: 26,
    endedMinutesAgo: 22,
    costUsd: 0.188,
  },
  {
    id: 'prices',
    agentId: 'researcher',
    title: 'Check our prices against the supplier sheet',
    status: 'failed',
    startedMinutesAgo: 41,
    endedMinutesAgo: 40,
    costUsd: 0.061,
    failure: 'The supplier sheet has no price column',
  },
];

/** The start screen lists the latest runs only: a new one pushes the oldest out. */
export const RUNS_SHOWN = 4;

export type Day = 'Today' | 'Yesterday';

export type PastSession = {
  id: string;
  day: Day;
  title: string;
  prompt: string;
};

export const DAYS: Day[] = ['Today', 'Yesterday'];

export const SESSIONS: PastSession[] = [
  {
    id: 'couriers',
    day: 'Today',
    title: 'Couriers under 2 kg',
    prompt:
      'Compare three couriers for parcels under 2 kg, by price and delay.',
  },
  {
    id: 'rename',
    day: 'Today',
    title: 'Price fields in the API',
    prompt:
      'Rename the price fields to amount across the API and update the tests.',
  },
  {
    id: 'returns',
    day: 'Today',
    title: 'Returns page',
    prompt: 'Draft the returns page from the policy we agreed last week.',
  },
  {
    id: 'supplier',
    day: 'Yesterday',
    title: 'Prices against the supplier',
    prompt: 'Check our prices against the supplier sheet and flag the gaps.',
  },
  {
    id: 'onboarding',
    day: 'Yesterday',
    title: 'Onboarding emails',
    prompt: 'Rewrite the three onboarding emails so each asks for one thing.',
  },
  {
    id: 'releases',
    day: 'Yesterday',
    title: 'Weekly releases',
    prompt: 'Plan the move from monthly to weekly releases in six steps.',
  },
];

export const TITLE_WORDS = 5;

export const EMPTY_PROMPT_HINT =
  'Say what you need, or pick one of the tasks under the field';

export const FULL_HINT = `${MAX_ATTACHMENTS} files fit in one prompt. Remove one to add another`;
