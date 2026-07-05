import {
  DIMENSION_VALUES,
  fieldOf,
  isDimension,
  isMeasure,
  type DimensionId,
  type FieldId,
  type MeasureId,
  type RunRecord,
} from './data';

export type Aggregation = 'sum' | 'avg' | 'count';

export const AGGREGATIONS: Aggregation[] = ['sum', 'avg', 'count'];

export const AGGREGATION_WORD: Record<Aggregation, string> = {
  sum: 'Sum',
  avg: 'Average',
  count: 'Count',
};

export type ValueSpec = {
  measure: MeasureId;
  aggregation: Aggregation;
};

export type FilterSpec = {
  field: DimensionId;
  /** The values that are kept. */
  values: string[];
};

export type Wells = {
  filters: FilterSpec[];
  columns: DimensionId[];
  rows: DimensionId[];
  values: ValueSpec[];
};

export type WellId = 'filters' | 'columns' | 'rows' | 'values';

export const WELL_IDS: WellId[] = ['filters', 'columns', 'rows', 'values'];

export const WELL_LABEL: Record<WellId, string> = {
  filters: 'Filters',
  columns: 'Columns',
  rows: 'Rows',
  values: 'Values',
};

/** How many fields a well holds. One more replaces the last one. */
const CAPACITY: Record<WellId, number> = {
  filters: 3,
  columns: 1,
  rows: 2,
  values: 2,
};

export const EMPTY_WELLS: Wells = {
  filters: [],
  columns: [],
  rows: [],
  values: [],
};

/** Measures are figures and go to Values; everything else groups or filters. */
export function canAccept(well: WellId, field: FieldId) {
  if (well === 'values') {
    return isMeasure(field);
  }
  return isDimension(field);
}

export function wellOf(wells: Wells, field: FieldId): WellId | null {
  if (wells.filters.some((filter) => filter.field === field)) {
    return 'filters';
  }
  if (wells.columns.some((dimension) => dimension === field)) {
    return 'columns';
  }
  if (wells.rows.some((dimension) => dimension === field)) {
    return 'rows';
  }
  if (wells.values.some((value) => value.measure === field)) {
    return 'values';
  }
  return null;
}

export function removed(wells: Wells, field: FieldId): Wells {
  return {
    filters: wells.filters.filter((filter) => filter.field !== field),
    columns: wells.columns.filter((dimension) => dimension !== field),
    rows: wells.rows.filter((dimension) => dimension !== field),
    values: wells.values.filter((value) => value.measure !== field),
  };
}

/** Keeps the first entries and gives the last place to the newcomer. */
function fitted<Entry>(entries: Entry[], entry: Entry, capacity: number) {
  const kept = entries.slice(0, capacity - 1);
  return [...kept, entry];
}

/** Only finished runs by default, the usual first question about a status. */
function defaultFilterOf(field: DimensionId): FilterSpec {
  if (field === 'status') {
    return { field, values: ['Done'] };
  }
  return { field, values: DIMENSION_VALUES[field] };
}

function placedDimension(wells: Wells, field: DimensionId, well: WellId) {
  if (well === 'filters') {
    const filter = defaultFilterOf(field);
    const filters = fitted(wells.filters, filter, CAPACITY.filters);
    return { ...wells, filters };
  }
  if (well === 'columns') {
    const columns = fitted(wells.columns, field, CAPACITY.columns);
    return { ...wells, columns };
  }
  const rows = fitted(wells.rows, field, CAPACITY.rows);
  return { ...wells, rows };
}

/** A field sits in one well at a time: placing it takes it out of the well it was in. */
export function placed(wells: Wells, field: FieldId, well: WellId): Wells {
  if (!canAccept(well, field)) {
    return wells;
  }
  if (wellOf(wells, field) === well) {
    return wells;
  }
  const cleared = removed(wells, field);
  if (isMeasure(field)) {
    const spec: ValueSpec = { measure: field, aggregation: 'sum' };
    const values = fitted(cleared.values, spec, CAPACITY.values);
    return { ...cleared, values };
  }
  if (isDimension(field)) {
    return placedDimension(cleared, field, well);
  }
  return wells;
}

