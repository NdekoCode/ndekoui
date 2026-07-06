'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { CopyLabelButton } from './_parts/copy-label-button';
import { sqlTokensOf, type SqlTokenKind } from './_parts/sql';

export type QueryTab = 'result' | 'query';

export type QueryStatus = 'running' | 'done' | 'error';

export type QueryCell = string | number;

export type QueryError = {
  message: string;
  /** The line of the query the message points at, counted from 1. */
  line: number;
};

export type QueryRun = {
  title: string;
  sql: string;
  status: QueryStatus;
  columns: string[];
  rows: QueryCell[][];
  /** How long the query took, in milliseconds. */
  ms?: number;
  error?: QueryError;
};

const TOKEN_TONE: Record<SqlTokenKind, string> = {
  keyword: 'text-primary-ink',
  function: 'text-info-foreground',
  string: 'text-success-foreground',
  number: 'text-warning-foreground',
  comment: 'text-muted-foreground',
  plain: 'text-foreground',
};

const STATUS_BADGE: Record<
  QueryStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  running: { label: 'Running', variant: 'info' },
  done: { label: 'Done', variant: 'success' },
  error: { label: 'Failed', variant: 'destructive' },
};

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

const PROGRESS_START = { scaleX: 0.05, opacity: 1 };

const PROGRESS_RUNNING = { scaleX: 0.85, opacity: 1 };

const PROGRESS_DONE = { scaleX: 1, opacity: 0 };

const NUDGE = [0, -4, 4, -2, 0];

function isQueryTab(value: unknown): value is QueryTab {
  return value === 'result' || value === 'query';
}

function formatCell(cell: QueryCell) {
  if (typeof cell === 'number') {
    return NUMBER_FORMATTER.format(cell);
  }
  return cell;
}

function csvCellOf(cell: QueryCell) {
  const text = String(cell);
  const needsQuotes = /[",\n]/.test(text);
  if (!needsQuotes) {
    return text;
  }
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function csvOf(columns: string[], rows: QueryCell[][]) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCellOf).join(','));
  }
  return lines.join('\n');
}

function alignOf(cell: QueryCell | undefined) {
  if (typeof cell === 'number') {
    return 'text-end';
  }
  return 'text-start';
}

function lineSurfaceOf(isErrorLine: boolean) {
  if (isErrorLine) {
    return 'bg-destructive/10';
  }
  return 'bg-transparent';
}

function lineNumberToneOf(isErrorLine: boolean) {
  if (isErrorLine) {
    return 'text-destructive-ink';
  }
  return 'text-muted-foreground';
}

function progressDurationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return 1.4;
}

function RunLine({ isRunning }: { isRunning: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const duration = progressDurationOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isRunning && (
        <motion.span
          key='running'
          aria-hidden='true'
          initial={PROGRESS_START}
          animate={PROGRESS_RUNNING}
          exit={{ ...PROGRESS_DONE, transition: { duration: 0.25 } }}
          transition={{ duration, ease: [0.23, 1, 0.32, 1] }}
          className='bg-primary absolute inset-x-0 top-0 z-10 h-0.5 origin-left'
        />
      )}
    </AnimatePresence>
  );
}

type ResultTableProps = {
  columns: string[];
  rows: QueryCell[][];
};

function ResultTable({ columns, rows }: ResultTableProps) {
  const firstRow = rows[0];

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] relative overflow-x-auto rounded-lg'>
      <table className='w-full text-[13px]'>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                scope='col'
                className={cn(
                  'text-muted-foreground px-3 py-2 font-mono text-xs font-medium whitespace-nowrap',
                  alignOf(firstRow?.[index])
                )}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className='hairline-t border-border transition-[opacity,translate] duration-200 ease-(--ease-out-strong) starting:-translate-y-1 starting:opacity-0'
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    'px-3 py-2 whitespace-nowrap tabular-nums',
                    alignOf(cell)
                  )}
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultFooter({ run }: { run: QueryRun }) {
  const rowCount = run.rows.length;

  return (
    <p className='text-muted-foreground flex flex-wrap items-center gap-x-1.5 px-1 text-xs'>
      <span className='tabular-nums'>
        <MotionNumber value={rowCount} /> {nounOf(rowCount, 'row')}
      </span>
      <span aria-hidden='true'>·</span>
      <span className='tabular-nums'>
        <MotionNumber value={run.ms ?? 0} /> ms
      </span>
    </p>
  );
}

function nudgeOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { x: 0 };
  }
  return { x: NUDGE };
}

type ErrorNoticeProps = {
  error: QueryError;
  onShowLine: () => void;
};

