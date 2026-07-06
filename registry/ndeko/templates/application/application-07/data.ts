import type {
  ApprovalRequest,
  PlanStep,
  RunAgent,
  SeriesSlot,
} from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const BRAND = { name: 'Sundermere' };

export const RUN_ID = 'SM-0412';

export const RUN_TITLE = 'March close, three depots';

export const RUN_NOTE = 'Kinshasa, Lubumbashi and Goma';

/** The money the run may spend. The figure is illustrative. */
export const BUDGET_USD = 1;

export const ALERT_SHARE = 0.8;

/** The time axis of the waterfall: the demonstration run ends well inside it. */
export const WINDOW_MS = 30_000;

export type AgentId =
  'coordinator' | 'collector' | 'matcher' | 'writer' | 'reviewer';

export const AGENT_ORDER: AgentId[] = [
  'coordinator',
  'collector',
  'matcher',
  'writer',
  'reviewer',
];

const LEAD: AgentId = 'coordinator';

function workerOf(
  id: AgentId,
  name: string,
  series: SeriesSlot,
  role: string,
  model: string
): RunAgent {
  return {
    id,
    name,
    series,
    status: 'idle',
    role,
    model,
    parentId: LEAD,
    costUsd: 0,
  };
}

export const AGENTS: RunAgent[] = [
  {
    id: 'coordinator',
    name: 'Coordinator',
    series: 1,
    status: 'idle',
    role: 'Leads the run',
    model: 'Claude Opus',
    costUsd: 0,
  },
  workerOf('collector', 'Collector', 2, 'Reads the exports', 'Claude Haiku'),
  workerOf('matcher', 'Matcher', 4, 'Matches payments', 'Claude Sonnet'),
  workerOf('writer', 'Writer', 3, 'Drafts the note', 'Claude Sonnet'),
  workerOf('reviewer', 'Reviewer', 5, 'Checks the figures', 'Claude Opus'),
];

export type StepId = 'collect' | 'match' | 'draft' | 'review' | 'post';

export type PlanSeed = {
  id: StepId;
  title: string;
  ownerId: AgentId;
  /** How long a step usually takes: its part of the time strip fills over this long. */
  expectedMs: number;
};

export const PLAN_SEEDS: PlanSeed[] = [
  {
    id: 'collect',
    title: 'Collect the depot exports',
    ownerId: 'collector',
    expectedMs: 4000,
  },
  {
    id: 'match',
    title: 'Match payments to invoices',
    ownerId: 'matcher',
    expectedMs: 5000,
  },
  {
    id: 'draft',
    title: 'Draft the close note',
    ownerId: 'writer',
    expectedMs: 3600,
  },
  {
    id: 'review',
    title: 'Review the figures',
    ownerId: 'reviewer',
    expectedMs: 2600,
  },
  {
    id: 'post',
    title: 'Post the journal entries',
    ownerId: 'coordinator',
    expectedMs: 3200,
  },
];

export const PLAN_STEPS: PlanStep[] = PLAN_SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  status: 'upcoming',
}));

const FALLBACK_SEED = PLAN_SEEDS[0];

export function planSeedOf(id: string) {
  const seed = PLAN_SEEDS.find((candidate) => candidate.id === id);
  return seed ?? FALLBACK_SEED;
}

export const AGENT_TASK: Record<string, string> = {
  coordinator: 'Planning the close',
  collector: 'Reading the three depot exports',
  matcher: 'Matching 412 payments to invoices',
  writer: 'Drafting the close note',
  reviewer: 'Checking totals against the checklist',
};

export const POSTING_TASK = 'Posting the journal entries';

export type ToolId = 'drive' | 'postgres' | 'notion' | 'linear' | 'ledger';

export type ToolMeta = {
  id: ToolId;
  name: string;
  /** A tool with no known mark wears a plain key cap. */
  brand?: BrandSlug;
};

export const TOOL_META: ToolMeta[] = [
  { id: 'drive', name: 'Google Drive', brand: 'googledrive' },
  { id: 'postgres', name: 'PostgreSQL', brand: 'postgresql' },
  { id: 'notion', name: 'Notion', brand: 'notion' },
  { id: 'linear', name: 'Linear', brand: 'linear' },
  { id: 'ledger', name: 'Ledger' },
];

const FALLBACK_TOOL = TOOL_META[0];

export function toolMetaOf(id: string) {
  const tool = TOOL_META.find((candidate) => candidate.id === id);
  return tool ?? FALLBACK_TOOL;
}

