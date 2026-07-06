import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { conversationOf, CONVERSATIONS, type Conversation } from './data';

export type SendStatus = 'open' | 'sending' | 'handled';

export type ConversationLive = {
  status: SendStatus;
  /** Which of the agent's drafts shows. */
  variant: number;
  /** The draft as a person saved it, once they changed it. */
  edited: string | null;
  /** What the editing field holds while the draft is being changed. */
  editing: string | null;
  /** Counts the rewrites, so a rewritten draft arrives as a new text. */
  rewrites: number;
  /** The reply that was sent. */
  sent: string | null;
};

export type InboxState = {
  selectedId: string;
  /** A narrow page shows the list or the conversation, never both. */
  isReading: boolean;
  live: Record<string, ConversationLive>;
  /** The conversation whose draft is arriving word by word. */
  streamingId: string | null;
  spoken: string;
};

export type InboxAction =
  | { type: 'opened'; id: string }
  | { type: 'closed' }
  | { type: 'regenerated'; id: string }
  | { type: 'editStarted'; id: string }
  | { type: 'draftTyped'; id: string; text: string }
  | { type: 'editSaved'; id: string }
  | { type: 'editCancelled'; id: string }
  | { type: 'sendPressed'; id: string }
  | { type: 'delivered'; id: string }
  | { type: 'reopened'; id: string };

type Step = SessionStep<InboxState, InboxAction>;

const FRESH: ConversationLive = {
  status: 'open',
  variant: 0,
  edited: null,
  editing: null,
  rewrites: 0,
  sent: null,
};

function initialLiveOf() {
  const live: Record<string, ConversationLive> = {};
  for (const conversation of CONVERSATIONS) {
    live[conversation.id] = FRESH;
  }
  return live;
}

const [FIRST, SECOND] = CONVERSATIONS;

export const INITIAL: InboxState = {
  selectedId: FIRST.id,
  isReading: false,
  live: initialLiveOf(),
  streamingId: null,
  spoken: '',
};

/** The reply as it would be sent: what a person saved, or the draft of the agent. */
export function draftOf(conversation: Conversation, live: ConversationLive) {
  return live.edited ?? conversation.drafts[live.variant];
}

export function handledCountOf(state: InboxState) {
  const handled = CONVERSATIONS.filter(
    (conversation) => state.live[conversation.id].status === 'handled'
  );
  return handled.length;
}

/** The next conversation down the list that still waits for a reply, starting again from the top. */
export function nextOpenAfter(state: InboxState, id: string) {
  const index = CONVERSATIONS.findIndex((candidate) => candidate.id === id);
  const after = CONVERSATIONS.slice(index + 1);
  const before = CONVERSATIONS.slice(0, index);
  const others = [...after, ...before];
  const next = others.find(
    (candidate) => state.live[candidate.id].status === 'open'
  );
  return next ?? null;
}

function patched(
  state: InboxState,
  id: string,
  patch: Partial<ConversationLive>
): InboxState {
  const live = { ...state.live[id], ...patch };
  return { ...state, live: { ...state.live, [id]: live } };
}

function isKnown(state: InboxState, id: string) {
  return state.live[id] !== undefined;
}

function opened(state: InboxState, id: string): InboxState {
  if (!isKnown(state, id)) {
    return state;
  }
  const conversation = conversationOf(id);
  const spoken = `${conversation.customer}: ${conversation.subject}`;
  return {
    ...state,
    selectedId: id,
    isReading: true,
    streamingId: null,
    spoken,
  };
}

/** A draft can be rewritten or sent while it is open and nobody is changing it. */
function isReady(live: ConversationLive | undefined) {
  if (!live) {
    return false;
  }
  const isOpen = live.status === 'open';
  const isBeingEdited = live.editing !== null;
  return isOpen && !isBeingEdited;
}

function regenerated(state: InboxState, id: string): InboxState {
  const live = state.live[id];
  if (!isReady(live)) {
    return state;
  }
  const conversation = conversationOf(id);
  const variant = (live.variant + 1) % conversation.drafts.length;
  const rewrites = live.rewrites + 1;
  const next = patched(state, id, { variant, edited: null, rewrites });
  return { ...next, streamingId: id, spoken: 'Draft rewritten' };
}

function editStarted(state: InboxState, id: string): InboxState {
  const live = state.live[id];
  if (!isReady(live)) {
    return state;
  }
  const editing = draftOf(conversationOf(id), live);
  const next = patched(state, id, { editing });
  return { ...next, streamingId: null };
}

