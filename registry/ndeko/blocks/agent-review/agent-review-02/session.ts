import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  DEMO_COMMENT,
  OLD_COMMENT,
  OLD_THREAD_LINE,
  TARGET_LINE,
} from './data';

export type ReplyStatus = 'typing' | 'suggestion' | 'note';

export type ApplyStatus = 'idle' | 'busy' | 'done';

export type Thread = {
  lineKey: string;
  comment: string;
  reply: ReplyStatus;
  apply: ApplyStatus;
  isResolved: boolean;
  isFolded: boolean;
};

export type ReviewState = {
  /** The line whose comment field is open. */
  openLine: string | null;
  draft: string;
  threads: Thread[];
};

export type ReviewAction =
  | { type: 'opened'; lineKey: string }
  | { type: 'closed' }
  | { type: 'typed'; text: string }
  | { type: 'posted' }
  | { type: 'replied'; lineKey: string }
  | { type: 'applying'; lineKey: string }
  | { type: 'applied'; lineKey: string }
  | { type: 'resolved'; lineKey: string }
  | { type: 'folded'; lineKey: string };

type Step = SessionStep<ReviewState, ReviewAction>;

const OLD_THREAD: Thread = {
  lineKey: OLD_THREAD_LINE,
  comment: OLD_COMMENT,
  reply: 'note',
  apply: 'idle',
  isResolved: true,
  isFolded: true,
};

export const INITIAL: ReviewState = {
  openLine: null,
  draft: '',
  threads: [OLD_THREAD],
};

export function threadOf(state: ReviewState, lineKey: string) {
  return state.threads.find((thread) => thread.lineKey === lineKey);
}

export function hasGuardOf(state: ReviewState) {
  const target = threadOf(state, TARGET_LINE);
  return target?.apply === 'done';
}

function patched(
  state: ReviewState,
  lineKey: string,
  change: (thread: Thread) => Thread
): ReviewState {
  const threads = state.threads.map((thread) => {
    if (thread.lineKey === lineKey) {
      return change(thread);
    }
    return thread;
  });
  return { ...state, threads };
}

function commentOf(state: ReviewState) {
  const trimmed = state.draft.trim();
  if (trimmed === '') {
    return DEMO_COMMENT;
  }
  return trimmed;
}

function posted(state: ReviewState): ReviewState {
  const lineKey = state.openLine;
  if (lineKey === null) {
    return state;
  }
  const thread: Thread = {
    lineKey,
    comment: commentOf(state),
    reply: 'typing',
    apply: 'idle',
    isResolved: false,
    isFolded: false,
  };
  return {
    openLine: null,
    draft: '',
    threads: [...state.threads, thread],
  };
}

function replyFor(lineKey: string): ReplyStatus {
  if (lineKey === TARGET_LINE) {
    return 'suggestion';
  }
  return 'note';
}

function replied(thread: Thread): Thread {
  if (thread.reply !== 'typing') {
    return thread;
  }
  return { ...thread, reply: replyFor(thread.lineKey) };
}

function applying(thread: Thread): Thread {
  const canApply = thread.reply === 'suggestion' && thread.apply === 'idle';
  if (!canApply) {
    return thread;
  }
  return { ...thread, apply: 'busy' };
}

function applied(thread: Thread): Thread {
  if (thread.apply !== 'busy') {
    return thread;
  }
  return { ...thread, apply: 'done' };
}

function resolved(thread: Thread): Thread {
  if (thread.reply === 'typing') {
    return thread;
  }
  return { ...thread, isResolved: true, isFolded: true };
}

function folded(thread: Thread): Thread {
  return { ...thread, isFolded: !thread.isFolded };
}

function opened(state: ReviewState, lineKey: string): ReviewState {
  const hasThread = threadOf(state, lineKey) !== undefined;
  if (hasThread) {
    return state;
  }
  return { ...state, openLine: lineKey, draft: '' };
}

export function reducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'opened':
      return opened(state, action.lineKey);
    case 'closed':
      return { ...state, openLine: null, draft: '' };
    case 'typed':
      return { ...state, draft: action.text };
    case 'posted':
      return posted(state);
    case 'replied':
      return patched(state, action.lineKey, replied);
    case 'applying':
      return patched(state, action.lineKey, applying);
    case 'applied':
      return patched(state, action.lineKey, applied);
    case 'resolved':
      return patched(state, action.lineKey, resolved);
    case 'folded':
      return patched(state, action.lineKey, folded);
  }
}

const CHUNK = 2;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 700;
  }
  return 60;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = DEMO_COMMENT.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = DEMO_COMMENT.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({ after, by: 'demo', action: { type: 'typed', text } });
  }
  return steps;
}

function hasPosted(state: ReviewState) {
  return threadOf(state, TARGET_LINE) !== undefined;
}

function hasPressedApply(state: ReviewState) {
  const target = threadOf(state, TARGET_LINE);
  const apply = target?.apply ?? 'idle';
  return apply !== 'idle';
}

export const REPLY_MS = 1700;

export const APPLY_MS = 900;

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  {
    after: 1200,
    by: 'demo',
    press: `plus-${TARGET_LINE}`,
    action: { type: 'opened', lineKey: TARGET_LINE },
  },
  ...typingSteps(),
  {
    after: 500,
    by: 'person',
    press: 'post',
    action: { type: 'posted' },
    isAnswered: hasPosted,
  },
  { after: REPLY_MS, action: { type: 'replied', lineKey: TARGET_LINE } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'apply',
    action: { type: 'applying', lineKey: TARGET_LINE },
    isAnswered: hasPressedApply,
  },
  { after: APPLY_MS, action: { type: 'applied', lineKey: TARGET_LINE } },
  {
    after: 2200,
    by: 'demo',
    press: 'resolve',
    action: { type: 'resolved', lineKey: TARGET_LINE },
  },
];

function restingOf() {
  let state = INITIAL;
  for (const step of SCRIPT) {
    state = reducer(state, step.action);
  }
  const unfolded = reducer(state, { type: 'folded', lineKey: TARGET_LINE });
  return unfolded;
}

/** Under reduced motion the thread rests open, so the applied suggestion can be read. */
export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3200;