function ErrorNotice({ error, onShowLine }: ErrorNoticeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const nudge = nudgeOf(shouldReduceMotion);

  return (
    <motion.div
      initial={{ x: 0 }}
      animate={nudge}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className='bg-destructive/10 flex flex-col gap-2 rounded-lg p-3'
    >
      <p className='text-destructive-ink text-[13px] font-medium'>
        The query failed on line {error.line}
      </p>
      <p className='text-destructive-ink font-mono text-xs leading-5 break-words'>
        {error.message}
      </p>
      <div>
        <Button type='button' variant='outline' size='sm' onClick={onShowLine}>
          Show line {error.line}
        </Button>
      </div>
    </motion.div>
  );
}

function QueryCode({
  sql,
  errorLine,
}: {
  sql: string;
  errorLine: number | undefined;
}) {
  const lines = sql.split('\n');

  return (
    <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] relative overflow-x-auto rounded-lg py-2 font-mono text-xs leading-5'>
      {lines.map((line, index) => {
        const number = index + 1;
        const isErrorLine = number === errorLine;
        return (
          <div
            key={number}
            className={cn(
              'flex min-w-max transition-colors duration-200',
              lineSurfaceOf(isErrorLine)
            )}
          >
            <span
              aria-hidden='true'
              className={cn(
                'w-9 shrink-0 pe-3 text-end tabular-nums select-none',
                lineNumberToneOf(isErrorLine)
              )}
            >
              {number}
            </span>
            <span className='pe-3 whitespace-pre'>
              {sqlTokensOf(line).map((token, tokenIndex) => (
                <span key={tokenIndex} className={TOKEN_TONE[token.kind]}>
                  {token.text}
                </span>
              ))}
              {isErrorLine && (
                <span className='sr-only'> (the error is on this line)</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type QueryResultProps = {
  run: QueryRun;
  source: string;
  /** How many rows are on screen while they arrive. All of them by default. */
  shownRows?: number;
  tab?: QueryTab;
  defaultTab?: QueryTab;
  onTabChange?: (tab: QueryTab) => void;
  /** Shows "Copied" on Copy query for a demonstration that presses it, without touching the clipboard. */
  isQueryCopied?: boolean;
  /** Shows Copy query held down, for a demonstration that presses it. */
  isCopyPressed?: boolean;
  className?: string;
};

export function QueryResult({
  run,
  source,
  shownRows,
  tab,
  defaultTab = 'result',
  onTabChange,
  isQueryCopied = false,
  isCopyPressed = false,
  className,
}: QueryResultProps) {
  const isRunning = run.status === 'running';
  const isDone = run.status === 'done';
  const error = run.error;
  const hasError = run.status === 'error' && error !== undefined;
  const badge = STATUS_BADGE[run.status];
  const visibleRows = run.rows.slice(0, shownRows ?? run.rows.length);
  const csv = csvOf(run.columns, run.rows);

  function changeTab(value: unknown) {
    if (isQueryTab(value)) {
      onTabChange?.(value);
    }
  }

  function showErrorLine() {
    onTabChange?.('query');
  }

  return (
    <section
      aria-label='Query result'
      className={cn(
        'bg-card hairline-ring ring-border @container relative flex flex-col gap-3 overflow-hidden rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <RunLine isRunning={isRunning} />
      <header className='flex items-center gap-3'>
        <BrandTile brand='postgresql' size='lg' />
        <div className='flex min-w-0 flex-1 flex-col'>
          <h3 className='truncate text-sm font-medium'>{run.title}</h3>
          <p className='text-muted-foreground truncate text-xs'>{source}</p>
        </div>
        <Swap swapKey={run.status}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </Swap>
      </header>
      <Tabs
        value={tab}
        defaultValue={defaultTab}
        onValueChange={changeTab}
        className='gap-3'
      >
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <TabsList variant='segmented' aria-label='Query view'>
            <TabsTab value='result'>Result</TabsTab>
            <TabsTab value='query'>Query</TabsTab>
          </TabsList>
          <div className='flex flex-wrap items-center gap-2'>
            {isDone && <CopyLabelButton text={csv} label='Copy as CSV' />}
            <CopyLabelButton
              text={run.sql}
              label='Copy query'
              isCopied={isQueryCopied}
              isPressed={isCopyPressed}
            />
          </div>
        </div>
        <TabsPanel value='result' className='min-h-[16rem]'>
          <div className='flex flex-col gap-2'>
            {isRunning && (
              <p className='text-muted-foreground flex items-center gap-2 px-1 text-xs'>
                <LoaderIcon className='size-3.5 animate-spin' />
                Running the query
              </p>
            )}
            {hasError && (
              <ErrorNotice error={error} onShowLine={showErrorLine} />
            )}
            {isDone && (
              <>
                <ResultTable columns={run.columns} rows={visibleRows} />
                <ResultFooter run={run} />
              </>
            )}
          </div>
        </TabsPanel>
        <TabsPanel value='query' className='min-h-[16rem]'>
          <QueryCode sql={run.sql} errorLine={error?.line} />
        </TabsPanel>
      </Tabs>
    </section>
  );
}

const SOURCE = 'Postgres, analytics database. Illustrative data';

const COLUMNS = ['region', 'orders', 'revenue_eur'];

const ROWS: QueryCell[][] = [
  ['Kinshasa', 412, 184290],
  ['Lubumbashi', 268, 121640],
  ['Nairobi', 233, 98870],
  ['Brussels', 190, 84320],
  ['Goma', 141, 62115],
  ['Lagos', 118, 51480],
];

const REVENUE_SQL = [
  'SELECT region,',
  '       COUNT(*) AS orders,',
  '       SUM(total_eur) AS revenue_eur',
  'FROM orders',
  "WHERE placed_at >= '2026-07-01'",
  "  AND placed_at < '2026-10-01'",
  'GROUP BY region',
  'ORDER BY revenue_eur DESC;',
].join('\n');

const BROKEN_SQL = [
  'SELECT region,',
  '       SUM(total_eur) AS revenue_eur',
  'FORM orders',
  "WHERE placed_at >= '2026-07-01'",
  'GROUP BY region;',
].join('\n');

const RUNNING_REVENUE: QueryRun = {
  title: 'Revenue by region, Q3',
  sql: REVENUE_SQL,
  status: 'running',
  columns: COLUMNS,
  rows: [],
};

const DONE_REVENUE: QueryRun = {
  ...RUNNING_REVENUE,
  status: 'done',
  rows: ROWS,
  ms: 38,
};

const RUNNING_BROKEN: QueryRun = {
  title: 'Revenue by region, second try',
  sql: BROKEN_SQL,
  status: 'running',
  columns: COLUMNS,
  rows: [],
};

const FAILED_BROKEN: QueryRun = {
  ...RUNNING_BROKEN,
  status: 'error',
  error: { message: 'syntax error at or near "FORM"', line: 3 },
};

const ROW_MS = 130;

const COPIED_MS = 1500;

type QueryState = {
  run: QueryRun;
  shownRows: number;
  tab: QueryTab;
  isQueryCopied: boolean;
};

type QueryAction =
  | { type: 'finish' }
  | { type: 'row' }
  | { type: 'tab'; tab: QueryTab }
  | { type: 'copied'; isCopied: boolean }
  | { type: 'retry' }
  | { type: 'fail' }
  | { type: 'hold' };

type QueryStep = SessionStep<QueryState, QueryAction>;

const INITIAL: QueryState = {
  run: RUNNING_REVENUE,
  shownRows: 0,
  tab: 'result',
  isQueryCopied: false,
};

const RESTING: QueryState = {
  run: DONE_REVENUE,
  shownRows: ROWS.length,
  tab: 'result',
  isQueryCopied: false,
};

function reducer(state: QueryState, action: QueryAction): QueryState {
  switch (action.type) {
    case 'finish':
      return { ...state, run: DONE_REVENUE };
    case 'row':
      return { ...state, shownRows: state.shownRows + 1 };
    case 'tab':
      return { ...state, tab: action.tab };
    case 'copied':
      return { ...state, isQueryCopied: action.isCopied };
    case 'retry':
      return { ...state, run: RUNNING_BROKEN, shownRows: 0 };
    case 'fail':
      return { ...state, run: FAILED_BROKEN };
    case 'hold':
      return state;
  }
}

function rowSteps(): QueryStep[] {
  const steps: QueryStep[] = [];
  for (let index = 0; index < ROWS.length; index += 1) {
    steps.push({ after: ROW_MS, action: { type: 'row' } });
  }
  return steps;
}

const SCRIPT: QueryStep[] = [
  { after: 1500, action: { type: 'finish' } },
  ...rowSteps(),
  { after: 1800, by: 'demo', action: { type: 'tab', tab: 'query' } },
  {
    after: 1500,
    by: 'demo',
    press: 'copy',
    action: { type: 'copied', isCopied: true },
  },
  { after: COPIED_MS, action: { type: 'copied', isCopied: false } },
  { after: 900, by: 'demo', action: { type: 'tab', tab: 'result' } },
  { after: 1200, action: { type: 'retry' } },
  { after: 1100, action: { type: 'fail' } },
  { after: 1500, by: 'demo', action: { type: 'tab', tab: 'query' } },
  { after: 3800, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(run: QueryRun) {
  if (run.status === 'running') {
    return 'Running the query';
  }
  if (run.status === 'error') {
    const line = run.error?.line ?? 0;
    return `The query failed on line ${line}`;
  }
  const rows = countOf(run.rows.length, 'row');
  return `The query returned ${rows} in ${run.ms ?? 0} milliseconds`;
}

export default function Answer08() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const canReplay = isFinished && !isAutoplaying;
  const announcement = announcementOf(state.run);

  function changeTab(tab: QueryTab) {
    act({ type: 'tab', tab });
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[32rem] w-full max-w-[40rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <QueryResult
          run={state.run}
          source={SOURCE}
          shownRows={state.shownRows}
          tab={state.tab}
          onTabChange={changeTab}
          isQueryCopied={state.isQueryCopied}
          isCopyPressed={pressed === 'copy'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
