'use client';

import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { Swap } from './motion-parts';
import type { Person } from './people';

export type StatusId =
  'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export const STATUSES: { id: StatusId; name: string; color: string }[] = [
  { id: 'backlog', name: 'Backlog', color: 'var(--muted-foreground)' },
  { id: 'todo', name: 'Todo', color: 'var(--muted-foreground)' },
  { id: 'in_progress', name: 'In progress', color: 'var(--warning)' },
  { id: 'in_review', name: 'In review', color: 'var(--primary)' },
  { id: 'done', name: 'Done', color: 'var(--success)' },
];

export function statusOf(id: StatusId) {
  const found = STATUSES.find((status) => status.id === id);
  if (found) {
    return found;
  }
  return STATUSES[0];
}

export function isStatusId(value: unknown): value is StatusId {
  return STATUSES.some((status) => status.id === value);
}

const PIE_RADIUS = 2;

const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

function StartedShape({ share }: { share: number }) {
  const filled = share * PIE_CIRCUMFERENCE;
  return (
    <>
      <circle cx='7' cy='7' r='6' stroke='currentColor' strokeWidth='1.5' />
      <circle
        cx='7'
        cy='7'
        r={PIE_RADIUS}
        stroke='currentColor'
        strokeWidth={PIE_RADIUS * 2}
        strokeDasharray={`${filled} ${PIE_CIRCUMFERENCE}`}
        transform='rotate(-90 7 7)'
      />
    </>
  );
}

function statusShapeOf(status: StatusId) {
  if (status === 'backlog') {
    return (
      <circle
        cx='7'
        cy='7'
        r='6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeDasharray='1.6 1.9'
      />
    );
  }
  if (status === 'todo') {
    return (
      <circle cx='7' cy='7' r='6' stroke='currentColor' strokeWidth='1.5' />
    );
  }
  if (status === 'in_progress') {
    return <StartedShape share={0.5} />;
  }
  if (status === 'in_review') {
    return <StartedShape share={0.75} />;
  }
  return (
    <>
      <circle cx='7' cy='7' r='7' fill='currentColor' />
      <path
        d='M4.4 7.2 6.2 9l3.4-3.8'
        stroke='var(--card)'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </>
  );
}

export function StatusGlyph({
  status,
  className,
}: {
  status: StatusId;
  className?: string;
}) {
  const glyphStyle = { color: statusOf(status).color } as React.CSSProperties;
  return (
    <svg
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden='true'
      style={glyphStyle}
      className={cn('size-3.5 shrink-0', className)}
    >
      {statusShapeOf(status)}
    </svg>
  );
}

export function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar className={cn('size-5 text-[9px]', className)} seed={person.name} />
  );
}

const RING_RADIUS = 6.5;

const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function shareOf(done: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return done / total;
}

function ringKeyOf(isComplete: boolean) {
  if (isComplete) {
    return 'complete';
  }
  return 'ring';
}

/** The share of sub-tasks done; the arc travels on each check and becomes a check mark once all are done. */
export function ProgressRing({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const share = shareOf(done, total);
  const isComplete = total > 0 && done === total;
  const dashOffset = RING_LENGTH * (1 - share);

  return (
    <Swap swapKey={ringKeyOf(isComplete)} className={className}>
      {isComplete && (
        <span className='bg-success/15 text-success-foreground flex size-4 items-center justify-center rounded-full'>
          <CheckIcon strokeWidth={3} className='size-2.5' />
        </span>
      )}
      {!isComplete && (
        <svg
          viewBox='0 0 16 16'
          aria-hidden='true'
          className='size-4 -rotate-90'
        >
          <circle
            cx='8'
            cy='8'
            r={RING_RADIUS}
            fill='none'
            strokeWidth='2'
            className='stroke-foreground/10'
          />
          <circle
            cx='8'
            cy='8'
            r={RING_RADIUS}
            fill='none'
            strokeWidth='2'
            strokeLinecap='round'
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={dashOffset}
            className='stroke-primary transition-[stroke-dashoffset] duration-300 ease-(--ease-out-strong)'
          />
        </svg>
      )}
    </Swap>
  );
}

/** A title that gets struck through from left to right when its sub-task is done. */
export function StrikeTitle({
  title,
  isDone,
  className,
}: {
  title: string;
  isDone: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative min-w-0 truncate text-[13px] transition-colors duration-200',
        isDone && 'text-muted-foreground',
        className
      )}
    >
      {title}
      <span
        aria-hidden='true'
        className={cn(
          'bg-foreground/35 pointer-events-none absolute inset-x-0 top-1/2 h-px origin-left scale-x-0 transition-transform duration-200 ease-(--ease-out-strong)',
          isDone && 'scale-x-100'
        )}
      />
    </span>
  );
}

/** One segment per sub-task, filled from the left when it is done. */
export function SegmentMeter({
  states,
  className,
}: {
  states: boolean[];
  className?: string;
}) {
  return (
    <span aria-hidden='true' className={cn('flex gap-0.5', className)}>
      {states.map((isDone, index) => (
        <span
          key={index}
          className='bg-foreground/10 relative h-1.5 min-w-1 flex-1 overflow-hidden rounded-full'
        >
          <span
            className={cn(
              'bg-success absolute inset-0 origin-left scale-x-0 rounded-full transition-transform duration-200 ease-(--ease-out-strong)',
              isDone && 'scale-x-100'
            )}
          />
        </span>
      ))}
    </span>
  );
}