export function swapped(wells: Wells): Wells {
  const columns = wells.rows.slice(0, CAPACITY.columns);
  const rows = wells.columns.slice(0, CAPACITY.rows);
  return { ...wells, columns, rows };
}

export function withAggregation(
  wells: Wells,
  measure: MeasureId,
  aggregation: Aggregation
): Wells {
  const values = wells.values.map((value) => {
    if (value.measure === measure) {
      return { ...value, aggregation };
    }
    return value;
  });
  return { ...wells, values };
}

export function withFilterValue(
  wells: Wells,
  field: DimensionId,
  value: string
): Wells {
  const filters = wells.filters.map((filter) => {
    if (filter.field !== field) {
      return filter;
    }
    const isKept = filter.values.includes(value);
    if (isKept) {
      const values = filter.values.filter((candidate) => candidate !== value);
      return { ...filter, values };
    }
    return { ...filter, values: [...filter.values, value] };
  });
  return { ...wells, filters };
}

export function valueLabelOf(spec: ValueSpec) {
  const measure = fieldOf(spec.measure).label.toLowerCase();
  if (spec.aggregation === 'count') {
    return 'Count of runs';
  }
  return `${AGGREGATION_WORD[spec.aggregation]} of ${measure}`;
}

export function filterLabelOf(filter: FilterSpec) {
  const label = fieldOf(filter.field).label;
  const all = DIMENSION_VALUES[filter.field];
  if (filter.values.length === all.length) {
    return `${label}: all`;
  }
  if (filter.values.length === 0) {
    return `${label}: none`;
  }
  if (filter.values.length === 1) {
    return `${label}: ${filter.values[0]}`;
  }
  return `${label}: ${filter.values.length} of ${all.length}`;
}

function passesFilters(record: RunRecord, filters: FilterSpec[]) {
  return filters.every((filter) =>
    filter.values.includes(record[filter.field])
  );
}

function aggregateOf(records: RunRecord[], spec: ValueSpec) {
  if (records.length === 0) {
    return null;
  }
  if (spec.aggregation === 'count') {
    return records.length;
  }
  let sum = 0;
  for (const record of records) {
    sum += record[spec.measure];
  }
  if (spec.aggregation === 'sum') {
    return sum;
  }
  return sum / records.length;
}

/** The values of a dimension that the records hold, in the order of the dimension. */
function presentValuesOf(records: RunRecord[], dimension: DimensionId) {
  return DIMENSION_VALUES[dimension].filter((value) =>
    records.some((record) => record[dimension] === value)
  );
}

function recordsWith(
  records: RunRecord[],
  dimension: DimensionId | undefined,
  value: string
) {
  if (dimension === undefined) {
    return records;
  }
  return records.filter((record) => record[dimension] === value);
}

export type PivotCell = {
  value: number | null;
  /** From 0 to 3 for the cells that are shaded; none for subtotals and totals. */
  heat: number | null;
};

export type PivotRow = {
  key: string;
  label: string;
  depth: number;
  /** A group row sums its children and can fold them. */
  isGroup: boolean;
  /** One cell per column and value, column by column. */
  cells: PivotCell[];
  /** One total per value, across the columns. */
  totals: PivotCell[];
};

export type PivotTable = {
  rowHeader: string;
  /** False without a column field: the cells then are the totals. */
  hasColumns: boolean;
  columnKeys: string[];
  values: ValueSpec[];
  rows: PivotRow[];
  grandCells: PivotCell[];
  grandTotals: PivotCell[];
  recordCount: number;
};

const ALL_COLUMNS = [''];

const HEAT_STEPS = 4;

function plainCellsOf(
  records: RunRecord[],
  columnDimension: DimensionId | undefined,
  columnKeys: string[],
  values: ValueSpec[]
) {
  const cells: PivotCell[] = [];
  for (const columnKey of columnKeys) {
    const inColumn = recordsWith(records, columnDimension, columnKey);
    for (const spec of values) {
      cells.push({ value: aggregateOf(inColumn, spec), heat: null });
    }
  }
  return cells;
}

