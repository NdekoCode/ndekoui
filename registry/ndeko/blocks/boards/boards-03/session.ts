import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  CARD_PREFIX,
  CARDS,
  COLUMNS,
  PEOPLE,
  type Card,
  type Column,
  type ColumnId,
  type LaneId,
  type PersonId,
} from './data';

export type View = 'board' | 'lanes';

export type BoardState = {
  /** In the order they show in their column: a card that moves goes to the end, or to the place it is given. */
  cards: Card[];
  view: View;
  composerColumn: ColumnId | null;
  composerText: string;
  /** The card just added: it fades in once, in the view it was added in. */
  freshId: string | null;
  nextNumber: number;
  spoken: string;
};

export type BoardAction =
  | {
      type: 'moved';
      id: string;
      column: ColumnId;
      /** The lane it was dropped in; left out, the card keeps its person. */
      lane?: LaneId;
      /** Its place among the cards of the column; left out, it goes last. */
      index?: number;
      isDrop: boolean;
    }
  | { type: 'viewChanged'; view: View }
  | { type: 'composerOpened'; column: ColumnId }
  | { type: 'composerClosed' }
  | { type: 'composerTyped'; value: string }
  | { type: 'cardAdded' };

type Step = SessionStep<BoardState, BoardAction>;

function highestNumberOf(cards: Card[]) {
  let highest = 0;
  for (const card of cards) {
    const digits = card.number.replace(/\D/g, '');
    const value = Number(digits);
    highest = Math.max(highest, value);
  }
  return highest;
}

export const INITIAL: BoardState = {
  cards: CARDS,
  view: 'board',
  composerColumn: null,
  composerText: '',
  freshId: null,
  nextNumber: highestNumberOf(CARDS) + 1,
  spoken: '',
};

export function columnOf(id: ColumnId) {
  const column = COLUMNS.find((candidate) => candidate.id === id);
  return column ?? COLUMNS[0];
}

export function personOf(id: PersonId | null) {
  return PEOPLE.find((person) => person.id === id);
}

export function laneNameOf(lane: LaneId) {
  if (lane === 'unassigned') {
    return 'Unassigned';
  }
  const person = personOf(lane);
  if (person) {
    return person.name;
  }
  return lane;
}

function isInLane(card: Card, lane: LaneId) {
  if (lane === 'unassigned') {
    return card.assignee === null;
  }
  return card.assignee === lane;
}

export function cardsIn(cards: Card[], column: ColumnId) {
  return cards.filter((card) => card.column === column);
}

export function cardsInCell(cards: Card[], column: ColumnId, lane: LaneId) {
  const inColumn = cardsIn(cards, column);
  return inColumn.filter((card) => isInLane(card, lane));
}

export function cardsOfLane(cards: Card[], lane: LaneId) {
  return cards.filter((card) => isInLane(card, lane));
}

/** One lane per person, and one for the cards nobody holds, only while there are some. */
export function lanesOf(cards: Card[]): LaneId[] {
  const people: LaneId[] = PEOPLE.map((person) => person.id);
  const hasUnassigned = cards.some((card) => card.assignee === null);
  if (hasUnassigned) {
    return [...people, 'unassigned'];
  }
  return people;
}

export function overByOf(column: Column, count: number) {
  if (column.limit === null) {
    return 0;
  }
  const extra = count - column.limit;
  return Math.max(extra, 0);
}

/** Where every card sits and how the board is arranged: cards measure themselves again only when it changes. */
export function placementOf(state: BoardState) {
  const places = state.cards.map(
    (card) => `${card.id}:${card.column}:${card.assignee}:${card.drops}`
  );
  places.push(state.view);
  return places.join(' ');
}

function overByIn(cards: Card[], id: ColumnId) {
  const column = columnOf(id);
  const count = cardsIn(cards, id).length;
  return overByOf(column, count);
}

/** What a move changes about the limits, said once: over a limit, or back within it. */
function limitNoteOf(
  before: Card[],
  after: Card[],
  from: ColumnId | null,
  to: ColumnId
) {
  const toBefore = overByIn(before, to);
  const toAfter = overByIn(after, to);
  if (toAfter > toBefore) {
    const toName = columnOf(to).name;
    return `${toName} is over its limit by ${toAfter}`;
  }
  if (from === null) {
    return '';
  }
  const fromBefore = overByIn(before, from);
  const fromAfter = overByIn(after, from);
  const isBackWithin = fromBefore > 0 && fromAfter === 0;
  if (isBackWithin) {
    const fromName = columnOf(from).name;
    return `${fromName} is back within its limit`;
  }
  return '';
}

