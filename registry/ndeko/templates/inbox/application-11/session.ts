import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  ARTICLES,
  CUSTOMER_FIELDS,
  DRAFT_TEXT,
  DRAFT_TOKENS,
  EARLIER_REPLIES,
  EMPTY_SEND_HINT,
  REFUND,
  SCRIPTED_TICKET,
  ticketOf,
  TICKETS,
  type StepId,
  type Ticket,
  type TicketStatus,
} from './data';

export type SendStatus = 'idle' | 'sending' | 'sent';

export type DraftStatus =
  'none' | 'streaming' | 'ready' | 'inserted' | 'discarded' | 'closed';

export type RefundStatus = 'none' | 'asking' | 'issuing' | 'issued' | 'denied';

export type Decision = 'approved' | 'denied';

export type TicketLive = {
  isUnread: boolean;
  status: TicketStatus;
  reply: string;
  send: SendStatus;
  sentReplies: string[];
};

export type StepRun = {
  id: StepId;
  status: 'running' | 'done';
  startedAt: number;
  endedAt?: number;
};

export type InboxState = {
  openId: string | null;
  live: Record<string, TicketLive>;
  steps: StepRun[];
  customerFields: number;
  articlesFound: number;
  draft: DraftStatus;
  refund: RefundStatus;
  emptySends: number;
  showsSendHint: boolean;
  spoken: string;
  isListOpen: boolean;
  isCopilotOpen: boolean;
};

export type InboxAction =
  | { type: 'opened'; id: string }
  | { type: 'stepStarted'; id: StepId }
  | { type: 'stepDone'; id: StepId }
  | { type: 'customerField' }
  | { type: 'articleFound' }
  | { type: 'draftStarted' }
  | { type: 'draftReady' }
  | { type: 'draftInserted' }
  | { type: 'draftDiscarded' }
  | { type: 'draftRestored' }
  | { type: 'replyTyped'; text: string }
  | { type: 'sendPressed' }
  | { type: 'delivered'; id: string }
  | { type: 'refundAsked' }
  | { type: 'refundDecided'; decision: Decision }
  | { type: 'refunded' }
  | { type: 'listSheet'; isOpen: boolean }
  | { type: 'copilotSheet'; isOpen: boolean }
  | { type: 'batch'; actions: InboxAction[] };

type Step = SessionStep<InboxState, InboxAction>;

function earlierRepliesOf(id: string) {
  const reply = EARLIER_REPLIES[id];
  if (reply === undefined) {
    return [];
  }
  return [reply];
}

function liveOf(ticket: Ticket): TicketLive {
  return {
    isUnread: ticket.isUnread,
    status: ticket.status,
    reply: '',
    send: 'idle',
    sentReplies: earlierRepliesOf(ticket.id),
  };
}

function initialLiveOf() {
  const live: Record<string, TicketLive> = {};
  for (const ticket of TICKETS) {
    live[ticket.id] = liveOf(ticket);
  }
  return live;
}

export const INITIAL: InboxState = {
  openId: null,
  live: initialLiveOf(),
  steps: [],
  customerFields: 0,
  articlesFound: 0,
  draft: 'none',
  refund: 'none',
  emptySends: 0,
  showsSendHint: false,
  spoken: '',
  isListOpen: false,
  isCopilotOpen: false,
};

export type OpenTicket = {
  id: string;
  ticket: Ticket;
  live: TicketLive;
};

export function openOf(state: InboxState): OpenTicket | null {
  const id = state.openId;
  if (id === null) {
    return null;
  }
  return { id, ticket: ticketOf(id), live: state.live[id] };
}

/** Which group every ticket sits in. The rows of the list only measure themselves again when it changes. */
export function placementOf(state: InboxState) {
  const places = TICKETS.map((ticket) => {
    const live = state.live[ticket.id];
    return `${ticket.id}:${live.status}`;
  });
  return places.join(' ');
}

function patchedLive(
  state: InboxState,
  id: string,
  change: (live: TicketLive) => TicketLive
): InboxState {
  const next = change(state.live[id]);
  return { ...state, live: { ...state.live, [id]: next } };
}

function opened(state: InboxState, id: string): InboxState {
  const ticket = ticketOf(id);
  const spoken = `${ticket.subject}, from ${ticket.customer.name}`;
  const read = patchedLive(state, id, (live) => ({ ...live, isUnread: false }));
  return {
    ...read,
    openId: id,
    showsSendHint: false,
    isListOpen: false,
    spoken,
  };
}

function stepStarted(state: InboxState, id: StepId, now: number): InboxState {
  const isKnown = state.steps.some((run) => run.id === id);
  if (isKnown) {
    return state;
  }
  const run: StepRun = { id, status: 'running', startedAt: now };
  return { ...state, steps: [...state.steps, run] };
}

