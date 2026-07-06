import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  ASK_EXAMPLE,
  ASK_FAILED_LINE,
  filtersOfQuestion,
  matchesFilter,
  mergedFilters,
  type Filter,
  type FilterKind,
} from './ask';
import {
  accountOf,
  ACCOUNTS,
  ownerOf,
  PLAN_RANK,
  renewsThisQuarter,
  summaryOf,
  type Account,
  type OwnerId,
} from './data';

export type ViewId = 'all' | 'risk' | 'renewing';

export type View = {
  id: ViewId;
  label: string;
};

export const VIEWS: View[] = [
  { id: 'all', label: 'All' },
  { id: 'risk', label: 'At risk' },
  { id: 'renewing', label: 'Renewing' },
];

export type SortColumn = 'name' | 'plan' | 'seats' | 'renewal';

export type SortDirection = 'asc' | 'desc';

export type Sort = {
  column: SortColumn;
  direction: SortDirection;
};

export const SORT_LABEL: Record<SortColumn, string> = {
  name: 'Account',
  plan: 'Plan',
  seats: 'Seats',
  renewal: 'Renewal',
};

/** A column of figures starts from the largest; names and dates start from the first. */
const FIRST_DIRECTION: Record<SortColumn, SortDirection> = {
  name: 'asc',
  plan: 'desc',
  seats: 'desc',
  renewal: 'asc',
};

const DIRECTION_WORD: Record<SortDirection, string> = {
  asc: 'ascending',
  desc: 'descending',
};

export type BulkMode = 'actions' | 'owners';

export type Owners = Partial<Record<string, OwnerId>>;

export const PAGE_SIZE = 8;

export type AccountsState = {
  question: string;
  hasAskFailed: boolean;
  filters: Filter[];
  view: ViewId;
  sort: Sort;
  page: number;
  selected: string[];
  bulkMode: BulkMode;
  /** The owners a person assigned, by account. The others keep the owner of the data. */
  owners: Owners;
  openSummaries: string[];
  /** A summary is written once: opened again, it is there at once. */
  writtenSummaries: string[];
  /** The summary whose words are arriving. */
  streamingSummary: string | null;
  /** Counts the changes of the rows on screen. Rows only fade in after the first one, never on load. */
  revision: number;
  spoken: string;
};

export type AccountsAction =
  | { type: 'questionTyped'; text: string }
  | { type: 'asked' }
  | { type: 'filterRemoved'; kind: FilterKind }
  | { type: 'filtersCleared' }
  | { type: 'viewPicked'; view: ViewId }
  | { type: 'sorted'; column: SortColumn }
  | { type: 'pageTurned'; page: number }
  | { type: 'rowToggled'; id: string }
  | { type: 'pageToggled' }
  | { type: 'selectionCleared' }
  | { type: 'bulkModeSet'; mode: BulkMode }
  | { type: 'ownerAssigned'; owner: OwnerId }
  | { type: 'exported' }
  | { type: 'summaryToggled'; id: string };

type Step = SessionStep<AccountsState, AccountsAction>;

export const INITIAL: AccountsState = {
  question: '',
  hasAskFailed: false,
  filters: [],
  view: 'all',
  sort: { column: 'name', direction: 'asc' },
  page: 0,
  selected: [],
  bulkMode: 'actions',
  owners: {},
  openSummaries: [],
  writtenSummaries: [],
  streamingSummary: null,
  revision: 0,
  spoken: '',
};

export function ownerIdOf(owners: Owners, account: Account) {
  return owners[account.id] ?? account.owner;
}

function isInView(account: Account, view: ViewId) {
  if (view === 'risk') {
    return account.health === 'risk';
  }
  if (view === 'renewing') {
    return renewsThisQuarter(account);
  }
  return true;
}

/** The accounts the filters keep, whatever the view. The tabs count from them. */
export function matchingOf(filters: Filter[]) {
  return ACCOUNTS.filter((account) =>
    filters.every((filter) => matchesFilter(account, filter))
  );
}

export function viewCountOf(matching: Account[], view: ViewId) {
  const inView = matching.filter((account) => isInView(account, view));
  return inView.length;
}

function orderOf(first: Account, second: Account, column: SortColumn) {
  if (column === 'seats') {
    return first.seats - second.seats;
  }
  if (column === 'plan') {
    return PLAN_RANK[first.plan] - PLAN_RANK[second.plan];
  }
  if (column === 'renewal') {
    return first.renewal.localeCompare(second.renewal);
  }
  return first.name.localeCompare(second.name);
}

/** Two accounts level on the sorted column keep the order of their names, whatever the direction. */
function sortedBy(accounts: Account[], sort: Sort) {
  const sorted = [...accounts];
  sorted.sort((first, second) => {
    const order = orderOf(first, second, sort.column);
    if (order === 0) {
      return first.name.localeCompare(second.name);
    }
    if (sort.direction === 'desc') {
      return -order;
    }
    return order;
  });
  return sorted;
}

export function resultOf(filters: Filter[], view: ViewId, sort: Sort) {
  const matching = matchingOf(filters);
  const inView = matching.filter((account) => isInView(account, view));
  return sortedBy(inView, sort);
}

