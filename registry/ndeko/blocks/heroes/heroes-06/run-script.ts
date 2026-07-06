import type { SessionConfig } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  type PlanStep,
  type RunAgent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import {
  applyBatchAt,
  batch,
  reduceBatch,
  restingOf,
  type RunBatch,
  type RunStep,
} from '@/registry/ndeko/lib/run-session';

import { AGENT, RUN_TITLE } from './data';

/** Added idle and set running by the first batch, so the run stamps its start. */
const WRITER: RunAgent = {
  id: AGENT.id,
  name: AGENT.name,
  series: 1,
  status: 'idle',
};

const PLAN: PlanStep[] = [
  {
    id: 'read',
    title: 'Read the pull requests merged since 4.1',
    status: 'upcoming',
  },
  { id: 'group', title: 'Group the changes by area', status: 'upcoming' },
  {
    id: 'draft',
    title: 'Draft the notes and open a pull request',
    status: 'upcoming',
  },
];

export const INITIAL: RunSnapshot = emptyRun({
  id: 'release-notes',
  title: RUN_TITLE,
  agents: [WRITER],
  plan: PLAN,
});

/** A plan of three steps that tick in turn, with one call to GitHub and one to Linear on the way. */
const SCRIPT: RunStep[] = [
  batch(
    700,
    { type: 'run.started' },
    { type: 'agent.updated', id: AGENT.id, patch: { status: 'running' } },
    { type: 'step.updated', id: 'read', patch: { status: 'running' } }
  ),
  batch(600, {
    type: 'call.started',
    call: {
      id: 'merged',
      tool: 'github',
      label: 'List the pull requests merged since 4.1',
      status: 'running',
      agentId: AGENT.id,
    },
  }),
  batch(
    1700,
    {
      type: 'call.updated',
      id: 'merged',
      patch: { status: 'done', output: '38 pull requests across 6 areas' },
    },
    { type: 'step.updated', id: 'read', patch: { status: 'done' } },
    { type: 'step.updated', id: 'group', patch: { status: 'running' } }
  ),
  batch(700, {
    type: 'call.started',
    call: {
      id: 'issues',
      tool: 'linear',
      label: 'Match them to the issues they close',
      status: 'running',
      agentId: AGENT.id,
    },
  }),
  batch(
    1600,
    {
      type: 'call.updated',
      id: 'issues',
      patch: { status: 'done', output: '31 issues closed, 4 still open' },
    },
    { type: 'step.updated', id: 'group', patch: { status: 'done' } },
    { type: 'step.updated', id: 'draft', patch: { status: 'running' } }
  ),
  batch(
    1800,
    { type: 'step.updated', id: 'draft', patch: { status: 'done' } },
    { type: 'agent.updated', id: AGENT.id, patch: { status: 'done' } },
    { type: 'run.finished', status: 'done' }
  ),
];

/** Under reduced motion the run rests finished, with both results to read. */
const RESTING = restingOf(INITIAL, SCRIPT, applyBatchAt);

const LOOP_AFTER_MS = 3800;

export const SESSION: SessionConfig<RunSnapshot, RunBatch> = {
  reducer: reduceBatch,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};