function stepDone(state: InboxState, id: StepId, now: number): InboxState {
  const steps = state.steps.map((run) => {
    const isTarget = run.id === id && run.status === 'running';
    if (!isTarget) {
      return run;
    }
    const ended: StepRun = { ...run, status: 'done', endedAt: now };
    return ended;
  });
  return { ...state, steps };
}

function customerField(state: InboxState): InboxState {
  const filled = state.customerFields + 1;
  const customerFields = Math.min(CUSTOMER_FIELDS.length, filled);
  return { ...state, customerFields };
}

function articleFound(state: InboxState): InboxState {
  const found = state.articlesFound + 1;
  const articlesFound = Math.min(ARTICLES.length, found);
  return { ...state, articlesFound };
}

function draftMoved(
  state: InboxState,
  from: DraftStatus,
  to: DraftStatus
): InboxState {
  if (state.draft !== from) {
    return state;
  }
  return { ...state, draft: to };
}

function draftReady(state: InboxState): InboxState {
  if (state.draft !== 'streaming') {
    return state;
  }
  const sources = ARTICLES.length;
  const spoken = `The copilot drafted a reply with ${sources} sources`;
  return { ...state, draft: 'ready', spoken };
}

/** Insert never throws away what a person already wrote: the draft goes under it. */
function withDraft(reply: string) {
  const written = reply.trim();
  if (written === '') {
    return DRAFT_TEXT;
  }
  return `${written}\n\n${DRAFT_TEXT}`;
}

function draftInserted(state: InboxState): InboxState {
  if (state.draft !== 'ready') {
    return state;
  }
  const filled = patchedLive(state, SCRIPTED_TICKET, (live) => ({
    ...live,
    reply: withDraft(live.reply),
    send: 'idle',
  }));
  return {
    ...filled,
    draft: 'inserted',
    showsSendHint: false,
    spoken: 'Draft inserted in the reply box',
  };
}

function replyTyped(state: InboxState, text: string): InboxState {
  const id = state.openId;
  if (id === null) {
    return state;
  }
  const typed = patchedLive(state, id, (live) => ({
    ...live,
    reply: text,
    send: 'idle',
  }));
  return { ...typed, showsSendHint: false };
}

function sendPressed(state: InboxState): InboxState {
  const id = state.openId;
  if (id === null) {
    return state;
  }
  const live = state.live[id];
  if (live.send === 'sending') {
    return state;
  }
  const isEmpty = live.reply.trim() === '';
  if (isEmpty) {
    const emptySends = state.emptySends + 1;
    return {
      ...state,
      emptySends,
      showsSendHint: true,
      spoken: EMPTY_SEND_HINT,
    };
  }
  const sending = patchedLive(state, id, (current) => ({
    ...current,
    send: 'sending',
  }));
  return { ...sending, showsSendHint: false };
}

function delivered(state: InboxState, id: string): InboxState {
  const live = state.live[id];
  if (live.send !== 'sending') {
    return state;
  }
  const reply = live.reply.trim();
  const sent = patchedLive(state, id, (current) => ({
    ...current,
    reply: '',
    send: 'sent',
    status: 'solved',
    sentReplies: [...current.sentReplies, reply],
  }));
  const draft = draftAfterReply(state, id);
  return { ...sent, draft, spoken: 'Reply sent. The ticket is solved' };
}

/** Once its ticket is answered, a draft has nothing left to offer: it leaves the reply box, used or not. */
function draftAfterReply(state: InboxState, id: string): DraftStatus {
  const isItsTicket = id === SCRIPTED_TICKET;
  const hasDraft = state.draft !== 'none';
  if (isItsTicket && hasDraft) {
    return 'closed';
  }
  return state.draft;
}

function refundAsked(state: InboxState): InboxState {
  if (state.refund !== 'none') {
    return state;
  }
  const spoken = `The copilot asks to refund ${REFUND.amount} to ${REFUND.card}. Allow or deny it`;
  return { ...state, refund: 'asking', spoken };
}

function refundDecided(state: InboxState, decision: Decision): InboxState {
  if (state.refund !== 'asking') {
    return state;
  }
  if (decision === 'approved') {
    return { ...state, refund: 'issuing' };
  }
  return { ...state, refund: 'denied', spoken: 'No refund was issued' };
}

function refunded(state: InboxState): InboxState {
  if (state.refund !== 'issuing') {
    return state;
  }
  const spoken = `Refund of ${REFUND.amount} issued to ${REFUND.card}`;
  return { ...state, refund: 'issued', spoken };
}

