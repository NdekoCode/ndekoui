import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const PULL_REQUEST = {
  title: 'Compute the average order value',
  file: 'lib/orders/average.ts',
  commit: 'a1b2c3d',
};

export const CODER = { name: 'Coder', series: 5 as SeriesSlot };

export const REVIEWER = {
  name: 'Lena Brandt',
};

export type LineKind = 'same' | 'added' | 'removed';

export type DiffLine = {
  key: string;
  kind: LineKind;
  text: string;
};

/** The line the demonstration comments on, and the one the suggestion rewrites. */
export const TARGET_LINE = 'divide';

export const OLD_THREAD_LINE = 'loop';

const BEFORE_TARGET: DiffLine[] = [
  {
    key: 'signature',
    kind: 'same',
    text: 'export function averageOrderValue(orders: Order[]) {',
  },
  { key: 'old-return', kind: 'removed', text: '  return totalOf(orders);' },
  { key: 'total', kind: 'added', text: '  const total = totalOf(orders);' },
];

const TARGET: DiffLine = {
  key: TARGET_LINE,
  kind: 'added',
  text: '  return total / orders.length;',
};

const AFTER_TARGET: DiffLine[] = [
  { key: 'close', kind: 'same', text: '}' },
  { key: 'blank', kind: 'same', text: '' },
  {
    key: 'total-signature',
    kind: 'same',
    text: 'export function totalOf(orders: Order[]) {',
  },
  { key: 'let', kind: 'same', text: '  let total = 0;' },
  {
    key: OLD_THREAD_LINE,
    kind: 'same',
    text: '  for (const order of orders) {',
  },
  { key: 'add', kind: 'same', text: '    total += order.amountCents;' },
  { key: 'loop-close', kind: 'same', text: '  }' },
  { key: 'return-total', kind: 'same', text: '  return total;' },
  { key: 'total-close', kind: 'same', text: '}' },
];

export const GUARD_LINES: DiffLine[] = [
  { key: 'guard', kind: 'added', text: '  if (orders.length === 0) {' },
  { key: 'guard-return', kind: 'added', text: '    return 0;' },
  { key: 'guard-close', kind: 'added', text: '  }' },
];

export const GUARD_KEYS = new Set(GUARD_LINES.map((line) => line.key));

export function fileLinesOf(hasGuard: boolean): DiffLine[] {
  if (hasGuard) {
    return [...BEFORE_TARGET, ...GUARD_LINES, TARGET, ...AFTER_TARGET];
  }
  return [...BEFORE_TARGET, TARGET, ...AFTER_TARGET];
}

/** The change the agent proposes, as its own small diff. */
export const SUGGESTION: DiffLine[] = [
  ...GUARD_LINES,
  { ...TARGET, kind: 'same' },
];

export const DEMO_COMMENT = 'This should handle an empty list';

export const SUGGESTION_REPLY =
  'Right: with no orders this divides by zero and returns NaN. Returning 0 keeps the dashboard readable.';

export const NOTE_REPLY =
  'Noted. I have no change to suggest on this line, tell me what you would like instead.';

export const OLD_COMMENT = 'Could this be a reduce?';

export const OLD_REPLY =
  'A loop reads plainer here and matches the rest of the file, so I kept it.';

export type NumberedLine = DiffLine & {
  oldNumber: number | null;
  newNumber: number | null;
};

export function numbered(lines: DiffLine[]): NumberedLine[] {
  const result: NumberedLine[] = [];
  let oldNumber = 11;
  let newNumber = 11;
  for (const line of lines) {
    if (line.kind === 'removed') {
      oldNumber += 1;
      result.push({ ...line, oldNumber, newNumber: null });
      continue;
    }
    if (line.kind === 'added') {
      newNumber += 1;
      result.push({ ...line, oldNumber: null, newNumber });
      continue;
    }
    oldNumber += 1;
    newNumber += 1;
    result.push({ ...line, oldNumber, newNumber });
  }
  return result;
}

export function countOfKind(lines: DiffLine[], kind: LineKind) {
  const matching = lines.filter((line) => line.kind === kind);
  return matching.length;
}
