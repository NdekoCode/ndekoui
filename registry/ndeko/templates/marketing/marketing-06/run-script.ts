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

import { AGENT, RUN_TITLE } from './run-data';

/** Added idle and set running by the first batch, so the run stamps its start. */
const RECONCILER: RunAgent = {
  id: AGENT.id,
  name: AGENT.name,
  series: 1,
  status: 'idle',
};

const PLAN: PlanStep[] = [
  {
    id: 'read',
    title: 'Read the March payouts and bank lines',
    status: 'upcoming',
  },
  {
    id: 'match',
    title: 'Match them to the open invoices',
    status: 'upcoming',
  },
  {
    id: 'draft',
    title: 'Draft the journal entries for review',
    status: 'upcoming',
  },
];

export const INITIAL: RunSnapshot = emptyRun({
  id: 'march-close',
  title: RUN_TITLE,
  agents: [RECONCILER],
  plan: PLAN,
});

/** A plan of three steps that tick in turn, with one call to Stripe and one to QuickBooks on the way. */
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
      id: 'payouts',
      tool: 'stripe',
      label: 'List the payouts of March',
      status: 'running',
      agentId: AGENT.id,
    },
  }),
  batch(
    1700,
    {
      type: 'call.updated',
      id: 'payouts',
      patch: { status: 'done', output: '412 payouts to match' },
    },
    { type: 'step.updated', id: 'read', patch: { status: 'done' } },
    { type: 'step.updated', id: 'match', patch: { status: 'running' } }
  ),
  batch(700, {
    type: 'call.started',
    call: {
      id: 'invoices',
      tool: 'quickbooks',
      label: 'Match them to the open invoices',
      status: 'running',
      agentId: AGENT.id,
    },
  }),
  batch(
    1600,
    {
      type: 'call.updated',
      id: 'invoices',
      patch: { status: 'done', output: '398 matched, 14 left for you' },
    },
    { type: 'step.updated', id: 'match', patch: { status: 'done' } },
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
