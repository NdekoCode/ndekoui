'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';

import { BUDGET_LABEL, FIGURE_LABELS, REQUESTS, type RequestId } from './data';

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const ONE_DECIMAL: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const CENTS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const RUNNING_LABELS = ['None running now', '1 running now'];

const OLDEST_LABELS = [
  'All answered',
  'Just arrived',
  'Waiting for 6 min',
  'Waiting for 14 min',
  'Waiting for 22 min',
];

function runningLineOf(runningNow: number) {
  if (runningNow === 0) {
    return 'None running now';
  }
  return `${runningNow} running now`;
}

function oldestLineOf(pending: RequestId[]) {
  const [oldest] = pending;
  if (oldest === undefined) {
    return 'All answered';
  }
  return REQUESTS[oldest].waiting;
}

type FigureProps = {
  label: string;
  hasDot?: boolean;
  children: React.ReactNode;
  detail: React.ReactNode;
};

function Figure({ label, hasDot = false, children, detail }: FigureProps) {
  return (
    <div className='flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2.5'>
      <span className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
        <span
          aria-hidden='true'
          className={cn(
            'bg-warning size-1.5 shrink-0 rounded-full transition-opacity duration-200',
            !hasDot && 'opacity-0'
          )}
        />
        {label}
      </span>
      <span className='flex text-2xl leading-8 font-semibold'>{children}</span>
      <span className='text-muted-foreground flex text-xs'>{detail}</span>
    </div>
  );
}

type FiguresBandProps = {
  runsToday: number;
  runningNow: number;
  pending: RequestId[];
  hoursSaved: number;
  spendUsd: number;
};

export function FiguresBand({
  runsToday,
  runningNow,
  pending,
  hoursSaved,
  spendUsd,
}: FiguresBandProps) {
  const hasPending = pending.length > 0;
  const runningLine = runningLineOf(runningNow);
  const oldestLine = oldestLineOf(pending);

  return (
    <section
      aria-label='Figures'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] grid grid-cols-2 gap-1 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl/page:grid-cols-4'
    >
      <Figure
        label={FIGURE_LABELS.runs}
        detail={<WordRoll text={runningLine} labels={RUNNING_LABELS} />}
      >
        <MotionNumber value={runsToday} format={WHOLE} />
      </Figure>
      <Figure
        label={FIGURE_LABELS.waiting}
        hasDot={hasPending}
        detail={<WordRoll text={oldestLine} labels={OLDEST_LABELS} />}
      >
        <MotionNumber value={pending.length} format={WHOLE} />
      </Figure>
      <Figure label={FIGURE_LABELS.hours} detail='Since Monday'>
        <MotionNumber value={hoursSaved} format={ONE_DECIMAL} suffix=' h' />
      </Figure>
      <Figure label={FIGURE_LABELS.spend} detail={`of ${BUDGET_LABEL} budget`}>
        <MotionNumber value={spendUsd} format={CENTS} />
      </Figure>
    </section>
  );
}
