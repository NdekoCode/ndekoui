import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const REPOSITORY = {
  owner: 'Kettlebrook',
  name: 'storefront',
  branch: 'fix/discount-applied-twice',
  base: 'main',
};

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const CODER: Agent = { name: 'Coder', series: 5 };

export type Model = {
  name: string;
  brand: BrandSlug;
};

export const MODEL: Model = { name: 'Claude Opus', brand: 'claude' };

export const TASK =
  'The discount code is taken twice at checkout. Fix it and open a pull request.';

export type FileId = 'summary' | 'discount' | 'total' | 'test';

export type RepoFile = {
  id: FileId;
  path: string;
  finding: string;
};

export const FILES: RepoFile[] = [
  {
    id: 'summary',
    path: 'src/checkout/summary.tsx',
    finding: 'Shows the total it is given',
  },
  {
    id: 'discount',
    path: 'src/cart/discount.ts',
    finding: 'Takes a code off an amount',
  },
  {
    id: 'total',
    path: 'src/cart/total.ts',
    finding: 'Takes the code off, then calls discount again',
  },
  {
    id: 'test',
    path: 'src/cart/total.test.ts',
    finding: 'Six tests, none with a code',
  },
];

/** The file where the bug lives: its row is flagged once every file is read. */
export const CAUSE_FILE: FileId = 'total';

export type LineKind = 'same' | 'added' | 'removed';

export type DiffLine = {
  kind: LineKind;
  text: string;
};

export type Hunk = {
  id: string;
  fileId: FileId;
  firstLine: number;
  lines: DiffLine[];
};

/** In the order the agent writes them: the test that fails first, then the fix in two places. */
export const HUNKS: Hunk[] = [
  {
    id: 'test',
    fileId: 'test',
    firstLine: 41,
    lines: [
      { kind: 'same', text: '  });' },
      { kind: 'added', text: "  it('applies a discount code once', () => {" },
      { kind: 'added', text: "    const cart = cartOf([line(48)], 'TEN');" },
      { kind: 'added', text: '    expect(totalOf(cart)).toBe(43.2);' },
      { kind: 'added', text: '  });' },
      { kind: 'same', text: '});' },
    ],
  },
  {
    id: 'import',
    fileId: 'total',
    firstLine: 1,
    lines: [
      {
        kind: 'removed',
        text: "import { applyDiscount, discountOf } from './discount';",
      },
      { kind: 'added', text: "import { applyDiscount } from './discount';" },
      { kind: 'same', text: "import { shippingOf } from './shipping';" },
    ],
  },
  {
    id: 'body',
    fileId: 'total',
    firstLine: 14,
    lines: [
      { kind: 'same', text: 'export function totalOf(cart: Cart) {' },
      { kind: 'same', text: '  const subtotal = subtotalOf(cart.lines);' },
      {
        kind: 'removed',
        text: '  const discounted = subtotal - discountOf(subtotal, cart.code);',
      },
      {
        kind: 'removed',
        text: '  return applyDiscount(discounted, cart.code) + shippingOf(discounted);',
      },
      {
        kind: 'added',
        text: '  const discounted = applyDiscount(subtotal, cart.code);',
      },
      { kind: 'added', text: '  return discounted + shippingOf(discounted);' },
      { kind: 'same', text: '}' },
    ],
  },
];

function countOfKind(lines: DiffLine[], kind: LineKind) {
  const matching = lines.filter((line) => line.kind === kind);
  return matching.length;
}

export function changesOf(hunks: Hunk[]) {
  let additions = 0;
  let deletions = 0;
  for (const hunk of hunks) {
    additions += countOfKind(hunk.lines, 'added');
    deletions += countOfKind(hunk.lines, 'removed');
  }
  return { additions, deletions };
}

/** "@@ -14,5 +14,5 @@": where the hunk starts and how many lines it covers before and after. */
export function headerOf(hunk: Hunk) {
  const { additions, deletions } = changesOf([hunk]);
  const unchanged = countOfKind(hunk.lines, 'same');
  const before = unchanged + deletions;
  const after = unchanged + additions;
  return `@@ -${hunk.firstLine},${before} +${hunk.firstLine},${after} @@`;
}

export function fileOf(id: FileId) {
  const file = FILES.find((candidate) => candidate.id === id);
  return file ?? FILES[0];
}

