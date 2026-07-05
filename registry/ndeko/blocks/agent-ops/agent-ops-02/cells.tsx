'use client';

import { CheckIcon, ShuffleIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { CellStatus } from './session';

export const CELL_WORD: Record<CellStatus, string> = {
  none: 'Not run',
  queued: 'Queued',
  running: 'Running',
  pass: 'Passed',
  fail: 'Failed',
  flaky: 'Flaky',
};

/** A running cell breathes; at most two run at the same time. */
const CELL_TONE: Record<CellStatus, string> = {
  none: 'hairline-border border-foreground/20 border-dashed',
  queued: 'bg-foreground/[0.04]',
  running: 'bg-info/10 animate-pulse',
  pass: 'bg-success/10 text-success-foreground',
  fail: 'bg-destructive/10 text-destructive-ink',
  flaky: 'bg-warning/10 text-warning-foreground',
};

const SIZE_CLASS = {
  sm: 'size-5 rounded-[5px] [&_svg]:size-3',
  md: 'size-7 rounded-md [&_svg]:size-3.5',
} as const;

function CellGlyph({ status }: { status: CellStatus }) {
  if (status === 'pass') {
    return <CheckIcon strokeWidth={2.25} />;
  }
  if (status === 'fail') {
    return <XIcon strokeWidth={2.25} />;
  }
  if (status === 'flaky') {
    return <ShuffleIcon strokeWidth={2.25} />;
  }
  if (status === 'running') {
    return <span className='bg-info size-1.5 rounded-full' />;
  }
  if (status === 'queued') {
    return <span className='bg-muted-foreground/40 size-1 rounded-full' />;
  }
  return null;
}

type StatusCellProps = {
  status: CellStatus;
  size?: keyof typeof SIZE_CLASS;
  /** Without a visible word next to it, the cell says its state to screen readers. */
  isLabelled?: boolean;
  className?: string;
};

export function StatusCell({
  status,
  size = 'md',
  isLabelled = false,
  className,
}: StatusCellProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors duration-300',
        SIZE_CLASS[size],
        CELL_TONE[status],
        className
      )}
    >
      <Swap swapKey={status}>
        <CellGlyph status={status} />
      </Swap>
      {isLabelled && <span className='sr-only'>{CELL_WORD[status]}</span>}
    </span>
  );
}
