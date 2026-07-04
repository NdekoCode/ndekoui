import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import {
  emptyRun,
  type ApprovalRequest,
  type PlanStep,
  type RunEvent,
  type StepStatus,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';

export const STAGE_REQUEST =
  'Check what Brightmoor billed us this quarter against their price list, and ask for a credit if they overcharged.';

export const STAGE_TITLE = 'Quarterly vendor review for Brightmoor Supply';

export const SEND_APPROVAL_ID = 'send-credit-request';

export const SEND_APPROVAL: ApprovalRequest = {
  id: SEND_APPROVAL_ID,
  title: 'Send the credit request to Brightmoor accounts',
  risk: 'medium',
  status: 'pending',
  agentId: 'writer',
};

export const SEND_PREVIEW = {
  kind: 'email' as const,
  to: 'accounts@brightmoor-supply.example',
  subject: 'Q3 invoices: six lines above your list price',
  body: 'Hello Dana,\nSix lines of our Q3 invoices are above your published list price, $1,840.20 in total. The comparison is attached. Could you credit it on the next invoice?',
};

function upcoming(id: string, title: string): PlanStep {
  return { id, title, status: 'upcoming' };
}

const PLAN: PlanStep[] = [
  upcoming('scope', 'Worked out what the review needs'),
  upcoming('search', 'Found the Brightmoor price list'),
  upcoming('page', 'Read the pricing page'),
  upcoming('page-again', 'Read the pricing page again'),
  upcoming('sheet', 'Read the Q3 invoices'),
  upcoming('compare', 'Found six lines above the list price'),
  upcoming('draft', 'Wrote the credit request'),
  upcoming('approve', 'Waiting for you to approve the email'),
  upcoming('send', 'Sent the credit request'),
  upcoming('summary', 'Wrote the summary for finance'),
];

export const STEP_KINDS: Record<
  string,
  'thinking' | 'tools' | 'waiting' | 'writing'
> = {
  scope: 'thinking',
  search: 'tools',
  page: 'tools',
  'page-again': 'tools',
  sheet: 'tools',
  compare: 'thinking',
  draft: 'writing',
  approve: 'waiting',
  send: 'tools',
  summary: 'writing',
};

export const INITIAL_STAGE_RUN = emptyRun({
  id: 'home-stage',
  title: STAGE_TITLE,
});

function stepTo(id: string, status: StepStatus): RunEvent {
  return { type: 'step.updated', id, patch: { status } };
}

function callStarted(call: Omit<ToolCall, 'status'>): RunEvent {
  return { type: 'call.started', call: { ...call, status: 'running' } };
}

function callDone(id: string, output: unknown): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'done', output } };
}

function callFailed(id: string, error: string): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'failed', error } };
}

function used(
  contextTokens: number,
  costUsd: number,
  outputTokens: number
): RunEvent {
  return {
    type: 'usage.added',
    contextTokens,
    costUsd,
    inputTokens: contextTokens,
    outputTokens,
  };
}

const PRICE_PAGE = 'https://brightmoor-supply.example/prices';

export const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  { after: 0, event: { type: 'plan.set', steps: PLAN } },
  { after: 0, event: stepTo('scope', 'running') },
  { after: 0, event: used(18_000, 0.004, 300) },
  { after: 900, event: stepTo('scope', 'done') },
  { after: 0, event: stepTo('search', 'running') },
  {
    after: 0,
    event: callStarted({
      id: 'search',
      tool: 'web_search',
      label: 'Searched the web for the Brightmoor price list',
      agentId: 'researcher',
      input: { query: 'Brightmoor Supply wholesale price list', limit: 5 },
    }),
  },
  {
    after: 1100,
    event: callDone('search', { results: 5, top: PRICE_PAGE }),
  },
  { after: 0, event: stepTo('search', 'done') },
  { after: 0, event: used(4_000, 0.003, 200) },
  { after: 0, event: stepTo('page', 'running') },
  {
    after: 0,
    event: callStarted({
      id: 'page',
      tool: 'fetch_page',
      label: 'Read the Brightmoor pricing page',
      agentId: 'researcher',
      input: { url: PRICE_PAGE },
    }),
  },
  {
    after: 700,
    event: callFailed('page', '403 Forbidden: the site refused the reader'),
  },
  { after: 0, event: stepTo('page', 'failed') },
  { after: 300, event: stepTo('page-again', 'running') },
  {
    after: 0,
    event: callStarted({
      id: 'page-again',
      tool: 'fetch_page',
      label: 'Read the pricing page as a browser would',
      agentId: 'researcher',
      input: { url: PRICE_PAGE, render: true },
    }),
  },
  {
    after: 1000,
    event: callDone('page-again', { products: 214, currency: 'USD' }),
  },
  { after: 0, event: stepTo('page-again', 'done') },
  { after: 0, event: used(9_000, 0.006, 400) },
  { after: 0, event: stepTo('sheet', 'running') },
  {
    after: 0,
    event: callStarted({
      id: 'sheet',
      tool: 'read_sheet',
      label: 'Read the Q3 invoices spreadsheet',
      agentId: 'researcher',
      input: { file: 'q3-invoices.xlsx', sheet: 'Brightmoor' },
    }),
  },
  {
    after: 900,
    event: callDone('sheet', { rows: 1_284, vendor: 'Brightmoor' }),
  },
  { after: 0, event: stepTo('sheet', 'done') },
  { after: 0, event: used(21_000, 0.011, 500) },
  { after: 0, event: stepTo('compare', 'running') },
  { after: 1000, event: stepTo('compare', 'done') },
  { after: 0, event: used(6_000, 0.008, 900) },
  { after: 0, event: stepTo('draft', 'running') },
  { after: 1300, event: stepTo('draft', 'done') },
  { after: 0, event: used(3_000, 0.006, 700) },
  { after: 0, event: stepTo('approve', 'running') },
  { after: 0, event: { type: 'approval.requested', approval: SEND_APPROVAL } },
  { after: 200, event: stepTo('send', 'running') },
  {
    after: 0,
    event: callStarted({
      id: 'send',
      tool: 'send_email',
      label: 'Sent the credit request to Brightmoor accounts',
      agentId: 'writer',
      input: { to: SEND_PREVIEW.to, attachments: 1 },
    }),
  },
  { after: 700, event: callDone('send', { delivered: true }) },
  { after: 0, event: stepTo('send', 'done') },
  { after: 0, event: stepTo('summary', 'running') },
  { after: 0, event: used(2_000, 0.004, 600) },
  { after: 1100, event: stepTo('summary', 'done') },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];
