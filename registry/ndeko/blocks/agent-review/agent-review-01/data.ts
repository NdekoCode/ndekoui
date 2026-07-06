import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const ISSUE = {
  id: 'TAL-128',
  title: 'Export invoices as CSV',
  request:
    'Finance exports invoices by hand every month. Add an Export button to the invoices table that downloads what the current filters show, with dates in ISO format and amounts in the invoice currency.',
  branch: 'tal-128-csv-export',
  pullRequest: 'Add CSV export to the invoices table',
};

export const CODER = { name: 'Coder', series: 5 as SeriesSlot };

export const REVIEWER = {
  name: 'Lena Brandt',
};

export const PLAN_STEPS = [
  'Add an export endpoint that streams the filtered rows',
  'Add the Export button to the invoices table',
  'Cover dates and currencies with tests',
];

export type ActivityKind =
  | 'plan'
  | 'approved'
  | 'changes'
  | 'commit'
  | 'pull-request'
  | 'check-failed'
  | 'merged'
  | 'branch'
  | 'restored';

export type Activity = {
  id: string;
  kind: ActivityKind;
  actor: 'coder' | 'reviewer';
  text: string;
  /** A commit hash, shown in mono before the text. */
  hash?: string;
};

export const ACTIVITY: Record<string, Activity> = {
  plan: {
    id: 'plan',
    kind: 'plan',
    actor: 'coder',
    text: 'proposed a plan',
  },
  approved: {
    id: 'approved',
    kind: 'approved',
    actor: 'reviewer',
    text: 'approved the plan',
  },
  changes: {
    id: 'changes',
    kind: 'changes',
    actor: 'reviewer',
    text: 'asked for changes to the plan. Coder waits for a new brief',
  },
  commit1: {
    id: 'commit1',
    kind: 'commit',
    actor: 'coder',
    hash: '4f2a91c',
    text: 'Add a streaming CSV endpoint',
  },
  commit2: {
    id: 'commit2',
    kind: 'commit',
    actor: 'coder',
    hash: 'b07d3e2',
    text: 'Add Export to the invoices table',
  },
  pr: {
    id: 'pr',
    kind: 'pull-request',
    actor: 'coder',
    text: 'opened a pull request',
  },
  failed: {
    id: 'failed',
    kind: 'check-failed',
    actor: 'coder',
    text: 'saw Unit tests fail on a date and is fixing it',
  },
  commit3: {
    id: 'commit3',
    kind: 'commit',
    actor: 'coder',
    hash: '9c1e5aa',
    text: 'Make the date test independent of today',
  },
  merged: {
    id: 'merged',
    kind: 'merged',
    actor: 'reviewer',
    text: 'merged the pull request',
  },
  branch: {
    id: 'branch',
    kind: 'branch',
    actor: 'coder',
    text: 'deleted the branch',
  },
  restored: {
    id: 'restored',
    kind: 'restored',
    actor: 'reviewer',
    text: 'restored the branch',
  },
};

export const DIFF_STATS = { additions: 84, deletions: 12, files: 4 };

export type CheckId = 'lint' | 'build' | 'tests';

export const CHECKS: { id: CheckId; name: string }[] = [
  { id: 'lint', name: 'Lint' },
  { id: 'build', name: 'Build' },
  { id: 'tests', name: 'Unit tests' },
];
