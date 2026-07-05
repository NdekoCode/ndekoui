'use client';

import {
  useSession,
  type SessionConfig,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

import {
  budgetOf,
  compactionOf,
  TURNS,
  type Compaction,
  type ContextSlot,
} from './context';

export type CompactStatus = 'idle' | 'compacting';

const COMPACT_MS = 900;

/** An offer that waits on a person is taken by the demonstration after this long. */
const COMPACT_AFTER_MS = 2500;

export type ContextState = {
  /** How many turns of the conversation the context holds. */
  turnCount: number;
  removedFileIds: string[];
  compaction: Compaction | null;
  compactStatus: CompactStatus;
  /** The part a demonstration points at, in the views that light one part. */
  spotlight: ContextSlot | null;
  /** Whether the breakdown is open, in the views that fold it. */
  isBreakdownOpen: boolean;
};

export type ContextAction =
  | { type: 'turn' }
  | { type: 'removeFile'; fileId: string }
  | { type: 'compact' }
  | { type: 'compacted' }
  | { type: 'spotlight'; slot: ContextSlot | null }
  | { type: 'breakdown'; isOpen: boolean };

export type ContextStep = SessionStep<ContextState, ContextAction>;

export type ContextSession = SessionConfig<ContextState, ContextAction>;

export function contextStateAt(turnCount: number): ContextState {
  return {
    turnCount,
    removedFileIds: [],
    compaction: null,
    compactStatus: 'idle',
    spotlight: null,
    isBreakdownOpen: false,
  };
}

function turnsIn(state: ContextState) {
  return TURNS.slice(0, state.turnCount);
}

/** Compact is offered again only once new turns can be folded into the summary. */
function canCompactIn(state: ContextState) {
  const turns = turnsIn(state);
  const next = compactionOf(turns);
  const foldedNow = state.compaction?.foldedTurns ?? 0;
  const foldableNext = next?.foldedTurns ?? 0;
  const hasNewTurnsToFold = foldableNext > foldedNow;
  const isIdle = state.compactStatus === 'idle';
  return hasNewTurnsToFold && isIdle;
}

function withTurn(state: ContextState): ContextState {
  const hasMore = state.turnCount < TURNS.length;
  if (!hasMore) {
    return state;
  }
  return { ...state, turnCount: state.turnCount + 1 };
}

function withFileRemoved(state: ContextState, fileId: string): ContextState {
  const removedFileIds = [...state.removedFileIds, fileId];
  return { ...state, removedFileIds };
}

function withCompactStarted(state: ContextState): ContextState {
  if (!canCompactIn(state)) {
    return state;
  }
  return { ...state, compactStatus: 'compacting' };
}

/** The script and the hand of a person may both land the same compaction: only the first one counts. */
function withCompactLanded(state: ContextState): ContextState {
  if (state.compactStatus !== 'compacting') {
    return state;
  }
  const turns = turnsIn(state);
  const compaction = compactionOf(turns);
  return { ...state, compaction, compactStatus: 'idle' };
}

export function reduceContext(
  state: ContextState,
  action: ContextAction
): ContextState {
  switch (action.type) {
    case 'turn':
      return withTurn(state);
    case 'removeFile':
      return withFileRemoved(state, action.fileId);
    case 'compact':
      return withCompactStarted(state);
    case 'compacted':
      return withCompactLanded(state);
    case 'spotlight':
      return { ...state, spotlight: action.slot };
    case 'breakdown':
      return { ...state, isBreakdownOpen: action.isOpen };
  }
}

function hasCompacted(state: ContextState) {
  const isCompacting = state.compactStatus === 'compacting';
  const isCompacted = state.compaction !== null;
  return isCompacting || isCompacted;
}

/** A turn that arrives on its own: the conversation going on, which always plays. */
export function turnStep(after: number): ContextStep {
  return { after, action: { type: 'turn' } };
}

/** A message a person sends: the demonstration presses Send for them until they take over. */
export function sendStep(after: number, turnCount: number): ContextStep {
  return {
    after,
    by: 'person',
    press: 'send',
    action: { type: 'turn' },
    isAnswered: (state) => state.turnCount >= turnCount,
  };
}

/** Compact pressed by the demonstration once it is offered, then the summary landing. */
export const COMPACT_STEPS: ContextStep[] = [
  {
    after: COMPACT_AFTER_MS,
    by: 'person',
    press: 'compact',
    action: { type: 'compact' },
    isAnswered: hasCompacted,
  },
  { after: COMPACT_MS, action: { type: 'compacted' } },
];

/** The demos open on a conversation already under way and fill it one turn at a time. */
const OPENING_TURNS = 5;

const TURN_EVERY_MS = 900;

function arrivingTurns(): ContextStep[] {
  const count = TURNS.length - OPENING_TURNS;
  return Array.from({ length: count }, () => turnStep(TURN_EVERY_MS));
}

/** The conversation fills until Compact is offered, the demonstration takes it and the summary lands. */
export const FILLING_SCRIPT: ContextStep[] = [
  ...arrivingTurns(),
  ...COMPACT_STEPS,
];

/**
 * Under reduced motion nothing plays: the context rests full, with Compact on offer, which a person
 * can still take.
 */
export const FILLING_SESSION: ContextSession = {
  reducer: reduceContext,
  initial: contextStateAt(OPENING_TURNS),
  resting: contextStateAt(TURNS.length),
  script: FILLING_SCRIPT,
  loopAfter: 3400,
};

/** A context that fills turn by turn, played as a session: turns arrive, a person removes files and compacts. */
export function useContextSession(session: ContextSession) {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(session);
  const { schedule, clearAll } = useTimeouts();
  const turns = turnsIn(state);
  const { removedFileIds, compaction } = state;
  const budget = budgetOf({ turns, removedFileIds, compaction });
  const budgetBefore = budgetOf({ turns, removedFileIds, compaction: null });
  const canCompact = canCompactIn(state);
  const canReplay = isFinished && !isAutoplaying;

  function removeFile(fileId: string) {
    act({ type: 'removeFile', fileId });
  }

  function compact() {
    if (!canCompact) {
      return;
    }
    act({ type: 'compact' });
    schedule(() => act({ type: 'compacted' }), COMPACT_MS);
  }

  function send() {
    act({ type: 'turn' });
  }

  function setBreakdownOpen(isOpen: boolean) {
    act({ type: 'breakdown', isOpen });
  }

  function replay() {
    clearAll();
    restart();
  }

  return {
    ref,
    isInView,
    isAutoplaying,
    canReplay,
    pressed,
    turns,
    budget,
    budgetBefore,
    compaction,
    compactStatus: state.compactStatus,
    canCompact,
    spotlight: state.spotlight,
    isBreakdownOpen: state.isBreakdownOpen,
    removeFile,
    compact,
    send,
    setBreakdownOpen,
    replay,
  };
}