export const TEST_COUNT = 7;

export type LogTone = 'plain' | 'muted' | 'fail' | 'pass';

export type LogLine = {
  text: string;
  tone: LogTone;
};

const COMMAND: LogLine = { text: '$ pnpm test cart', tone: 'muted' };

const EARLIER_TESTS: LogLine[] = [
  { text: '  ✓ sums the line items', tone: 'plain' },
  { text: '  ✓ applies the quantity', tone: 'plain' },
  { text: '  ✓ rounds to two decimals', tone: 'plain' },
  { text: '  ✓ ignores an empty cart', tone: 'plain' },
  { text: '  ✓ adds shipping under the threshold', tone: 'plain' },
  { text: '  ✓ waives shipping above the threshold', tone: 'plain' },
];

export const FAILING_RUN: LogLine[] = [
  COMMAND,
  { text: ' FAIL  src/cart/total.test.ts', tone: 'fail' },
  ...EARLIER_TESTS,
  { text: '  ✕ applies a discount code once', tone: 'fail' },
  { text: '      Expected: 43.2', tone: 'plain' },
  { text: '      Received: 38.88', tone: 'fail' },
  { text: ' Tests: 1 failed, 6 passed, 7 total', tone: 'fail' },
];

export const PASSING_RUN: LogLine[] = [
  COMMAND,
  { text: ' PASS  src/cart/total.test.ts', tone: 'pass' },
  ...EARLIER_TESTS,
  { text: '  ✓ applies a discount code once', tone: 'pass' },
  { text: ' Tests: 7 passed, 7 total', tone: 'pass' },
];

export const ORDER = {
  item: 'Stovetop kettle, 1.7 l',
  subtotal: 48,
  code: 'TEN',
  discount: 4.8,
  totalBefore: 38.88,
  totalAfter: 43.2,
};

export type StepId = 'read' | 'reproduce' | 'edit' | 'verify' | 'preview';

export type PanelTab = 'diff' | 'tests' | 'preview';

export type WorkStep = {
  id: StepId;
  title: string;
  detail: string;
  doneSummary: string;
  shownInTab?: PanelTab;
  tokens: number;
  usd: number;
};

/** An invented repository, order and costs. The figures are illustrative. */
export const STEPS: WorkStep[] = [
  {
    id: 'read',
    title: 'Read the cart and the checkout',
    detail: 'Four files that touch the total',
    doneSummary: 'The code is taken off in two places',
    tokens: 6100,
    usd: 0.031,
  },
  {
    id: 'reproduce',
    title: 'Reproduce the bug',
    detail: 'A test that takes a code once',
    doneSummary: 'The new test fails: 38.88 where 43.2 is expected',
    shownInTab: 'tests',
    tokens: 3900,
    usd: 0.027,
  },
  {
    id: 'edit',
    title: 'Fix total.ts',
    detail: 'One subtraction too many',
    doneSummary: 'Two hunks in one file',
    shownInTab: 'diff',
    tokens: 4800,
    usd: 0.041,
  },
  {
    id: 'verify',
    title: 'Run the tests',
    detail: 'The seven tests of the cart',
    doneSummary: 'All 7 pass',
    shownInTab: 'tests',
    tokens: 1200,
    usd: 0.008,
  },
  {
    id: 'preview',
    title: 'Check the page',
    detail: 'The order summary at checkout',
    doneSummary: 'The total reads $43.20',
    shownInTab: 'preview',
    tokens: 2400,
    usd: 0.019,
  },
];

const FALLBACK_STEP = STEPS[0];

export function stepOf(id: StepId) {
  const step = STEPS.find((candidate) => candidate.id === id);
  return step ?? FALLBACK_STEP;
}

export const ANSWER =
  'The code was taken off in totalOf and again inside applyDiscount. I removed the first subtraction, added a test for an order with a code, and all 7 tests pass. The checkout now reads $43.20 for this order.';

export const PULL_REQUEST = {
  title: 'Take a discount code off once',
  number: 482,
};

export const OPENED_LINE = `Pull request #${PULL_REQUEST.number} opened. It waits for a review on GitHub`;

export const DECLINED_LINE =
  'No pull request. The fix stays on its branch until you ask again';

export const FOLLOW_UP_REPLY =
  'This demonstration plays one scripted run. Replay it to watch it again.';