function isEditing(state: InboxState, id: string) {
  const live = state.live[id];
  return live !== undefined && live.editing !== null;
}

function draftTyped(state: InboxState, id: string, text: string): InboxState {
  if (!isEditing(state, id)) {
    return state;
  }
  return patched(state, id, { editing: text });
}

/** An empty reply cannot be saved: the button that saves it is off while the field is empty. */
function editSaved(state: InboxState, id: string): InboxState {
  const editing = state.live[id]?.editing ?? null;
  if (editing === null) {
    return state;
  }
  const text = editing.trim();
  if (text === '') {
    return state;
  }
  const next = patched(state, id, { edited: text, editing: null });
  return { ...next, spoken: 'Draft saved' };
}

function editCancelled(state: InboxState, id: string): InboxState {
  if (!isEditing(state, id)) {
    return state;
  }
  return patched(state, id, { editing: null });
}

function sendPressed(state: InboxState, id: string): InboxState {
  if (!isReady(state.live[id])) {
    return state;
  }
  const next = patched(state, id, { status: 'sending' });
  return { ...next, streamingId: null };
}

function delivered(state: InboxState, id: string): InboxState {
  const live = state.live[id];
  if (live?.status !== 'sending') {
    return state;
  }
  const conversation = conversationOf(id);
  const sent = draftOf(conversation, live);
  const next = patched(state, id, { status: 'handled', sent });
  const handled = handledCountOf(next);
  const total = CONVERSATIONS.length;
  const spoken = `Reply sent to ${conversation.customer}. ${handled} of ${total} handled`;
  return { ...next, spoken };
}

function reopened(state: InboxState, id: string): InboxState {
  if (state.live[id]?.status !== 'handled') {
    return state;
  }
  const next = patched(state, id, { status: 'open', sent: null });
  return { ...next, spoken: 'Conversation reopened' };
}

export function reducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'opened':
      return opened(state, action.id);
    case 'closed':
      return { ...state, isReading: false };
    case 'regenerated':
      return regenerated(state, action.id);
    case 'editStarted':
      return editStarted(state, action.id);
    case 'draftTyped':
      return draftTyped(state, action.id, action.text);
    case 'editSaved':
      return editSaved(state, action.id);
    case 'editCancelled':
      return editCancelled(state, action.id);
    case 'sendPressed':
      return sendPressed(state, action.id);
    case 'delivered':
      return delivered(state, action.id);
    case 'reopened':
      return reopened(state, action.id);
  }
}

/** How long a reply takes to leave. */
export const SEND_MS = 900;

const KEY_MS = 40;

/** What the demonstration adds to the second draft before it saves it. */
const ADDED_SENTENCE = ' Thank you for flagging it so quickly.';

const [SECOND_DRAFT] = SECOND.drafts;

function typingSteps(startAfter: number): Step[] {
  const prefixes = prefixesOf(ADDED_SENTENCE);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: {
      type: 'draftTyped',
      id: SECOND.id,
      text: `${SECOND_DRAFT}${typed}`,
    },
  }));
}

/**
 * The inbox is already sorted and drafted, so a person does everything from here and every step
 * is the demonstration's, except the reply that leaves on its own once Send is pressed. The first
 * draft is rewritten and sent, then the second one is edited and saved.
 */
export const SCRIPT: Step[] = [
  {
    after: 1500,
    by: 'demo',
    press: `row-${FIRST.id}`,
    action: { type: 'opened', id: FIRST.id },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'regenerate',
    action: { type: 'regenerated', id: FIRST.id },
  },
  {
    after: 3400,
    by: 'demo',
    press: 'send',
    action: { type: 'sendPressed', id: FIRST.id },
  },
  { after: SEND_MS, action: { type: 'delivered', id: FIRST.id } },
  { after: 1700, by: 'demo', press: 'back', action: { type: 'closed' } },
  {
    after: 1400,
    by: 'demo',
    press: `row-${SECOND.id}`,
    action: { type: 'opened', id: SECOND.id },
  },
  {
    after: 1700,
    by: 'demo',
    press: 'edit',
    action: { type: 'editStarted', id: SECOND.id },
  },
  ...typingSteps(900),
  {
    after: 800,
    by: 'demo',
    press: 'save',
    action: { type: 'editSaved', id: SECOND.id },
  },
];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

/**
 * Under reduced motion the inbox rests where the script ends: the first conversation is handled in
 * its place, and the second one is open with the draft a person just changed.
 */
export const RESTING: InboxState = { ...endOf(SCRIPT), spoken: '' };

export const LOOP_AFTER_MS = 4200;
