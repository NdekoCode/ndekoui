import type { RunAgent } from '@/registry/ndeko/lib/agent-run';

export const RUN_TITLE = 'Q3 vendor review for Brightmoor Supply';

export const PLANNER: RunAgent = {
  id: 'planner',
  name: 'Planner',
  series: 1,
  status: 'idle',
  role: 'Lead',
  model: 'Claude Opus',
};

export const RESEARCHER: RunAgent = {
  id: 'researcher',
  name: 'Researcher',
  series: 2,
  status: 'idle',
  model: 'Claude Sonnet',
  parentId: 'planner',
};

export const WRITER: RunAgent = {
  id: 'writer',
  name: 'Writer',
  series: 3,
  status: 'idle',
  model: 'Claude Haiku',
  parentId: 'planner',
};

export const REVIEWER: RunAgent = {
  id: 'reviewer',
  name: 'Reviewer',
  series: 4,
  status: 'idle',
  model: 'Claude Sonnet',
  parentId: 'planner',
};

export const CODER: RunAgent = {
  id: 'coder',
  name: 'Coder',
  series: 5,
  status: 'idle',
  model: 'Claude Opus',
  parentId: 'planner',
};

export const CREW: RunAgent[] = [PLANNER, RESEARCHER, WRITER, REVIEWER, CODER];

export const PAGE_ERROR = 'The pricing page refused the reader (403)';
