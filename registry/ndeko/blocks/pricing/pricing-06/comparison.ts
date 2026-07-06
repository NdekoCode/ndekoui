import type { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';

import {
  type Cell,
  type Group,
  GROUPS,
  type Plan,
  PLANS,
  type Row,
} from './data';

/** How a row of either view comes and goes: its height and its opacity. */
export type RowPresence = ReturnType<typeof rowPresenceOf>;

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return PRICE_FORMATTER.format(amount);
}

/** The featured plan carries the one primary action of the block. */
export function actionVariantOf(plan: Plan) {
  if (plan.isFeatured) {
    return 'default' as const;
  }
  return 'outline' as const;
}

/** A check and a dash compare by kind, a value by its text. */
function signatureOf(cell: Cell) {
  if (cell.kind === 'value') {
    return cell.text;
  }
  return cell.kind;
}

function isSameInEveryPlan(row: Row) {
  const cells = PLANS.map((plan) => row.cells[plan.id]);
  const signatures = cells.map(signatureOf);
  const [first] = signatures;
  return signatures.every((signature) => signature === first);
}

function isDifferent(row: Row) {
  return !isSameInEveryPlan(row);
}

/** With Only differences on, a row every plan shares folds away; a group left with no row folds its title too. */
export function visibleRowsOf(group: Group, isOnlyDifferences: boolean) {
  if (!isOnlyDifferences) {
    return group.rows;
  }
  return group.rows.filter(isDifferent);
}

function countSharedRows() {
  let count = 0;
  for (const group of GROUPS) {
    const shared = group.rows.filter(isSameInEveryPlan);
    count += shared.length;
  }
  return count;
}

function countRows() {
  let count = 0;
  for (const group of GROUPS) {
    count += group.rows.length;
  }
  return count;
}

const ROW_COUNT = countRows();

const SHARED_ROW_COUNT = countSharedRows();

function hiddenSummaryOf(count: number) {
  const rows = countOf(count, 'row');
  const verb = nounOf(count, 'is', 'are');
  return `${rows} every plan shares ${verb} hidden`;
}

/** The line under the switch, and what a screen reader hears when a person flips it. */
export function filterSummaryOf(isOnlyDifferences: boolean) {
  if (isOnlyDifferences) {
    return hiddenSummaryOf(SHARED_ROW_COUNT);
  }
  return `All ${ROW_COUNT} features shown`;
}
