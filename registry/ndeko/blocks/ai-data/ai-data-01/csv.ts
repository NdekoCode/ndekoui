import {
  HEALTH_LABEL,
  ownerOf,
  PLAN_LABEL,
  REGION_LABEL,
  type Account,
} from './data';
import { ownerIdOf, type Owners } from './session';

const HEADER = [
  'Account',
  'Plan',
  'Region',
  'Seats',
  'Renewal',
  'Health',
  'Owner',
];

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

/** One line per account, with the owner a person may have assigned since the page loaded. */
export function csvRowsOf(accounts: Account[], owners: Owners) {
  const rows = accounts.map((account) => {
    const ownerId = ownerIdOf(owners, account);
    return [
      account.name,
      PLAN_LABEL[account.plan],
      REGION_LABEL[account.region],
      String(account.seats),
      account.renewal,
      HEALTH_LABEL[account.health],
      ownerOf(ownerId).name,
    ];
  });
  return [HEADER, ...rows];
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
