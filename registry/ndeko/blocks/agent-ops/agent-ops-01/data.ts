import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const TEAM_NAME = 'Solway Books';

export type PeriodId = 'today' | 'week';

export const PERIODS: { value: PeriodId; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
];

export type ModelId =
  'claude-sonnet' | 'claude-haiku' | 'gpt-mini' | 'gemini-pro';

export type Model = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
  /** Fixed per model, so a colour means the same model in the bar and in the fleet. */
  series: SeriesSlot;
};

/** Families without a version number. */
export const MODELS: Model[] = [
  { id: 'claude-sonnet', name: 'Claude Sonnet', brand: 'claude', series: 1 },
  { id: 'claude-haiku', name: 'Claude Haiku', brand: 'claude', series: 2 },
  { id: 'gpt-mini', name: 'GPT mini', brand: 'openai', series: 3 },
  { id: 'gemini-pro', name: 'Gemini Pro', brand: 'gemini', series: 4 },
];

export type PeriodBase = {
  runs: number;
  failed: number;
  spendUsd: Record<ModelId, number>;
};

/** What the period held before this session. Illustrative. */
export const PERIOD_BASE: Record<PeriodId, PeriodBase> = {
  today: {
    runs: 48,
    failed: 2,
    spendUsd: {
      'claude-sonnet': 8.42,
      'claude-haiku': 2.16,
      'gpt-mini': 3.08,
      'gemini-pro': 4.74,
    },
  },
  week: {
    runs: 312,
    failed: 11,
    spendUsd: {
      'claude-sonnet': 58.3,
      'claude-haiku': 14.9,
      'gpt-mini': 21.2,
      'gemini-pro': 32.5,
    },
  },
};

export type AgentId =
  | 'planner'
  | 'researcher'
  | 'rate-reader'
  | 'writer'
  | 'reviewer'
  | 'coder'
  | 'test-runner'
  | 'log-reader';

export type Agent = {
  id: AgentId;
  name: string;
  initials: string;
  model: ModelId;
  parentId?: AgentId;
};

export const AGENTS: Agent[] = [
  { id: 'planner', name: 'Planner', initials: 'P', model: 'gemini-pro' },
  {
    id: 'researcher',
    name: 'Researcher',
    initials: 'R',
    model: 'claude-sonnet',
  },
  {
    id: 'rate-reader',
    name: 'Rate reader',
    initials: 'RR',
    model: 'claude-haiku',
    parentId: 'researcher',
  },
  { id: 'writer', name: 'Writer', initials: 'W', model: 'gpt-mini' },
  { id: 'reviewer', name: 'Reviewer', initials: 'RV', model: 'claude-sonnet' },
  { id: 'coder', name: 'Coder', initials: 'C', model: 'claude-sonnet' },
  {
    id: 'test-runner',
    name: 'Test runner',
    initials: 'TR',
    model: 'claude-haiku',
    parentId: 'coder',
  },
  {
    id: 'log-reader',
    name: 'Log reader',
    initials: 'LR',
    model: 'claude-haiku',
    parentId: 'coder',
  },
];

export type ApprovalId = 'send-policy' | 'run-migration';

export type Approval = {
  id: ApprovalId;
  agentId: AgentId;
  title: string;
  detail: string;
  /** What the agent's row says while it waits, once approved and once denied. */
  waitingTask: string;
  approvedTask: string;
  deniedTask: string;
};

export const APPROVALS: Record<ApprovalId, Approval> = {
  'send-policy': {
    id: 'send-policy',
    agentId: 'reviewer',
    title: 'Send the refund policy update to 212 customers',
    detail: 'One email from support@solwaybooks.example',
    waitingTask: 'Waits for your yes before it sends the update',
    approvedTask: 'Sending the refund policy update',
    deniedTask: 'Stopped: you denied the send',
  },
  'run-migration': {
    id: 'run-migration',
    agentId: 'coder',
    title: 'Run the rounding migration on the staging database',
    detail: 'Changes 3 columns in orders and can be rolled back',
    waitingTask: 'Waits for your yes before it touches staging',
    approvedTask: 'Running the migration on staging',
    deniedTask: 'Stopped: you denied the migration',
  },
};

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? MODELS[0];
}

export function agentOf(id: AgentId) {
  const agent = AGENTS.find((candidate) => candidate.id === id);
  return agent ?? AGENTS[0];
}

export function subAgentsOf(id: AgentId) {
  return AGENTS.filter((agent) => agent.parentId === id);
}

export const MAIN_AGENTS = AGENTS.filter(
  (agent) => agent.parentId === undefined
);
