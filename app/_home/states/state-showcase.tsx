'use client';

import {
  CONTEXT_LIMIT,
  CONTEXT_RESERVE,
  type Compaction,
  type ContextBudget,
} from '@/registry/ndeko/components/run/_parts/context';
import { ToolCallGroup } from '@/registry/ndeko/components/run/run-01';
import { ContextWindowBar } from '@/registry/ndeko/components/run/run-05';
import {
  ApprovalPrompt,
  type ApprovalEntry,
  type ApprovalPhase,
} from '@/registry/ndeko/components/review/review-01';
import {
  PermissionRequestCard,
  type PermissionEntry,
} from '@/registry/ndeko/components/review/review-02';
import type { CallStatus, ToolCall } from '@/registry/ndeko/lib/agent-run';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import type { Segment } from '@/registry/ndeko/ui/segments';

import { StateTile } from './state-tile';

const CALL_STATES: Segment<CallStatus>[] = [
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'failed', label: 'Failed' },
];

const PRICE_PAGE = 'https://brightmoor-supply.example/prices';

const CALL_BASE: ToolCall = {
  id: 'state-call',
  tool: 'fetch_page',
  label: 'Read the Brightmoor pricing page',
  status: 'queued',
  input: { url: PRICE_PAGE },
};

const FINISHED_AFTER_MS = 1_240;

function callIn(status: CallStatus, enteredAt: number): ToolCall {
  if (status === 'running') {
    return { ...CALL_BASE, status, startedAt: enteredAt };
  }
  const startedAt = enteredAt - FINISHED_AFTER_MS;
  if (status === 'done') {
    return {
      ...CALL_BASE,
      status,
      startedAt,
      endedAt: enteredAt,
      output: { products: 214, currency: 'USD' },
    };
  }
  if (status === 'failed') {
    return {
      ...CALL_BASE,
      status,
      startedAt,
      endedAt: enteredAt,
      error: '403 Forbidden: the site refused the reader',
    };
  }
  return CALL_BASE;
}

type ApprovalState = 'waiting' | 'approving' | 'approved' | 'denied';

