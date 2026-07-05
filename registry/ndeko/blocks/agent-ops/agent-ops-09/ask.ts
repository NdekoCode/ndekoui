import {
  DIMENSION_VALUES,
  DIMENSIONS,
  MEASURES,
  type DimensionId,
  type MeasureId,
} from './data';
import type { Aggregation, FilterSpec, ValueSpec, Wells } from './pivot';

export const ASK_EXAMPLE = 'average tokens by model per day';

const MEASURE_WORDS: Record<MeasureId, string[]> = {
  runs: ['runs', 'run'],
  cost: ['cost', 'costs', 'spend', 'spent'],
  tokens: ['tokens', 'token'],
  duration: ['duration', 'time', 'long'],
};

const DIMENSION_WORDS: Record<DimensionId, string[]> = {
  agent: ['agent', 'agents'],
  model: ['model', 'models'],
  day: ['day', 'days', 'daily', 'date'],
  status: ['status', 'outcome'],
  tool: ['tool', 'tools'],
};

const AVERAGE_WORDS = ['average', 'avg', 'mean'];

const COUNT_WORDS = ['count', 'many', 'number'];

/** After one of these the next dimensions become rows. */
const ROW_WORDS = ['by', 'and'];

/** After one of these the next dimension becomes the column. */
const COLUMN_WORDS = ['per', 'across', 'each', 'over'];

const FAILED_WORDS = ['failed', 'failing', 'failures'];

const DONE_WORDS = ['done', 'finished', 'successful', 'succeeded'];

const MAX_ROWS = 2;

function wordsOf(text: string) {
  const lowered = text.toLowerCase();
  const letters = lowered.replace(/[^a-z0-9\s]/g, ' ');
  const trimmed = letters.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

function hasAny(words: string[], candidates: string[]) {
  return words.some((word) => candidates.includes(word));
}

function measureOf(word: string) {
  return MEASURES.find((measure) => MEASURE_WORDS[measure].includes(word));
}

function dimensionOf(word: string) {
  return DIMENSIONS.find((dimension) =>
    DIMENSION_WORDS[dimension].includes(word)
  );
}

function aggregationOf(words: string[]): Aggregation {
  if (hasAny(words, AVERAGE_WORDS)) {
    return 'avg';
  }
  if (hasAny(words, COUNT_WORDS)) {
    return 'count';
  }
  return 'sum';
}

/** A day is named in full or by its first letters: monday and mon both mean Mon. */
function matchesWord(word: string, valueWord: string, dimension: DimensionId) {
  if (dimension === 'day') {
    return word.startsWith(valueWord);
  }
  return word === valueWord;
}

function isNamed(words: string[], value: string, dimension: DimensionId) {
  const valueWords = wordsOf(value);
  return valueWords.every((valueWord) =>
    words.some((word) => matchesWord(word, valueWord, dimension))
  );
}

/** "claude sonnet" or "coder" in the question keeps only that value of its dimension. */
function namedFiltersOf(words: string[]) {
  const filters: FilterSpec[] = [];
  for (const dimension of DIMENSIONS) {
    if (dimension === 'status') {
      continue;
    }
    const named = DIMENSION_VALUES[dimension].filter((value) =>
      isNamed(words, value, dimension)
    );
    if (named.length > 0) {
      filters.push({ field: dimension, values: named });
    }
  }
  return filters;
}

function statusFilterOf(words: string[]): FilterSpec | null {
  if (hasAny(words, FAILED_WORDS)) {
    return { field: 'status', values: ['Failed'] };
  }
  if (hasAny(words, DONE_WORDS)) {
    return { field: 'status', values: ['Done'] };
  }
  return null;
}

type Placement = {
  rows: DimensionId[];
  columns: DimensionId[];
};

/** Walks the words: "by" sends the next dimensions to the rows, "per" sends the next one to the column. */
function placementOf(words: string[]) {
  const placement: Placement = { rows: [], columns: [] };
  let target: keyof Placement = 'rows';
  for (const word of words) {
    if (ROW_WORDS.includes(word)) {
      target = 'rows';
      continue;
    }
    if (COLUMN_WORDS.includes(word)) {
      target = 'columns';
      continue;
    }
    const dimension = dimensionOf(word);
    if (!dimension) {
      continue;
    }
    const isRow = placement.rows.includes(dimension);
    const isColumn = placement.columns.includes(dimension);
    if (isRow || isColumn) {
      continue;
    }
    const wantsColumn = target === 'columns' && placement.columns.length === 0;
    if (wantsColumn) {
      placement.columns.push(dimension);
      continue;
    }
    if (placement.rows.length < MAX_ROWS) {
      placement.rows.push(dimension);
    }
  }
  return placement;
}

/**
 * Reads a plain question into the four wells with a handful of word lists: no model is called.
 * It returns nothing when the question names no field.
 */
export function wellsOfQuestion(text: string): Wells | null {
  const words = wordsOf(text);
  const measures = words.map(measureOf);
  const measure = measures.find((found) => found !== undefined);
  const placement = placementOf(words);
  const namedFilters = namedFiltersOf(words);
  const statusFilter = statusFilterOf(words);
  const hasMeasure = measure !== undefined;
  const hasDimension = placement.rows.length + placement.columns.length > 0;
  const hasFilter = namedFilters.length > 0 || statusFilter !== null;
  const namesSomething = hasMeasure || hasDimension || hasFilter;
  if (!namesSomething) {
    return null;
  }
  const value: ValueSpec = {
    measure: measure ?? 'runs',
    aggregation: aggregationOf(words),
  };
  const filters = [...namedFilters];
  if (statusFilter) {
    filters.push(statusFilter);
  }
  const grouped = [...placement.rows, ...placement.columns];
  const freeFilters = filters.filter(
    (filter) => !grouped.includes(filter.field)
  );
  return {
    filters: freeFilters,
    columns: placement.columns,
    rows: placement.rows,
    values: [value],
  };
}