export function applyAt(
  state: InboxState,
  action: InboxAction,
  now: number
): InboxState {
  switch (action.type) {
    case 'opened':
      return opened(state, action.id);
    case 'stepStarted':
      return stepStarted(state, action.id, now);
    case 'stepDone':
      return stepDone(state, action.id, now);
    case 'customerField':
      return customerField(state);
    case 'articleFound':
      return articleFound(state);
    case 'draftStarted':
      return draftMoved(state, 'none', 'streaming');
    case 'draftReady':
      return draftReady(state);
    case 'draftInserted':
      return draftInserted(state);
    case 'draftDiscarded':
      return draftMoved(state, 'ready', 'discarded');
    case 'draftRestored':
      return draftMoved(state, 'discarded', 'ready');
    case 'replyTyped':
      return replyTyped(state, action.text);
    case 'sendPressed':
      return sendPressed(state);
    case 'delivered':
      return delivered(state, action.id);
    case 'refundAsked':
      return refundAsked(state);
    case 'refundDecided':
      return refundDecided(state, action.decision);
    case 'refunded':
      return refunded(state);
    case 'listSheet':
      return { ...state, isListOpen: action.isOpen };
    case 'copilotSheet':
      return { ...state, isCopilotOpen: action.isOpen };
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: InboxState, action: InboxAction) {
  return applyAt(state, action, Date.now());
}

function hasOpenedScripted(state: InboxState) {
  return !state.live[SCRIPTED_TICKET].isUnread;
}

function hasDecidedRefund(state: InboxState) {
  return state.refund !== 'asking';
}

function hasHandledDraft(state: InboxState) {
  return state.draft !== 'ready';
}

function hasPressedSend(state: InboxState) {
  return state.live[SCRIPTED_TICKET].send !== 'idle';
}

export const DRAFT_WORD_MS = 45;

/** A stream is given a little longer than its words need, so its last word lands before the next step. */
const STREAM_MARGIN_MS = 200;

const DRAFT_STREAM_MS = DRAFT_TOKENS.length * DRAFT_WORD_MS;

const DRAFT_MS = DRAFT_STREAM_MS + STREAM_MARGIN_MS;

const DEMO_DECIDES_AFTER_MS = 2500;

export const REFUND_MS = 900;

export const SEND_MS = 1000;

function frame(after: number, actions: InboxAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function started(id: StepId): InboxAction {
  return { type: 'stepStarted', id };
}

function done(id: StepId): InboxAction {
  return { type: 'stepDone', id };
}

const FIELD: InboxAction = { type: 'customerField' };

const ARTICLE: InboxAction = { type: 'articleFound' };

/** On a narrow page the list and the copilot live in sheets, which the demonstration opens and closes as a person would. */
const OPENING: Step[] = [
  { after: 1200, by: 'demo', action: { type: 'listSheet', isOpen: true } },
  {
    after: 900,
    by: 'person',
    press: `ticket-${SCRIPTED_TICKET}`,
    action: { type: 'opened', id: SCRIPTED_TICKET },
    isAnswered: hasOpenedScripted,
  },
  frame(600, [started('read')]),
  { after: 400, by: 'demo', action: { type: 'copilotSheet', isOpen: true } },
  frame(900, [done('read'), started('lookup')]),
  frame(600, [FIELD]),
  frame(450, [FIELD]),
  frame(450, [FIELD, done('lookup'), started('search')]),
  frame(900, [ARTICLE]),
  frame(600, [ARTICLE]),
  frame(500, [done('search'), started('draft')]),
  { after: 800, by: 'demo', action: { type: 'copilotSheet', isOpen: false } },
  frame(400, [{ type: 'draftStarted' }]),
  frame(DRAFT_MS, [{ type: 'draftReady' }, done('draft')]),
  frame(1100, [{ type: 'refundAsked' }]),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'refundDecided', decision: 'approved' },
    isAnswered: hasDecidedRefund,
  },
  { after: REFUND_MS, action: { type: 'refunded' } },
  {
    after: 1400,
    by: 'person',
    press: 'insert',
    action: { type: 'draftInserted' },
    isAnswered: hasHandledDraft,
  },
  {
    after: 1500,
    by: 'person',
    press: 'send',
    action: { type: 'sendPressed' },
    isAnswered: hasPressedSend,
  },
  { after: SEND_MS, action: { type: 'delivered', id: SCRIPTED_TICKET } },
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const ASKED = restingOf(INITIAL, OPENING, applyAt);

/** Under reduced motion the draft waits in the reply box with its sources and the refund waits for an answer. */
export const RESTING: InboxState = {
  ...ASKED,
  isListOpen: false,
  isCopilotOpen: false,
  spoken: '',
};

export const LOOP_AFTER_MS = 3600;