const APPROVAL_STATES: Segment<ApprovalState>[] = [
  { value: 'waiting', label: 'Waiting' },
  { value: 'approving', label: 'Approving' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

function approvalEntryIn(
  state: ApprovalState,
  enteredAt: number
): ApprovalEntry {
  const phase: ApprovalPhase = state;
  const isApproved = state === 'approved';
  const isDenied = state === 'denied';
  const base: ApprovalEntry = {
    request: {
      id: 'state-approval',
      title: 'Send the credit request to Brightmoor accounts',
      risk: 'medium',
      status: 'pending',
    },
    agent: { name: 'Writer', series: 3 },
    outcome: 'Sent',
    phase,
    preview: {
      kind: 'email',
      to: 'accounts@brightmoor-supply.example',
      subject: 'Q3 invoices: six lines above your list price',
      body: 'Hello Dana,\nSix lines of our Q3 invoices are above your list price, $1,840.20 in total. Could you credit it on the next invoice?',
    },
  };
  if (isApproved) {
    return {
      ...base,
      request: { ...base.request, status: 'approved', resolvedAt: enteredAt },
    };
  }
  if (isDenied) {
    return {
      ...base,
      reason: 'Wait for the November invoices first',
      request: { ...base.request, status: 'denied', resolvedAt: enteredAt },
    };
  }
  return base;
}

type ContextState = 'room' | 'filling' | 'compact' | 'compacted';

const CONTEXT_STATES: Segment<ContextState>[] = [
  { value: 'room', label: 'Roomy' },
  { value: 'filling', label: 'Filling' },
  { value: 'compact', label: 'Full' },
  { value: 'compacted', label: 'Compacted' },
];

const CONVERSATION_BY_STATE: Record<ContextState, number> = {
  room: 38_000,
  filling: 96_000,
  compact: 128_000,
  compacted: 22_000,
};

const SUMMARY_TOKENS = 6_400;

function contextBudgetIn(state: ContextState): ContextBudget {
  const conversation = CONVERSATION_BY_STATE[state];
  const isCompacted = state === 'compacted';
  const parts: ContextBudget['parts'] = [
    { id: 'system', label: 'System', tokens: 6_200, items: [] },
    { id: 'tools', label: 'Tools', tokens: 8_600, items: [] },
    { id: 'files', label: 'Files', tokens: 30_000, items: [] },
  ];
  if (isCompacted) {
    parts.push({
      id: 'summary',
      label: 'Summary',
      tokens: SUMMARY_TOKENS,
      items: [],
    });
  }
  parts.push({
    id: 'conversation',
    label: 'Conversation',
    tokens: conversation,
    items: [],
  });
  return { limit: CONTEXT_LIMIT, reserve: CONTEXT_RESERVE, parts };
}

const COMPACTION: Compaction = {
  foldedTurns: 9,
  summaryTokens: SUMMARY_TOKENS,
};

function compactionIn(state: ContextState) {
  if (state === 'compacted') {
    return COMPACTION;
  }
  return null;
}

type PermissionState = 'asking' | 'allowed' | 'denied';

const PERMISSION_STATES: Segment<PermissionState>[] = [
  { value: 'asking', label: 'Asking' },
  { value: 'allowed', label: 'Allowed' },
  { value: 'denied', label: 'Denied' },
];

const PERMISSION_ENTRY: PermissionEntry = {
  request: {
    id: 'state-permission',
    title: 'Clear the cache before the test run',
    risk: 'high',
    status: 'pending',
    command: 'rm -rf ./tmp/cache',
  },
  agent: { name: 'Coder', series: 5 },
  tool: 'shell',
  why: 'It deletes files and cannot be undone.',
};

function permissionResultIn(state: PermissionState) {
  if (state === 'allowed') {
    return { decision: 'allowed' as const, scope: 'once' as const };
  }
  if (state === 'denied') {
    return { decision: 'denied' as const, scope: 'once' as const };
  }
  return null;
}

const SAVE_STATES: Segment<MorphState>[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'busy', label: 'Saving' },
  { value: 'done', label: 'Saved' },
];

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Save changes',
  busy: 'Saving',
  done: 'Saved',
};

export function StateShowcase() {
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      <StateTile
        title='Tool call'
        name='run-01'
        href='/components/run#run-01'
        states={CALL_STATES}
      >
        {(state, enteredAt) => (
          <ToolCallGroup calls={[callIn(state, enteredAt)]} />
        )}
      </StateTile>
      <StateTile
        title='Approval prompt'
        name='review-01'
        href='/components/review#review-01'
        states={APPROVAL_STATES}
      >
        {(state, enteredAt) => (
          <ApprovalPrompt entries={[approvalEntryIn(state, enteredAt)]} />
        )}
      </StateTile>
      <StateTile
        title='Context window'
        name='run-05'
        href='/components/run#run-05'
        states={CONTEXT_STATES}
      >
        {(state) => (
          <ContextWindowBar
            budget={contextBudgetIn(state)}
            compaction={compactionIn(state)}
          />
        )}
      </StateTile>
      <StateTile
        title='Permission request'
        name='review-02'
        href='/components/review#review-02'
        states={PERMISSION_STATES}
      >
        {(state) => (
          <PermissionRequestCard
            entry={PERMISSION_ENTRY}
            result={permissionResultIn(state)}
          />
        )}
      </StateTile>
      <StateTile
        title='Morph button'
        name='morph-button'
        href='/kit'
        states={SAVE_STATES}
      >
        {(state) => (
          <div className='flex justify-center'>
            <MorphButton state={state} labels={SAVE_LABELS} />
          </div>
        )}
      </StateTile>
    </div>
  );
}