export function pageCountOf(total: number) {
  const pages = Math.ceil(total / PAGE_SIZE);
  return Math.max(1, pages);
}

export function pageRowsOf(result: Account[], page: number) {
  const start = page * PAGE_SIZE;
  return result.slice(start, start + PAGE_SIZE);
}

export function accountsWordOf(count: number) {
  if (count === 1) {
    return 'account';
  }
  return 'accounts';
}

function countLineOf(count: number) {
  return `${count} ${accountsWordOf(count)}`;
}

function resultOfState(state: AccountsState) {
  return resultOf(state.filters, state.view, state.sort);
}

/** The bar shows its actions again once nothing is selected. */
function bulkModeFor(selected: string[], mode: BulkMode): BulkMode {
  if (selected.length === 0) {
    return 'actions';
  }
  return mode;
}

/**
 * The rows changed: the list starts again at its first page, and a selected account that left the
 * list leaves the selection, so a bulk action never touches a row nobody can see.
 */
function withNewResult(
  state: AccountsState,
  spokenOf: (count: number) => string
): AccountsState {
  const result = resultOfState(state);
  const visibleIds = result.map((account) => account.id);
  const selected = state.selected.filter((id) => visibleIds.includes(id));
  return {
    ...state,
    page: 0,
    selected,
    bulkMode: bulkModeFor(selected, state.bulkMode),
    streamingSummary: null,
    revision: state.revision + 1,
    spoken: spokenOf(result.length),
  };
}

function matchLineOf(count: number) {
  if (count === 1) {
    return '1 account matches';
  }
  return `${count} accounts match`;
}

function asked(state: AccountsState): AccountsState {
  const askedFilters = filtersOfQuestion(state.question);
  if (!askedFilters) {
    return { ...state, hasAskFailed: true, spoken: ASK_FAILED_LINE };
  }
  const filters = mergedFilters(state.filters, askedFilters);
  const next = { ...state, filters, question: '', hasAskFailed: false };
  return withNewResult(next, matchLineOf);
}

function filterRemoved(state: AccountsState, kind: FilterKind): AccountsState {
  const filters = state.filters.filter((filter) => filter.kind !== kind);
  const next = { ...state, filters };
  return withNewResult(
    next,
    (count) => `Filter removed, ${countLineOf(count)}`
  );
}

function filtersCleared(state: AccountsState): AccountsState {
  const next = { ...state, filters: [], hasAskFailed: false };
  return withNewResult(next, (count) => `No filter, ${countLineOf(count)}`);
}

function viewLabelOf(id: ViewId) {
  const view = VIEWS.find((candidate) => candidate.id === id);
  return view?.label ?? '';
}

function viewPicked(state: AccountsState, view: ViewId): AccountsState {
  if (state.view === view) {
    return state;
  }
  const label = viewLabelOf(view);
  const next = { ...state, view };
  return withNewResult(next, (count) => `${label}, ${countLineOf(count)}`);
}

function directionAfter(sort: Sort, column: SortColumn): SortDirection {
  if (sort.column !== column) {
    return FIRST_DIRECTION[column];
  }
  if (sort.direction === 'asc') {
    return 'desc';
  }
  return 'asc';
}

function sorted(state: AccountsState, column: SortColumn): AccountsState {
  const direction = directionAfter(state.sort, column);
  const spoken = `Sorted by ${SORT_LABEL[column]}, ${DIRECTION_WORD[direction]}`;
  return {
    ...state,
    sort: { column, direction },
    page: 0,
    streamingSummary: null,
    revision: state.revision + 1,
    spoken,
  };
}

function pageTurned(state: AccountsState, target: number): AccountsState {
  const result = resultOfState(state);
  const pageCount = pageCountOf(result.length);
  const lastPage = pageCount - 1;
  const atLeastFirst = Math.max(0, target);
  const page = Math.min(lastPage, atLeastFirst);
  if (page === state.page) {
    return state;
  }
  return {
    ...state,
    page,
    streamingSummary: null,
    revision: state.revision + 1,
    spoken: `Page ${page + 1} of ${pageCount}`,
  };
}

function selectedLineOf(count: number) {
  if (count === 0) {
    return 'Nothing selected';
  }
  return `${count} selected`;
}

function withSelection(state: AccountsState, selected: string[]) {
  return {
    ...state,
    selected,
    bulkMode: bulkModeFor(selected, state.bulkMode),
    spoken: selectedLineOf(selected.length),
  };
}

function rowToggled(state: AccountsState, id: string): AccountsState {
  const isSelected = state.selected.includes(id);
  if (isSelected) {
    const selected = state.selected.filter((candidate) => candidate !== id);
    return withSelection(state, selected);
  }
  return withSelection(state, [...state.selected, id]);
}

/** The box of the header selects the rows of the page, or lets go of them when they all are. */
function pageToggled(state: AccountsState): AccountsState {
  const rows = pageRowsOf(resultOfState(state), state.page);
  const pageIds = rows.map((account) => account.id);
  if (pageIds.length === 0) {
    return state;
  }
  const isPageSelected = pageIds.every((id) => state.selected.includes(id));
  if (isPageSelected) {
    const selected = state.selected.filter((id) => !pageIds.includes(id));
    return withSelection(state, selected);
  }
  const missing = pageIds.filter((id) => !state.selected.includes(id));
  return withSelection(state, [...state.selected, ...missing]);
}

