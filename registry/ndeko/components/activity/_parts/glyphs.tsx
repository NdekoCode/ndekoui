import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { Person } from './people';

export type StatusId =
  'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type PriorityId = 'urgent' | 'high' | 'medium' | 'low';

export const STATUS_NAME: Record<StatusId, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

const STATUS_COLOR: Record<StatusId, string> = {
  backlog: 'var(--muted-foreground)',
  todo: 'var(--muted-foreground)',
  in_progress: 'var(--warning)',
  in_review: 'var(--primary)',
  done: 'var(--success)',
};

export const PRIORITY_NAME: Record<PriorityId, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

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
  const glyphStyle = { color: STATUS_COLOR[status] } as React.CSSProperties;
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

const BAR_HEIGHTS = [4, 7, 10];

const FILLED_BARS: Record<PriorityId, number> = {
  urgent: 3,
  high: 3,
  medium: 2,
  low: 1,
};

function barOpacityOf(index: number, filledCount: number) {
  if (index < filledCount) {
    return 0.8;
  }
  return 0.2;
}

export function PriorityGlyph({
  priority,
  className,
}: {
  priority: PriorityId;
  className?: string;
}) {
  const isUrgent = priority === 'urgent';
  const filledCount = FILLED_BARS[priority];
  return (
    <svg
      viewBox='0 0 14 14'
      aria-hidden='true'
      className={cn(
        'text-foreground size-3.5 shrink-0',
        isUrgent && 'text-destructive-ink',
        className
      )}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <rect
          key={height}
          x={1.5 + index * 4.25}
          y={12 - height}
          width='2.5'
          height={height}
          rx='0.75'
          fill='currentColor'
          fillOpacity={barOpacityOf(index, filledCount)}
        />
      ))}
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
    <Avatar
      className={cn('size-6 text-[10px]', className)}
      seed={person.name}
    />
  );
}
