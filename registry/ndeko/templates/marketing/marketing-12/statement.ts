import type { StatementLine } from './data';

const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function isCredit(amountCents: number) {
  return amountCents > 0;
}

export function signedAmountOf(amountCents: number) {
  const magnitude = Math.abs(amountCents) / 100;
  const formatted = AMOUNT_FORMAT.format(magnitude);
  if (isCredit(amountCents)) {
    return `+${formatted}`;
  }
  return `-${formatted}`;
}

export function linesReadIn(
  lines: readonly StatementLine[],
  readIds: readonly string[]
) {
  return lines.filter((line) => readIds.includes(line.id));
}

function csvCellOf(text: string) {
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function csvRowOf(line: StatementLine) {
  const amount = (line.amountCents / 100).toFixed(2);
  const description = csvCellOf(line.description);
  const cells = [line.date, description, line.category, amount];
  return cells.join(',');
}

export function csvOf(lines: readonly StatementLine[]) {
  const header = 'date,description,category,amount';
  const rows = lines.map(csvRowOf);
  return [header, ...rows].join('\n');
}
