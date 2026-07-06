'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import {
  FAILING_RUN,
  PASSING_RUN,
  TEST_COUNT,
  type LogLine,
  type LogTone,
} from './data';
import { DrawnCheck } from './drawn-check';
import { LOG_MS, type TestRun } from './session';
import { shownCountOf, useRevealedCount } from './stream';
import { useFollowBottom } from './use-follow-bottom';

const PASSING_BEFORE_THE_FIX = TEST_COUNT - 1;

const CELLS = Array.from({ length: TEST_COUNT }, (_, index) => index);

const LOG_TONE: Record<LogTone, string> = {
  plain: 'text-foreground/85',
  muted: 'text-muted-foreground',
  fail: 'text-destructive-ink',
  pass: 'text-success-foreground',
};

type CellTone = 'idle' | 'pass' | 'fail';

const CELL_TONE: Record<CellTone, string> = {
  idle: 'bg-foreground/15',
  pass: 'bg-success',
  fail: 'bg-destructive',
};

/** While the second run streams, the result of the first one still stands. */
function passedOf(testRun: TestRun) {
  if (testRun === 'passed') {
    return TEST_COUNT;
  }
  const hasFailed = testRun === 'failed' || testRun === 'passing';
  if (hasFailed) {
    return PASSING_BEFORE_THE_FIX;
  }
  return null;
}

function cellToneOf(index: number, passed: number | null): CellTone {
  if (passed === null) {
    return 'idle';
  }
  if (index < passed) {
    return 'pass';
  }
  return 'fail';
}

function figureToneOf(isAllGreen: boolean) {
  if (isAllGreen) {
    return 'text-success-foreground';
  }
  return 'text-destructive-ink';
}

function ResultChip({ testRun }: { testRun: TestRun }) {
  const isRunning = testRun === 'failing' || testRun === 'passing';
  if (isRunning) {
    return (
      <Badge variant='secondary'>
        <Spinner aria-hidden='true' className='[&_svg]:size-3' />
        Running
      </Badge>
    );
  }
  if (testRun === 'failed') {
    return <Badge variant='destructive'>1 failing</Badge>;
  }
  if (testRun === 'passed') {
    return (
      <Badge variant='success'>
        <DrawnCheck className='size-3.5 [&_svg]:size-2.5' />
        Passing
      </Badge>
    );
  }
  return null;
}

function lineInOf(isStreaming: boolean) {
  if (isStreaming) {
    return 'transition-opacity duration-150 starting:opacity-0';
  }
  return undefined;
}

/** The first run steps back once the second one starts, so the eye goes to the new output. */
function standingOf(isSuperseded: boolean) {
  if (isSuperseded) {
    return 'opacity-55';
  }
  return 'opacity-100';
}

type LogRunProps = {
  lines: LogLine[];
  isStreaming: boolean;
  isActive: boolean;
  isSuperseded: boolean;
};

/** Only the run that streams re-renders. Its lines land straight in the log: nothing resizes it line by line. */
function LogRun({ lines, isStreaming, isActive, isSuperseded }: LogRunProps) {
  const total = lines.length;
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(total, isRunning, LOG_MS);
  const shown = shownCountOf(isStreaming, count, total);
  const visible = lines.slice(0, shown);

  return (
    <div
      className={cn(
        'flex flex-col transition-opacity duration-500',
        standingOf(isSuperseded)
      )}
    >
      {visible.map((line, index) => (
        <span
          key={index}
          className={cn(
            'block min-h-[1lh] break-words whitespace-pre-wrap',
            LOG_TONE[line.tone],
            lineInOf(isStreaming)
          )}
        >
          {line.text}
        </span>
      ))}
    </div>
  );
}

type TestsViewProps = {
  testRun: TestRun;
  isActive: boolean;
};

export function TestsView({ testRun, isActive }: TestsViewProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const passed = passedOf(testRun);
  const hasResult = passed !== null;
  const isAllGreen = passed === TEST_COUNT;
  const hasFirstRun = testRun !== 'none';
  const hasSecondRun = testRun === 'passing' || testRun === 'passed';

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex min-h-8 items-center gap-2'>
          {!hasResult && (
            <p className='text-muted-foreground text-[13px]'>No result yet</p>
          )}
          {hasResult && (
            <p className='flex items-baseline gap-1.5'>
              <MotionNumber
                value={passed}
                className={cn(
                  'text-2xl leading-8 font-semibold transition-colors duration-500',
                  figureToneOf(isAllGreen)
                )}
              />
              <span className='text-muted-foreground text-xs'>
                of {TEST_COUNT} tests pass
              </span>
            </p>
          )}
          <Swap swapKey={testRun} className='ms-auto'>
            <ResultChip testRun={testRun} />
          </Swap>
        </div>
        <div aria-hidden='true' className='flex gap-1'>
          {CELLS.map((index) => {
            const tone = cellToneOf(index, passed);
            return (
              <span
                key={index}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-500',
                  CELL_TONE[tone]
                )}
              />
            );
          })}
        </div>
      </div>
      <div
        ref={scrollerRef}
        role='log'
        aria-label='Test output'
        aria-live='off'
        tabIndex={0}
        onScroll={updatePinned}
        className='bg-foreground/[0.03] dark:bg-foreground/[0.05] focus-visible:ring-ring/25 min-h-0 flex-1 overflow-y-auto rounded-lg font-mono text-xs leading-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <div ref={contentRef} className='flex flex-col gap-3 p-3'>
          {!hasFirstRun && (
            <p className='text-muted-foreground font-sans'>
              The output of each run shows here
            </p>
          )}
          {hasFirstRun && (
            <LogRun
              lines={FAILING_RUN}
              isStreaming={testRun === 'failing'}
              isActive={isActive}
              isSuperseded={hasSecondRun}
            />
          )}
          {hasSecondRun && (
            <LogRun
              lines={PASSING_RUN}
              isStreaming={testRun === 'passing'}
              isActive={isActive}
              isSuperseded={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
