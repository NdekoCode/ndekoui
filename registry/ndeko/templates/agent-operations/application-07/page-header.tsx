'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import {
  formatDuration,
  formatTokens,
  type RunSnapshot,
  type RunStatus,
} from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CostFigure } from './agent-parts';
import { BRAND, RUN_ID, RUN_NOTE, RUN_TITLE } from './data';
import { isRunLive, runNowOf } from './model';

const STATUS_WORD: Record<RunStatus, string> = {
  idle: 'Ready',
  running: 'Running',
  waiting: 'Waiting on you',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const STATUS_DOT: Record<RunStatus, string> = {
  idle: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  done: 'bg-success',
  failed: 'bg-destructive',
  cancelled: 'bg-muted-foreground/45',
};

const CLOCK_MS = 250;

/** The slim bar takes over once the page has scrolled this far. */
const CONDENSE_AFTER_PX = 48;

function slimToneOf(isCondensed: boolean) {
  if (isCondensed) {
    return 'translate-y-0 opacity-100';
  }
  return '-translate-y-full opacity-0';
}

/** The only text that ticks: the time the run has taken, which stops with the run. */
function RunElapsed({
  run,
  className,
}: {
  run: RunSnapshot;
  className?: string;
}) {
  const now = useNow(CLOCK_MS, isRunLive(run));
  if (run.startedAt === undefined) {
    return <span className={cn('tabular-nums', className)}>0.0s</span>;
  }
  const end = run.endedAt ?? runNowOf(run, now);
  const elapsed = Math.max(0, end - run.startedAt);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatDuration(elapsed)}
    </span>
  );
}

function StatusPill({ status }: { status: RunStatus }) {
  return (
    <span className='bg-foreground/[0.05] flex h-7 items-center gap-2 rounded-full px-3 text-xs'>
      <span
        aria-hidden='true'
        className={cn(
          'size-1.5 shrink-0 rounded-full transition-colors duration-200',
          STATUS_DOT[status]
        )}
      />
      <WordRoll text={STATUS_WORD[status]} labels={STATUS_WORDS} />
    </span>
  );
}

function callsDoneOf(run: RunSnapshot) {
  return run.calls.filter((call) => call.status === 'done').length;
}

type FigureProps = {
  label: string;
  children: React.ReactNode;
};

function Figure({ label, children }: FigureProps) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='text-lg leading-7 font-semibold tabular-nums'>
        {children}
      </dd>
    </div>
  );
}

export type SlimBarProps = {
  run: RunSnapshot;
  isCondensed: boolean;
  canReplay: boolean;
  onReplay: () => void;
};

/** What the page header becomes once it scrolls away: one line that stays in view, drawn over the content with no change of layout. */
export function SlimBar({
  run,
  isCondensed,
  canReplay,
  onReplay,
}: SlimBarProps) {
  return (
    <div className='sticky top-0 z-10 h-0'>
      <div
        inert={!isCondensed}
        className={cn(
          'bg-card hairline-b border-border absolute inset-x-0 top-0 transition-[translate,opacity] duration-200 ease-(--ease-out-strong)',
          slimToneOf(isCondensed)
        )}
      >
        <div className='mx-auto flex h-12 w-full max-w-[90rem] items-center gap-3 px-3 @xl:px-5'>
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 shrink-0 rounded-full transition-colors duration-200',
              STATUS_DOT[run.status]
            )}
          />
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
            {RUN_TITLE}
          </span>
          {isCondensed && (
            <span className='text-muted-foreground hidden items-center gap-1.5 text-xs @md:flex'>
              <RunElapsed run={run} />
              <span aria-hidden='true'>·</span>
              <CostFigure usd={run.usage.costUsd} />
            </span>
          )}
          <ReplayButton
            isShown={canReplay}
            onReplay={onReplay}
            label='Replay'
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Tells when the page has scrolled past the header: a sentinel near its top leaves the scroller, so
 * nothing listens to scrolling.
 */
export function useCondensedHeader(
  scrollerRef: RefObject<HTMLDivElement | null>
) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsCondensed(!entry.isIntersecting),
      { root: scroller }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollerRef]);

  return { sentinelRef, isCondensed };
}

type PageHeaderProps = {
  run: RunSnapshot;
  sentinelRef: RefObject<HTMLSpanElement | null>;
  canReplay: boolean;
  onReplay: () => void;
};

export function PageHeader({
  run,
  sentinelRef,
  canReplay,
  onReplay,
}: PageHeaderProps) {
  const tokens = run.usage.inputTokens + run.usage.outputTokens;

  return (
    <header className='relative flex flex-col gap-5 pt-5 @3xl:pt-8'>
      <span
        ref={sentinelRef}
        aria-hidden='true'
        style={{ top: CONDENSE_AFTER_PX }}
        className='pointer-events-none absolute h-px w-full'
      />
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
        <div className='flex min-w-0 flex-col gap-1.5'>
          <p className='text-muted-foreground flex items-center gap-2 text-xs'>
            <CompanyMark seed={BRAND.name} size='sm' />
            {BRAND.name}
            <span aria-hidden='true'>/</span>
            Agent operations
          </p>
          <h1 className='text-xl font-semibold text-balance @3xl:text-2xl'>
            {RUN_TITLE}
          </h1>
          <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
            <span className='font-mono'>{RUN_ID}</span>
            <span>{RUN_NOTE}</span>
            <Badge variant='secondary'>Illustrative</Badge>
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <ReplayButton
            isShown={canReplay}
            onReplay={onReplay}
            label='Replay'
          />
          <StatusPill status={run.status} />
        </div>
      </div>
      <dl className='grid grid-cols-2 gap-x-6 gap-y-3 @xl:grid-cols-4'>
        <Figure label='Elapsed'>
          <RunElapsed run={run} />
        </Figure>
        <Figure label='Spent'>
          <CostFigure usd={run.usage.costUsd} />
        </Figure>
        <Figure label='Tokens'>{formatTokens(tokens)}</Figure>
        <Figure label='Calls'>
          {callsDoneOf(run)} of {countOf(run.calls.length, 'call')}
        </Figure>
      </dl>
    </header>
  );
}
