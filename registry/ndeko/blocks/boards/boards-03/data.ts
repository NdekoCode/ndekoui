export type ColumnId = 'todo' | 'doing' | 'review' | 'done';

export type PersonId = 'amara' | 'lucas' | 'priya';

/** A lane of the swimlanes: a person, or the cards nobody holds yet. */
export type LaneId = PersonId | 'unassigned';

export type Column = {
  id: ColumnId;
  name: string;
  /** How many cards the column should hold at most, or null when it has no limit. */
  limit: number | null;
  /** The dot before the name: what the column means, never how full it is. */
  dot: string;
};

export type Person = {
  id: PersonId;
  name: string;
};

export type Card = {
  id: string;
  number: string;
  title: string;
  column: ColumnId;
  assignee: PersonId | null;
  /** Counts the drops: a dropped card lands where it was let go, it does not travel from its column. */
  drops: number;
};

export const BOARD_NAME = 'Product board';

export const CARD_PREFIX = 'TW';

export const TITLE_MAX_LENGTH = 80;

export const COLUMNS: Column[] = [
  { id: 'todo', name: 'Todo', limit: null, dot: 'bg-muted-foreground' },
  { id: 'doing', name: 'In progress', limit: 3, dot: 'bg-info' },
  { id: 'review', name: 'In review', limit: 2, dot: 'bg-primary' },
  { id: 'done', name: 'Done', limit: null, dot: 'bg-success' },
];

export const PEOPLE: Person[] = [
  { id: 'amara', name: 'Amara Okafor' },
  { id: 'lucas', name: 'Lucas Moreau' },
  { id: 'priya', name: 'Priya Raman' },
];

export const CARDS: Card[] = [
  {
    id: 'tw-131',
    number: 'TW-131',
    title: 'Write the release notes for 2.4',
    column: 'todo',
    assignee: 'priya',
    drops: 0,
  },
  {
    id: 'tw-129',
    number: 'TW-129',
    title: 'Fix the focus ring of the date picker',
    column: 'todo',
    assignee: 'lucas',
    drops: 0,
  },
  {
    id: 'tw-127',
    number: 'TW-127',
    title: 'Interview two pilot teams about planning',
    column: 'todo',
    assignee: 'amara',
    drops: 0,
  },
  {
    id: 'tw-124',
    number: 'TW-124',
    title: 'Export timesheets as CSV',
    column: 'doing',
    assignee: 'lucas',
    drops: 0,
  },
  {
    id: 'tw-122',
    number: 'TW-122',
    title: 'Redraw the onboarding checklist for phones',
    column: 'doing',
    assignee: 'amara',
    drops: 0,
  },
  {
    id: 'tw-121',
    number: 'TW-121',
    title: 'Paginate the invoices endpoint',
    column: 'doing',
    assignee: 'priya',
    drops: 0,
  },
  {
    id: 'tw-118',
    number: 'TW-118',
    title: 'Empty state for a project without tasks',
    column: 'review',
    assignee: 'amara',
    drops: 0,
  },
  {
    id: 'tw-115',
    number: 'TW-115',
    title: 'Audit the contrast of the status chips',
    column: 'done',
    assignee: 'priya',
    drops: 0,
  },
  {
    id: 'tw-112',
    number: 'TW-112',
    title: 'Plan the reports beta with two customers',
    column: 'done',
    assignee: 'lucas',
    drops: 0,
  },
];
