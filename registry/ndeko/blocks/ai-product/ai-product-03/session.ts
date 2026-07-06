import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  AGENT,
  LEADS,
  leadOf,
  PASS_IDS,
  STATUS_ORDER,
  type Lead,
  type LeadStatus,
  type OwnerId,
} from './data';

export type Field = 'email' | 'size';

export type SortColumn = 'name' | 'company' | 'status' | 'size';

export type SortDirection = 'asc' | 'desc';

export type Sort = { column: SortColumn; direction: SortDirection };

export type StatusFilter = 'all' | LeadStatus;

export type OwnerFilter = 'all' | OwnerId;

export type LeadsState = {
  query: string;
  status: StatusFilter;
  owner: OwnerFilter;
  /** Null keeps the order of the list. */
  sort: Sort | null;
  page: number;
  selected: string[];
  litId: string | null;
  filling: { id: string; field: Field } | null;
  /** Cells that hold a value, as `id:field`. */
  landed: string[];
  settling: string | null;
  spoken: string;
};

export type LeadsAction =
  | { type: 'queryTyped'; text: string }
  | { type: 'statusPicked'; status: StatusFilter }
  | { type: 'ownerPicked'; owner: OwnerFilter }
  | { type: 'sorted'; column: SortColumn }
  | { type: 'pageTurned'; page: number }
  | { type: 'rowToggled'; id: string }
  | { type: 'pageToggled' }
  | { type: 'selectionCleared' }
  | { type: 'filtersCleared' }
  | { type: 'leadStarted'; id: string }
  | { type: 'fetching'; id: string; field: Field }
  | { type: 'landed'; id: string; field: Field }
  | { type: 'leadFinished'; id: string };

type Step = SessionStep<LeadsState, LeadsAction>;

export const PAGE_SIZE = 8;

export const TOTAL = LEADS.length;

export const INITIAL: LeadsState = {
  query: '',
  status: 'all',
  owner: 'all',
  sort: null,
  page: 0,
  selected: [],
  litId: null,
  filling: null,
  landed: [],
  settling: null,
  spoken: '',
};

export function cellKeyOf(id: string, field: Field) {
  return `${id}:${field}`;
}

export function isLanded(state: LeadsState, id: string, field: Field) {
  const key = cellKeyOf(id, field);
  return state.landed.includes(key);
}

function isEnriched(state: LeadsState, lead: Lead) {
  const hasEmail = isLanded(state, lead.id, 'email');
  const hasSize = isLanded(state, lead.id, 'size');
  return hasEmail && hasSize;
}

export function enrichedCountOf(state: LeadsState) {
  const enriched = LEADS.filter((lead) => isEnriched(state, lead));
  return enriched.length;
}

function matchesQuery(lead: Lead, query: string) {
  const wanted = query.trim().toLowerCase();
  if (wanted === '') {
    return true;
  }
  const text = `${lead.name} ${lead.company} ${lead.city}`;
  const haystack = text.toLowerCase();
  return haystack.includes(wanted);
}

function matchesStatus(lead: Lead, status: StatusFilter) {
  if (status === 'all') {
    return true;
  }
  return lead.status === status;
}

function matchesOwner(lead: Lead, owner: OwnerFilter) {
  if (owner === 'all') {
    return true;
  }
  return lead.owner === owner;
}

function sizeOf(state: LeadsState, lead: Lead) {
  if (isLanded(state, lead.id, 'size')) {
    return lead.employees;
  }
  return null;
}

/** A size the agent has not found yet sorts after every size, in both directions. */
function compareSizes(
  direction: SortDirection,
  first: number | null,
  second: number | null
) {
  if (first === null && second === null) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }
  if (direction === 'asc') {
    return first - second;
  }
  return second - first;
}

function textOrderOf(column: SortColumn, first: Lead, second: Lead) {
  if (column === 'name') {
    return first.name.localeCompare(second.name);
  }
  if (column === 'company') {
    return first.company.localeCompare(second.company);
  }
  return STATUS_ORDER[first.status] - STATUS_ORDER[second.status];
}

function compareLeads(
  state: LeadsState,
  sort: Sort,
  first: Lead,
  second: Lead
) {
  if (sort.column === 'size') {
    const firstSize = sizeOf(state, first);
    const secondSize = sizeOf(state, second);
    return compareSizes(sort.direction, firstSize, secondSize);
  }
  const order = textOrderOf(sort.column, first, second);
  if (sort.direction === 'asc') {
    return order;
  }
  return -order;
}

