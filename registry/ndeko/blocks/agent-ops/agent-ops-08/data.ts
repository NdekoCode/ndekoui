import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const RUN_TITLE = 'Autumn catalogue launch';

export type AgentId =
  'planner' | 'researcher' | 'writer' | 'reviewer' | 'coder';

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const AGENTS: Record<AgentId, Agent> = {
  planner: { name: 'Planner', series: 1 },
  researcher: { name: 'Researcher', series: 2 },
  writer: { name: 'Writer', series: 3 },
  reviewer: { name: 'Reviewer', series: 4 },
  coder: { name: 'Coder', series: 5 },
};

export type LaneId = 'running' | 'review' | 'done';

export type Lane = {
  id: LaneId;
  label: string;
  /** Said in an empty lane, which still takes a drop. */
  emptyLine: string;
};

export const LANES: Lane[] = [
  {
    id: 'running',
    label: 'Running',
    emptyLine: 'No agent is working. Drop a task here to send it back',
  },
  {
    id: 'review',
    label: 'Needs review',
    emptyLine: 'Nothing waits on you',
  },
  {
    id: 'done',
    label: 'Done',
    emptyLine: 'Approved tasks land here',
  },
];

export function laneLabelOf(id: LaneId) {
  const lane = LANES.find((candidate) => candidate.id === id);
  return lane?.label ?? '';
}

export type TaskSeed = {
  id: string;
  agentId: AgentId;
  title: string;
  lane: LaneId;
  costUsd: number;
  /** Minutes before the page loaded. */
  startedAgo: number;
  endedAgo?: number;
  /** What the agent asks a person to approve once its work is ready. */
  request: string;
};

/** Invented tasks and costs. The figures are illustrative. */
export const TASKS: TaskSeed[] = [
  {
    id: 'couriers',
    agentId: 'researcher',
    title: 'Compare three couriers for parcels under 2 kg',
    lane: 'running',
    costUsd: 0.412,
    startedAgo: 12,
    request: 'Share the comparison with the operations team',
  },
  {
    id: 'returns-page',
    agentId: 'writer',
    title: 'Draft the returns page',
    lane: 'running',
    costUsd: 0.188,
    startedAgo: 4,
    request: 'Publish the draft to the help center',
  },
  {
    id: 'tax-rounding',
    agentId: 'coder',
    title: 'Fix the rounding in the tax step',
    lane: 'running',
    costUsd: 1.204,
    startedAgo: 21,
    request: 'Merge the fix into main',
  },
  {
    id: 'contract',
    agentId: 'reviewer',
    title: 'Summarise the supplier contract',
    lane: 'review',
    costUsd: 0.356,
    startedAgo: 9,
    endedAgo: 2,
    request: 'Send the summary to legal@solwaybooks.example',
  },
  {
    id: 'catalogue-plan',
    agentId: 'planner',
    title: 'Plan the catalogue in six steps',
    lane: 'done',
    costUsd: 0.884,
    startedAgo: 31,
    endedAgo: 14,
    request: 'Share the plan with the team',
  },
];