function totalsOf(records: RunRecord[], values: ValueSpec[]) {
  return values.map((spec): PivotCell => {
    return { value: aggregateOf(records, spec), heat: null };
  });
}

type Range = { min: number; max: number };

/** The range of each value over the rows that are shaded, so a cost never shades a count. */
function rangesOf(rows: PivotRow[], valueCount: number) {
  const ranges: Range[] = [];
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
    ranges.push({ min: Infinity, max: -Infinity });
  }
  for (const row of rows) {
    if (row.isGroup) {
      continue;
    }
    row.cells.forEach((cell, index) => {
      if (cell.value === null) {
        return;
      }
      const range = ranges[index % valueCount];
      range.min = Math.min(range.min, cell.value);
      range.max = Math.max(range.max, cell.value);
    });
  }
  return ranges;
}

function heatOf(value: number, range: Range) {
  const span = range.max - range.min;
  if (span <= 0) {
    return 0;
  }
  const share = (value - range.min) / span;
  const step = Math.floor(share * HEAT_STEPS);
  return Math.min(HEAT_STEPS - 1, step);
}

function shaded(rows: PivotRow[], valueCount: number) {
  const ranges = rangesOf(rows, valueCount);
  return rows.map((row) => {
    if (row.isGroup) {
      return row;
    }
    const cells = row.cells.map((cell, index): PivotCell => {
      if (cell.value === null) {
        return cell;
      }
      const range = ranges[index % valueCount];
      return { value: cell.value, heat: heatOf(cell.value, range) };
    });
    return { ...row, cells };
  });
}

/** Groups the filtered runs by the rows and the column, with a subtotal per group and a grand total. */
export function pivotOf(
  records: RunRecord[],
  wells: Wells,
  collapsed: string[]
): PivotTable {
  const kept = records.filter((record) => passesFilters(record, wells.filters));
  const [columnDimension] = wells.columns;
  const [groupDimension, leafDimension] = wells.rows;
  const values = wells.values;
  let columnKeys = ALL_COLUMNS;
  if (columnDimension) {
    columnKeys = presentValuesOf(kept, columnDimension);
  }

  function rowOf(
    key: string,
    label: string,
    depth: number,
    isGroup: boolean,
    rowRecords: RunRecord[]
  ): PivotRow {
    return {
      key,
      label,
      depth,
      isGroup,
      cells: plainCellsOf(rowRecords, columnDimension, columnKeys, values),
      totals: totalsOf(rowRecords, values),
    };
  }

  const rows: PivotRow[] = [];
  if (!groupDimension) {
    rows.push(rowOf('all', 'All runs', 0, false, kept));
  }
  if (groupDimension) {
    const hasLeaves = leafDimension !== undefined;
    for (const groupValue of presentValuesOf(kept, groupDimension)) {
      const inGroup = recordsWith(kept, groupDimension, groupValue);
      rows.push(rowOf(groupValue, groupValue, 0, hasLeaves, inGroup));
      const isFolded = collapsed.includes(groupValue);
      if (!hasLeaves || isFolded) {
        continue;
      }
      for (const leafValue of presentValuesOf(inGroup, leafDimension)) {
        const inLeaf = recordsWith(inGroup, leafDimension, leafValue);
        const key = `${groupValue}/${leafValue}`;
        rows.push(rowOf(key, leafValue, 1, false, inLeaf));
      }
    }
  }

  let rowHeader = 'Runs';
  if (groupDimension) {
    rowHeader = fieldOf(groupDimension).label;
  }

  return {
    rowHeader,
    hasColumns: columnDimension !== undefined,
    columnKeys,
    values,
    rows: shaded(rows, Math.max(1, values.length)),
    grandCells: plainCellsOf(kept, columnDimension, columnKeys, values),
    grandTotals: totalsOf(kept, values),
    recordCount: kept.length,
  };
}