export function resultOf(state: LeadsState) {
  const kept = LEADS.filter((lead) => {
    const fitsQuery = matchesQuery(lead, state.query);
    const fitsStatus = matchesStatus(lead, state.status);
    const fitsOwner = matchesOwner(lead, state.owner);
    return fitsQuery && fitsStatus && fitsOwner;
  });
  const sort = state.sort;
  if (sort === null) {
    return kept;
  }
  return [...kept].sort((first, second) =>
    compareLeads(state, sort, first, second)
  );
}

export function pageCountOf(total: number) {
  const pages = Math.ceil(total / PAGE_SIZE);
  return Math.max(1, pages);
}

export function pageRowsOf(rows: Lead[], page: number) {
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return rows.slice(start, end);
}

function withFilters(state: LeadsState, changes: Partial<LeadsState>) {
  return { ...state, ...changes, page: 0 };
}

function sorted(state: LeadsState, column: SortColumn): LeadsState {
  const current = state.sort;
  if (current === null || current.column !== column) {
    return { ...state, sort: { column, direction: 'asc' }, page: 0 };
  }
  if (current.direction === 'asc') {
    return { ...state, sort: { column, direction: 'desc' }, page: 0 };
  }
  return { ...state, sort: null, page: 0 };
}

function rowToggled(state: LeadsState, id: string): LeadsState {
  if (state.selected.includes(id)) {
    const rest = state.selected.filter((selectedId) => selectedId !== id);
    return { ...state, selected: rest };
  }
  return { ...state, selected: [...state.selected, id] };
}

function pageToggled(state: LeadsState): LeadsState {
  const rows = pageRowsOf(resultOf(state), state.page);
  const ids = rows.map((lead) => lead.id);
  const isAllSelected = ids.every((id) => state.selected.includes(id));
  if (isAllSelected) {
    const rest = state.selected.filter((id) => !ids.includes(id));
    return { ...state, selected: rest };
  }
  const added = ids.filter((id) => !state.selected.includes(id));
  return { ...state, selected: [...state.selected, ...added] };
}

function landed(state: LeadsState, id: string, field: Field): LeadsState {
  const key = cellKeyOf(id, field);
  return {
    ...state,
    filling: null,
    landed: [...state.landed, key],
    settling: key,
  };
}

function leadFinished(state: LeadsState, id: string): LeadsState {
  const lead = leadOf(id);
  const name = lead?.name ?? id;
  const count = enrichedCountOf(state);
  const spoken = `${AGENT.name} enriched ${name}: ${count} of ${TOTAL} leads`;
  return { ...state, litId: null, spoken };
}

export function reducer(state: LeadsState, action: LeadsAction): LeadsState {
  switch (action.type) {
    case 'queryTyped':
      return withFilters(state, { query: action.text });
    case 'statusPicked':
      return withFilters(state, { status: action.status });
    case 'ownerPicked':
      return withFilters(state, { owner: action.owner });
    case 'sorted':
      return sorted(state, action.column);
    case 'pageTurned':
      return { ...state, page: action.page };
    case 'rowToggled':
      return rowToggled(state, action.id);
    case 'pageToggled':
      return pageToggled(state);
    case 'selectionCleared':
      return { ...state, selected: [] };
    case 'filtersCleared':
      return withFilters(state, { query: '', status: 'all', owner: 'all' });
    case 'leadStarted':
      return { ...state, litId: action.id, settling: null };
    case 'fetching':
      return { ...state, filling: { id: action.id, field: action.field } };
    case 'landed':
      return landed(state, action.id, action.field);
    case 'leadFinished':
      return leadFinished(state, action.id);
  }
}

function leadSteps(id: string): Step[] {
  return [
    { after: 400, action: { type: 'leadStarted', id } },
    { after: 250, action: { type: 'fetching', id, field: 'email' } },
    { after: 850, action: { type: 'landed', id, field: 'email' } },
    { after: 200, action: { type: 'fetching', id, field: 'size' } },
    { after: 700, action: { type: 'landed', id, field: 'size' } },
    { after: 350, action: { type: 'leadFinished', id } },
  ];
}

/** The agent works on its own, so the pass goes on after a person takes over the table. */
export const SCRIPT: Step[] = PASS_IDS.flatMap((id) => leadSteps(id));

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: LeadsState = { ...endOf(SCRIPT), settling: null };

export const LOOP_AFTER_MS = 4800;