function assigneeAfterOf(card: Card, lane: LaneId | undefined) {
  if (lane === undefined) {
    return card.assignee;
  }
  if (lane === 'unassigned') {
    return null;
  }
  return lane;
}

/** Puts the card before the card that holds its place in the column, or after the last one. */
function placedAmong(others: Card[], card: Card, index: number | undefined) {
  if (index === undefined) {
    return [...others, card];
  }
  const column = cardsIn(others, card.column);
  const holder = column[index];
  if (!holder) {
    return [...others, card];
  }
  const at = others.indexOf(holder);
  return [...others.slice(0, at), card, ...others.slice(at)];
}

type Move = Extract<BoardAction, { type: 'moved' }>;

function moved(state: BoardState, action: Move): BoardState {
  const card = state.cards.find((candidate) => candidate.id === action.id);
  if (!card) {
    return state;
  }
  const assignee = assigneeAfterOf(card, action.lane);
  const isSameColumn = card.column === action.column;
  const isSamePerson = card.assignee === assignee;
  if (isSameColumn && isSamePerson) {
    return state;
  }
  let drops = card.drops;
  if (action.isDrop) {
    drops += 1;
  }
  const next: Card = { ...card, column: action.column, assignee, drops };
  const others = state.cards.filter((candidate) => candidate.id !== card.id);
  const cards = placedAmong(others, next, action.index);
  const spoken = limitNoteOf(state.cards, cards, card.column, action.column);
  return { ...state, cards, freshId: null, spoken };
}

function viewLineOf(view: View) {
  if (view === 'lanes') {
    return 'Cards grouped by person';
  }
  return 'All cards on one board';
}

function withNoteOf(line: string, note: string) {
  if (note === '') {
    return line;
  }
  return `${line}. ${note}`;
}

function cardAdded(state: BoardState): BoardState {
  const column = state.composerColumn;
  const title = state.composerText.trim();
  const isEmpty = title === '';
  if (!column || isEmpty) {
    return state;
  }
  const number = state.nextNumber;
  const card: Card = {
    id: `tw-${number}`,
    number: `${CARD_PREFIX}-${number}`,
    title,
    column,
    assignee: null,
    drops: 0,
  };
  const cards = [...state.cards, card];
  const note = limitNoteOf(state.cards, cards, null, column);
  const columnName = columnOf(column).name;
  const added = `${title} added to ${columnName}`;
  const spoken = withNoteOf(added, note);
  return {
    ...state,
    cards,
    composerText: '',
    freshId: card.id,
    nextNumber: number + 1,
    spoken,
  };
}

export function reducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'moved':
      return moved(state, action);
    case 'viewChanged':
      return {
        ...state,
        view: action.view,
        composerColumn: null,
        freshId: null,
        spoken: viewLineOf(action.view),
      };
    case 'composerOpened':
      return { ...state, composerColumn: action.column, composerText: '' };
    case 'composerClosed':
      return { ...state, composerColumn: null, composerText: '' };
    case 'composerTyped':
      return { ...state, composerText: action.value };
    case 'cardAdded':
      return cardAdded(state);
  }
}

const OVER_THE_LIMIT: Step = {
  after: 1500,
  by: 'demo',
  action: { type: 'moved', id: 'tw-131', column: 'doing', isDrop: false },
};

/**
 * A card goes into In progress, one more than its limit, and the header answers; it comes back
 * to the top of Todo, then the cards gather by person and spread back onto one board.
 */
export const SCRIPT: Step[] = [
  OVER_THE_LIMIT,
  {
    after: 2600,
    by: 'demo',
    action: {
      type: 'moved',
      id: 'tw-131',
      column: 'todo',
      index: 0,
      isDrop: false,
    },
  },
  {
    after: 1500,
    by: 'demo',
    action: { type: 'viewChanged', view: 'lanes' },
  },
  {
    after: 3200,
    by: 'demo',
    action: { type: 'viewChanged', view: 'board' },
  },
];

/** Under reduced motion In progress rests over its limit, its header saying so. */
export const RESTING: BoardState = {
  ...reducer(INITIAL, OVER_THE_LIMIT.action),
  spoken: '',
};

export const LOOP_AFTER_MS = 2200;
