'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

const FILL = [
  'bg-primary h-full rounded-full',
  '-translate-x-(--progress-remaining) rtl:translate-x-(--progress-remaining)',
  'transition-[translate] duration-500 ease-(--ease-out-strong)',
  'data-indeterminate:w-1/3 data-indeterminate:translate-x-0 data-indeterminate:animate-pulse',
].join(' ');

function remainingShareOf(value: number, min: number, max: number) {
  const span = max - min;
  const hasRange = span > 0;
  if (!hasRange) {
    return 0;
  }
  const share = ((value - min) * 100) / span;
  const boundedShare = Math.min(100, Math.max(0, share));
  return 100 - boundedShare;
}

function isMeasurable(value: number | null | undefined): value is number {
  return Number.isFinite(value);
}

/** Moves a full-width fill instead of resizing it, so the fill travels on the compositor. */
function fillStyleOf(
  value: number | null | undefined,
  min: number,
  max: number
): React.CSSProperties | undefined {
  if (!isMeasurable(value)) {
    return undefined;
  }
  const remainingShare = remainingShareOf(value, min, max);
  return {
    width: '100%',
    '--progress-remaining': `${remainingShare}%`,
  } as React.CSSProperties;
}

function Progress({
  className,
  children,
  value,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  ...props
}: WithClassName<ProgressPrimitive.Root.Props>) {
  const fillStyle = fillStyleOf(value, min, max);

  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      value={value}
      min={min}
      max={max}
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      {children}
      <ProgressPrimitive.Track className='bg-foreground/10 h-1.5 w-full overflow-hidden rounded-full'>
        <ProgressPrimitive.Indicator className={FILL} style={fillStyle} />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

function ProgressLabel({
  className,
  ...props
}: WithClassName<ProgressPrimitive.Label.Props>) {
  return (
    <ProgressPrimitive.Label
      data-slot='progress-label'
      className={cn('text-[13px] font-medium', className)}
      {...props}
    />
  );
}

function ProgressValue({
  className,
  ...props
}: WithClassName<ProgressPrimitive.Value.Props>) {
  return (
    <ProgressPrimitive.Value
      data-slot='progress-value'
      className={cn('text-muted-foreground text-xs tabular-nums', className)}
      {...props}
    />
  );
}

export { Progress, ProgressLabel, ProgressValue };
