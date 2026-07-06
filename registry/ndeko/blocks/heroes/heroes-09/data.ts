import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type AgentId =
  'planner' | 'researcher' | 'writer' | 'reviewer' | 'coder';

export type Agent = {
  id: AgentId;
  role: string;
  series: SeriesSlot;
};

/** The word of the headline changes from one agent to another; the id counts the changes. */
export type Change = {
  id: number;
  from: AgentId;
  to: AgentId;
};

export const HERO = {
  titleStart: 'Hand the next task to your',
  description:
    'Each agent owns one kind of work and shows its steps as it goes. You read what it made before anything leaves your workspace.',
  primaryAction: 'Meet the agents',
  secondaryAction: 'See a run step by step',
  agentsLabel: 'Agents',
};

export const AGENTS: Agent[] = [
  { id: 'planner', role: 'Planner', series: 1 },
  { id: 'researcher', role: 'Researcher', series: 2 },
  { id: 'writer', role: 'Writer', series: 3 },
  { id: 'reviewer', role: 'Reviewer', series: 4 },
  { id: 'coder', role: 'Coder', series: 5 },
];

export const FIRST_AGENT: AgentId = 'planner';

export const INITIAL_CHANGE: Change = {
  id: 0,
  from: FIRST_AGENT,
  to: FIRST_AGENT,
};
