'use client';

import { formatCost, formatTokens } from '@/registry/ndeko/lib/agent-run';
import { CheckIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { CELL_WORD, StatusCell } from './cells';
import { TARGETS, type EvalCase, type Output, type Target } from './data';
import type { CellStatus, Verdict } from './session';

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function hasResult(status: CellStatus) {
  const isPass = status === 'pass';
  const isFail = status === 'fail';
  const isFlaky = status === 'flaky';
  return isPass || isFail || isFlaky;
}

type MarkedTextProps = {
  text: string;
  marked?: string;
  isMarked: boolean;
};

function markedRangeOf(text: string, marked: string | undefined) {
  if (marked === undefined) {
    return null;
  }
  const start = text.indexOf(marked);
  if (start === -1) {
    return null;
  }
  return { start, end: start + marked.length };
}

function MarkedText({ text, marked, isMarked }: MarkedTextProps) {
  const range = markedRangeOf(text, marked);
  if (!isMarked || range === null) {
    return <p className='text-[13px] leading-relaxed'>{text}</p>;
  }
  const before = text.slice(0, range.start);
  const failing = text.slice(range.start, range.end);
  const after = text.slice(range.end);

  return (
    <p className='text-[13px] leading-relaxed'>
      {before}
      <mark className='bg-destructive/10 text-destructive-ink rounded-sm px-0.5'>
        {failing}
      </mark>
      {after}
    </p>
  );
}

type OutputColumnProps = {
  target: Target;
  output: Output;
  status: CellStatus;
};

function OutputColumn({ target, output, status }: OutputColumnProps) {
  const isShown = hasResult(status);
  const isPass = status === 'pass';
  const hasNote = output.note !== undefined;
  const showsNote = hasNote && !isPass;
  const tokens = formatTokens(output.tokens);
  const cost = formatCost(output.costUsd);

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex min-w-0 flex-col gap-2 rounded-lg p-3'>
      <p className='flex items-center gap-2 text-xs'>
        <StatusCell status={status} size='sm' />
        <span className='font-medium'>{target.label}</span>
        <code className='text-muted-foreground font-mono'>
          {target.version}
        </code>
        <span className='text-muted-foreground ms-auto'>
          {CELL_WORD[status]}
        </span>
      </p>
      {isShown && (
        <>
          <MarkedText
            text={output.text}
            marked={output.marked}
            isMarked={!isPass}
          />
          {showsNote && (
            <p className='text-muted-foreground text-xs leading-5'>
              {output.note}
            </p>
          )}
          <p className='text-muted-foreground mt-auto text-xs tabular-nums'>
            {tokens} tokens · {cost}
          </p>
        </>
      )}
      {!isShown && (
        <p className='text-muted-foreground text-[13px]'>
          The reply shows here once this case has run
        </p>
      )}
    </div>
  );
}

type VerdictBarProps = {
  verdict: Verdict | undefined;
  isLocked: boolean;
  isAcceptPressed: boolean;
  onVerdict: (verdict: Verdict) => void;
};

function VerdictBar({
  verdict,
  isLocked,
  isAcceptPressed,
  onVerdict,
}: VerdictBarProps) {
  const isUndecided = verdict === undefined;
  const isAccepted = verdict === 'accepted';
  const isBlocked = verdict === 'blocked';

  return (
    <div className='flex flex-col gap-2'>
      {isUndecided && (
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            size='sm'
            onClick={() => onVerdict('accepted')}
            className={pressedSolidOf(isAcceptPressed)}
          >
            Accept the change
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => onVerdict('blocked')}
          >
            Block
          </Button>
          <span className='text-muted-foreground text-xs'>
            Shipping waits for your decision
          </span>
        </div>
      )}
      {isAccepted && (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 transition-opacity duration-300 starting:opacity-0'>
          <p className='flex min-w-0 items-center gap-1.5 text-xs'>
            <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
            Accepted by you. The expected answer now follows v13
          </p>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={isLocked}
            onClick={() => onVerdict('blocked')}
            className='text-muted-foreground -my-1'
          >
            Block instead
          </Button>
        </div>
      )}
      {isBlocked && (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 transition-opacity duration-300 starting:opacity-0'>
          <p className='flex min-w-0 items-center gap-1.5 text-xs'>
            <XIcon className='text-destructive-ink size-3.5 shrink-0' />
            Blocked by you. v13 cannot ship with this reply
          </p>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={isLocked}
            onClick={() => onVerdict('accepted')}
            className='text-muted-foreground -my-1'
          >
            Accept instead
          </Button>
        </div>
      )}
    </div>
  );
}

export type CaseDetailProps = {
  entry: EvalCase;
  candidateStatus: CellStatus;
  isRegression: boolean;
  verdict: Verdict | undefined;
  isLocked: boolean;
  pressed: string | null;
  onVerdict: (verdict: Verdict) => void;
  className?: string;
};

export function CaseDetail({
  entry,
  candidateStatus,
  isRegression,
  verdict,
  isLocked,
  pressed,
  onVerdict,
  className,
}: CaseDetailProps) {
  const isAccepted = verdict === 'accepted';

  return (
    <div className={cn('@container flex flex-col gap-3', className)}>
      <div className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-xs'>Customer</h3>
        <p className='text-[13px] leading-relaxed'>{entry.input}</p>
      </div>
      <div className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-xs'>Expected</h3>
        <p className='text-[13px] leading-relaxed'>{entry.expected}</p>
        {isAccepted && (
          <p className='text-muted-foreground text-xs transition-opacity duration-300 starting:opacity-0'>
            Replaced by the v13 reply when you accepted the change
          </p>
        )}
      </div>
      <div className='grid grid-cols-1 gap-2 @sm:grid-cols-2'>
        <OutputColumn
          target={TARGETS.production}
          output={entry.production}
          status={entry.production.outcome}
        />
        <OutputColumn
          target={TARGETS.candidate}
          output={entry.candidate}
          status={candidateStatus}
        />
      </div>
      {isRegression && (
        <VerdictBar
          verdict={verdict}
          isLocked={isLocked}
          isAcceptPressed={pressed === 'accept'}
          onVerdict={onVerdict}
        />
      )}
      <Badge variant='secondary' className='self-start'>
        Illustrative tokens and costs
      </Badge>
    </div>
  );
}