export type CallSeed = {
  id: string;
  toolId: ToolId;
  label: string;
  agentId: AgentId;
  stepId: StepId;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

/** Invented exports, counts and costs. The figures are illustrative. */
export const CALLS: CallSeed[] = [
  {
    id: 'c1',
    toolId: 'drive',
    label: 'Read the Kinshasa export',
    agentId: 'collector',
    stepId: 'collect',
    inputTokens: 9800,
    outputTokens: 700,
    costUsd: 0.021,
  },
  {
    id: 'c2',
    toolId: 'drive',
    label: 'Read the Lubumbashi export',
    agentId: 'collector',
    stepId: 'collect',
    inputTokens: 8900,
    outputTokens: 650,
    costUsd: 0.019,
  },
  {
    id: 'c3',
    toolId: 'drive',
    label: 'Read the Goma export',
    agentId: 'collector',
    stepId: 'collect',
    inputTokens: 8100,
    outputTokens: 600,
    costUsd: 0.017,
  },
  {
    id: 'c4',
    toolId: 'postgres',
    label: 'Match 412 payments',
    agentId: 'matcher',
    stepId: 'match',
    inputTokens: 21500,
    outputTokens: 2200,
    costUsd: 0.214,
  },
  {
    id: 'c5',
    toolId: 'notion',
    label: 'Write the close note',
    agentId: 'writer',
    stepId: 'draft',
    inputTokens: 12400,
    outputTokens: 3100,
    costUsd: 0.131,
  },
  {
    id: 'c6',
    toolId: 'linear',
    label: 'Read the close checklist',
    agentId: 'reviewer',
    stepId: 'review',
    inputTokens: 15200,
    outputTokens: 1200,
    costUsd: 0.158,
  },
  {
    id: 'c7',
    toolId: 'ledger',
    label: 'Post 3 journal entries',
    agentId: 'coordinator',
    stepId: 'post',
    inputTokens: 6800,
    outputTokens: 900,
    costUsd: 0.152,
  },
];

const FALLBACK_CALL = CALLS[0];

export function callSeedOf(id: string) {
  const seed = CALLS.find((candidate) => candidate.id === id);
  return seed ?? FALLBACK_CALL;
}

export const PLAN_USAGE = {
  inputTokens: 5400,
  outputTokens: 1100,
  costUsd: 0.118,
};

/** What an agent has spent once a call of the run ends: the running sum, worked out once. */
function agentCostsAfterCalls() {
  const spent: Record<string, number> = { coordinator: PLAN_USAGE.costUsd };
  const after: Record<string, number> = {};
  for (const call of CALLS) {
    const before = spent[call.agentId] ?? 0;
    const total = before + call.costUsd;
    spent[call.agentId] = total;
    after[call.id] = total;
  }
  return after;
}

export const AGENT_COST_AFTER = agentCostsAfterCalls();

export const JOURNAL_REQUEST: ApprovalRequest = {
  id: 'journal',
  title: 'Post 3 journal entries to the ledger',
  risk: 'medium',
  status: 'pending',
  agentId: 'coordinator',
  detail:
    'Changes the books of March in all three depots. A credit entry can reverse it.',
  command: 'ledger post --period 2026-03 --depots kin,lub,goma --entries 3',
  scope: 'once',
};

export type NodePlace = {
  x: number;
  y: number;
};

/** Places on the graph, as a share of its width and of its height. */
export const AGENT_PLACE: Record<AgentId, NodePlace> = {
  coordinator: { x: 50, y: 14 },
  collector: { x: 14, y: 52 },
  matcher: { x: 38, y: 52 },
  writer: { x: 62, y: 52 },
  reviewer: { x: 86, y: 52 },
};

export const TOOL_PLACE: Record<ToolId, NodePlace> = {
  drive: { x: 14, y: 85 },
  postgres: { x: 38, y: 85 },
  notion: { x: 62, y: 85 },
  linear: { x: 86, y: 85 },
  ledger: { x: 86, y: 14 },
};

/** The agent each tool belongs to on the graph: the edge to it starts there. */
export const TOOL_OWNER: Record<ToolId, AgentId> = {
  drive: 'collector',
  postgres: 'matcher',
  notion: 'writer',
  linear: 'reviewer',
  ledger: 'coordinator',
};

export const BUS_Y = 33;

export const DECLINED_LINE =
  'Not posted. The entries stay in draft and the run stopped here';

export const POSTED_LINE = '3 journal entries posted to the ledger';
