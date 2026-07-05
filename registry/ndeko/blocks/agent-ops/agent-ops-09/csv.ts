import { valueLabelOf, type PivotCell, type PivotTable } from './pivot';

const FORMULA_PREFIXES = ['=', '+', '-', '@'];

/** Spreadsheet apps run a cell that starts with these characters as a formula. */
function neutralizedCellOf(value: string) {
  const startsLikeFormula = FORMULA_PREFIXES.some((prefix) =>
    value.startsWith(prefix)
  );
  if (startsLikeFormula) {
    return `'${value}`;
  }
  return value;
}

function csvCellOf(value: string) {
  const neutralized = neutralizedCellOf(value);
  const escaped = neutralized.replaceAll('"', '""');
  return `"${escaped}"`;
}

function csvLineOf(row: string[]) {
  const cells = row.map(csvCellOf);
  return cells.join(',');
}

/** Figures leave as plain numbers, three decimals at most, so a spreadsheet can add them up. */
function plainOf(cell: PivotCell) {
  if (cell.value === null) {
    return '';
  }
  const rounded = Number(cell.value.toFixed(3));
  return String(rounded);
}

function headingOf(columnKey: string, valueLabel: string) {
  if (columnKey === '') {
    return valueLabel;
  }
  return `${columnKey} ${valueLabel}`;
}

function headerOf(table: PivotTable) {
  const valueLabels = table.values.map(valueLabelOf);
  const header = [table.rowHeader];
  for (const columnKey of table.columnKeys) {
    for (const valueLabel of valueLabels) {
      header.push(headingOf(columnKey, valueLabel));
    }
  }
  if (table.hasColumns) {
    for (const valueLabel of valueLabels) {
      header.push(headingOf('Total', valueLabel));
    }
  }
  return header;
}

function lineOf(
  table: PivotTable,
  label: string,
  cells: PivotCell[],
  totals: PivotCell[]
) {
  const figures = cells.map(plainOf);
  if (!table.hasColumns) {
    return [label, ...figures];
  }
  const totalFigures = totals.map(plainOf);
  return [label, ...figures, ...totalFigures];
}

/** A sub-row is indented under its group, as it is on screen. */
function labelOf(label: string, depth: number) {
  const indent = '  '.repeat(depth);
  return `${indent}${label}`;
}

/** The table as it is on screen: folded groups stay folded in the file. */
export function csvRowsOf(table: PivotTable) {
  const rows = table.rows.map((row) => {
    const label = labelOf(row.label, row.depth);
    return lineOf(table, label, row.cells, row.totals);
  });
  const total = lineOf(table, 'Total', table.grandCells, table.grandTotals);
  return [headerOf(table), ...rows, total];
}

/** Builds the file in the browser and hands it to the download bar: nothing leaves the page. */
export function downloadCsv(fileName: string, rows: string[][]) {
  const lines = rows.map(csvLineOf);
  const text = lines.join('\n');
  const file = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