function ownerAssigned(state: AccountsState, owner: OwnerId): AccountsState {
  const count = state.selected.length;
  if (count === 0) {
    return state;
  }
  const owners: Owners = { ...state.owners };
  for (const id of state.selected) {
    owners[id] = owner;
  }
  const spoken = `${countLineOf(count)} assigned to ${ownerOf(owner).name}`;
  return { ...state, owners, selected: [], bulkMode: 'actions', spoken };
}

function summaryToggled(state: AccountsState, id: string): AccountsState {
  const isOpen = state.openSummaries.includes(id);
  if (isOpen) {
    const openSummaries = state.openSummaries.filter(
      (candidate) => candidate !== id
    );
    return { ...state, openSummaries, streamingSummary: null, spoken: '' };
  }
  const account = accountOf(id);
  const openSummaries = [...state.openSummaries, id];
  const spoken = `${account.name}: ${summaryOf(account)}`;
  const isWritten = state.writtenSummaries.includes(id);
  if (isWritten) {
    return { ...state, openSummaries, streamingSummary: null, spoken };
  }
  return {
    ...state,
    openSummaries,
    writtenSummaries: [...state.writtenSummaries, id],
    streamingSummary: id,
    spoken,
  };
}

export function reducer(
  state: AccountsState,
  action: AccountsAction
): AccountsState {
  switch (action.type) {
    case 'questionTyped':
      return { ...state, question: action.text, hasAskFailed: false };
    case 'asked':
      return asked(state);
    case 'filterRemoved':
      return filterRemoved(state, action.kind);
    case 'filtersCleared':
      return filtersCleared(state);
    case 'viewPicked':
      return viewPicked(state, action.view);
    case 'sorted':
      return sorted(state, action.column);
    case 'pageTurned':
      return pageTurned(state, action.page);
    case 'rowToggled':
      return rowToggled(state, action.id);
    case 'pageToggled':
      return pageToggled(state);
    case 'selectionCleared':
      return withSelection(state, []);
    case 'bulkModeSet':
      return { ...state, bulkMode: bulkModeFor(state.selected, action.mode) };
    case 'ownerAssigned':
      return ownerAssigned(state, action.owner);
    case 'exported': {
      const spoken = `${countLineOf(state.selected.length)} exported`;
      return { ...state, spoken };
    }
    case 'summaryToggled':
      return summaryToggled(state, action.id);
  }
}

const KEY_MS = 45;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'questionTyped', text: typed },
  }));
}

/** The two enterprise accounts of Europe that renew this quarter, and the one summarised at the end. */
const FIRST_ROW = 'greyfriars-bank';

const SECOND_ROW = 'halden-works';

/**
 * A person does everything here, so every step is the demonstration's: a question becomes three
 * chips, one is taken off, the two accounts that renew this quarter get a new owner, then the
 * largest one is summarised.
 */
export const SCRIPT: Step[] = [
  ...typingSteps(ASK_EXAMPLE, 1200),
  { after: 500, by: 'demo', press: 'ask', action: { type: 'asked' } },
  {
    after: 1900,
    by: 'demo',
    press: 'chip-seatsOver',
    action: { type: 'filterRemoved', kind: 'seatsOver' },
  },
  {
    after: 1700,
    by: 'demo',
    press: 'view-renewing',
    action: { type: 'viewPicked', view: 'renewing' },
  },
  {
    after: 1400,
    by: 'demo',
    press: `select-${FIRST_ROW}`,
    action: { type: 'rowToggled', id: FIRST_ROW },
  },
  {
    after: 650,
    by: 'demo',
    press: `select-${SECOND_ROW}`,
    action: { type: 'rowToggled', id: SECOND_ROW },
  },
  {
    after: 1300,
    by: 'demo',
    press: 'assign',
    action: { type: 'bulkModeSet', mode: 'owners' },
  },
  {
    after: 1100,
    by: 'demo',
    press: 'owner-priya',
    action: { type: 'ownerAssigned', owner: 'priya' },
  },
  {
    after: 1600,
    by: 'demo',
    press: 'view-all',
    action: { type: 'viewPicked', view: 'all' },
  },
  {
    after: 1400,
    by: 'demo',
    press: 'sort-seats',
    action: { type: 'sorted', column: 'seats' },
  },
  {
    after: 1500,
    by: 'demo',
    press: `summarize-${FIRST_ROW}`,
    action: { type: 'summaryToggled', id: FIRST_ROW },
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
 * Under reduced motion the table rests where the script ends: two chips, the five accounts sorted
 * by seats, two of them with their new owner, and the summary of the first one written out.
 */
export const RESTING: AccountsState = {
  ...endOf(SCRIPT),
  streamingSummary: null,
  spoken: '',
};

/** The summary takes about two seconds to arrive, then the table is left to read. */
export const LOOP_AFTER_MS = 5600;
