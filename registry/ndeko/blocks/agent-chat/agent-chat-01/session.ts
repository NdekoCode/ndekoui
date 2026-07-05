import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  reduceRun,
  type RunEvent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';

import { PLAN, PROMPT, SEND_APPROVAL } from './data';

export type Phase =
  | 'idle'
  | 'thinking'
  | 'reading'
  | 'streaming'
  | 'waiting'
  | 'sending'
  | 'done'
  | 'stopped';

export type Decision = 'approved' | 'denied';

export type ChatState = {
  draft: string;
  question: string | null;
  phase: Phase;
  sourcesShown: number;
  run: RunSnapshot;
  decision: Decision | null;
  followUps: string[];
};

export type ChatAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'phase'; phase: Phase }
  | { type: 'source' }
  | { type: 'run'; event: RunEvent }
  | { type: 'decided'; decision: Decision }
  | { type: 'afterDecision' }
  | { type: 'finished' }
  | { type: 'batch'; actions: ChatAction[] };

type Step = SessionStep<ChatState, ChatAction>;

export const INITIAL: ChatState = {
  draft: '',
  question: null,
  phase: 'idle',
  sourcesShown: 0,
  run: emptyRun({ id: 'renewals', title: 'Renewals at risk' }),
  decision: null,
  followUps: [],
};

export function isOver(phase: Phase) {
  return phase === 'done' || phase === 'stopped';
}

function questionOf(draft: string) {
  const trimmed = draft.trim();
  if (trimmed === '') {
    return PROMPT;
  }
  return trimmed;
}

function sent(state: ChatState): ChatState {
  const isFirst = state.question === null;
  if (isFirst) {
    const question = questionOf(state.draft);
    return { ...state, draft: '', question, phase: 'thinking' };
  }
  const text = state.draft.trim();
  const canFollowUp = isOver(state.phase) && text !== '';
  if (!canFollowUp) {
    return state;
  }
  return { ...state, draft: '', followUps: [...state.followUps, text] };
}

function decided(state: ChatState, decision: Decision, now: number): ChatState {
  if (state.phase !== 'waiting') {
    return state;
  }
  const resolved = reduceRun(
    state.run,
    { type: 'approval.resolved', id: SEND_APPROVAL.id, decision },
    now
  );
  if (decision === 'approved') {
    return { ...state, decision, run: resolved, phase: 'sending' };
  }
  const skipped = reduceRun(
    resolved,
    { type: 'step.updated', id: 'send', patch: { status: 'skipped' } },
    now
  );
  const cancelled = reduceRun(
    skipped,
    { type: 'run.finished', status: 'cancelled' },
    now
  );
  return { ...state, decision, run: cancelled, phase: 'stopped' };
}

function afterDecision(state: ChatState, now: number): ChatState {
  if (state.phase !== 'sending') {
    return state;
  }
  const running = reduceRun(
    state.run,
    { type: 'step.updated', id: 'send', patch: { status: 'running' } },
    now
  );
  const run = reduceRun(
    running,
    {
      type: 'call.started',
      call: {
        id: 'c4',
        tool: 'send_email',
        label: 'Send to Ines Okafor',
        status: 'running',
      },
    },
    now
  );
  return { ...state, run };
}

function finished(state: ChatState, now: number): ChatState {
  if (state.phase !== 'sending') {
    return state;
  }
  const events: RunEvent[] = [
    { type: 'call.updated', id: 'c4', patch: { status: 'done' } },
    { type: 'step.updated', id: 'send', patch: { status: 'done' } },
    { type: 'usage.added', costUsd: 0.004 },
    { type: 'run.finished', status: 'done' },
  ];
  let run = state.run;
  for (const event of events) {
    run = reduceRun(run, event, now);
  }
  return { ...state, run, phase: 'done' };
}

export function applyAt(
  state: ChatState,
  action: ChatAction,
  now: number
): ChatState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state);
    case 'phase':
      return { ...state, phase: action.phase };
    case 'source':
      return { ...state, sourcesShown: state.sourcesShown + 1 };
    case 'run':
      return { ...state, run: reduceRun(state.run, action.event, now) };
    case 'decided':
      return decided(state, action.decision, now);
    case 'afterDecision':
      return afterDecision(state, now);
    case 'finished':
      return finished(state, now);
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: ChatState, action: ChatAction) {
  return applyAt(state, action, Date.now());
}

function ran(event: RunEvent): ChatAction {
  return { type: 'run', event };
}

function frame(after: number, actions: ChatAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function stepStatus(id: string, status: 'running' | 'done'): ChatAction {
  return ran({ type: 'step.updated', id, patch: { status } });
}

function callStarted(id: string, tool: string, label: string): ChatAction {
  return ran({
    type: 'call.started',
    call: { id, tool, label, status: 'running' },
  });
}

function callDone(id: string, costUsd: number): ChatAction[] {
  return [
    ran({ type: 'call.updated', id, patch: { status: 'done' } }),
    ran({ type: 'usage.added', costUsd }),
    { type: 'source' },
  ];
}

const CHUNK = 3;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 1100;
  }
  return 70;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = PROMPT.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = PROMPT.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({ after, by: 'demo', action: { type: 'typed', text } });
  }
  return steps;
}

function hasSent(state: ChatState) {
  return state.question !== null;
}

function hasDecided(state: ChatState) {
  return state.decision !== null;
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  ...typingSteps(),
  {
    after: 500,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasSent,
  },
  frame(400, [
    ran({ type: 'run.started' }),
    ran({ type: 'plan.set', steps: PLAN }),
    stepStatus('read', 'running'),
  ]),
  frame(500, [
    { type: 'phase', phase: 'reading' },
    callStarted('c1', 'read_sheet', 'Read Renewals Q3'),
  ]),
  frame(1000, [
    ...callDone('c1', 0.006),
    stepStatus('read', 'done'),
    stepStatus('find', 'running'),
    callStarted('c2', 'search_pages', 'Search the renewal playbook'),
  ]),
  frame(900, [
    ...callDone('c2', 0.004),
    callStarted('c3', 'get_account', 'Open Meridian Foods'),
  ]),
  frame(1000, [
    ...callDone('c3', 0.005),
    stepStatus('find', 'done'),
    stepStatus('draft', 'running'),
  ]),
  frame(300, [{ type: 'phase', phase: 'streaming' }]),
  frame(2600, [
    stepStatus('draft', 'done'),
    ran({ type: 'usage.added', costUsd: 0.018 }),
    ran({ type: 'approval.requested', approval: SEND_APPROVAL }),
    { type: 'phase', phase: 'waiting' },
  ]),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: 250, action: { type: 'afterDecision' } },
  { after: 1300, action: { type: 'finished' } },
];

function restingOf() {
  let state = INITIAL;
  let now = 1000;
  for (const step of SCRIPT) {
    now += step.after;
    state = applyAt(state, step.action, now);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3600;
