import {
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  ListTreeIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Chip } from '@/registry/ndeko/ui/chip';

import type {
  IssueTypeId,
  Person,
  PriorityId,
  StatusId,
  SubTaskCount,
} from './data';
import { issueTypeOf, labelsOf, statusOf } from './task-model';

const PIE_RADIUS = 2;
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

function pieDashOf(share: number) {
  const filled = share * PIE_CIRCUMFERENCE;
  return `${filled} ${PIE_CIRCUMFERENCE}`;
}

function StartedShape({ share }: { share: number }) {
  return (
    <>
      <circle cx='7' cy='7' r='6' stroke='currentColor' strokeWidth='1.5' />
      <circle
        cx='7'
        cy='7'
        r={PIE_RADIUS}
        stroke='currentColor'
        strokeWidth={PIE_RADIUS * 2}
        strokeDasharray={pieDashOf(share)}
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
  const meta = statusOf(status);
  const glyphStyle = { color: meta.color } as React.CSSProperties;

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

const PRIORITY_BARS = [
  { x: 1.5, height: 4 },
  { x: 5.75, height: 7 },
  { x: 10, height: 10 },
];

const FILLED_BAR_COUNT: Record<PriorityId, number> = {
  urgent: 3,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

function barOpacityOf(index: number, filledCount: number) {
  if (index < filledCount) {
    return 0.75;
  }
  return 0.2;
}

function priorityShapeOf(priority: PriorityId) {
  if (priority === 'urgent') {
    return (
      <g style={{ color: 'var(--destructive)' }}>
        <rect
          x='1'
          y='1'
          width='12'
          height='12'
          rx='3.5'
          fill='currentColor'
          fillOpacity='0.16'
        />
        <rect
          x='6.25'
          y='3.5'
          width='1.5'
          height='4.75'
          rx='0.75'
          fill='currentColor'
        />
        <circle cx='7' cy='10.1' r='0.95' fill='currentColor' />
      </g>
    );
  }
  if (priority === 'none') {
    return (
      <g fill='currentColor' fillOpacity='0.45'>
        {PRIORITY_BARS.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y='6.25'
            width='2.5'
            height='1.5'
            rx='0.75'
          />
        ))}
      </g>
    );
  }
  const filledCount = FILLED_BAR_COUNT[priority];
  return (
    <g fill='currentColor'>
      {PRIORITY_BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={12 - bar.height}
          width='2.5'
          height={bar.height}
          rx='0.75'
          fillOpacity={barOpacityOf(index, filledCount)}
        />
      ))}
    </g>
  );
}

export function PriorityGlyph({
  priority,
  className,
}: {
  priority: PriorityId;
  className?: string;
}) {
  return (
    <svg
      viewBox='0 0 14 14'
      aria-hidden='true'
      className={cn('text-foreground size-3.5 shrink-0', className)}
    >
      {priorityShapeOf(priority)}
    </svg>
  );
}

const TYPE_GLYPH: Record<IssueTypeId, Icon> = {
  task: CheckIcon,
  bug: CircleAlertIcon,
  story: BookmarkIcon,
  epic: ZapIcon,
};

export function IssueTypeGem({
  type,
  className,
}: {
  type: IssueTypeId;
  className?: string;
}) {
  const meta = issueTypeOf(type);
  const Glyph = TYPE_GLYPH[type];
  const gemStyle = { '--gem': meta.color } as React.CSSProperties;

  return (
    <span
      role='img'
      aria-label={meta.name}
      style={gemStyle}
      className={cn(
        'gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[5px]',
        className
      )}
    >
      <Glyph strokeWidth={2.5} className='size-2.5' />
    </span>
  );
}

export function LivePill({ personName }: { personName: string }) {
  return (
    <span className='bg-success/10 text-success-foreground inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-1.5 text-[11px] font-medium'>
      <span aria-hidden='true' className='bg-success size-1.5 rounded-full' />
      Live
      <span className='sr-only'>, {personName} is tracking time on it</span>
    </span>
  );
}

export function SubTaskCountTag({ count }: { count: SubTaskCount }) {
  return (
    <span className='text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs tabular-nums'>
      <ListTreeIcon className='size-3' />
      {count.done}/{count.total}
      <span className='sr-only'>sub-tasks done</span>
    </span>
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
    <Avatar className={cn('size-5 text-[9px]', className)}>
      {person.avatar && <AvatarImage src={person.avatar} alt='' />}
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  );
}

const MAX_STACKED_PEOPLE = 3;

export function PeopleStack({ people }: { people: Person[] }) {
  const shown = people.slice(0, MAX_STACKED_PEOPLE);
  const hiddenCount = people.length - shown.length;
  const hasHidden = hiddenCount > 0;

  return (
    <span className='flex items-center -space-x-1.5'>
      {shown.map((person) => (
        <PersonAvatar
          key={person.id}
          person={person}
          className='ring-background ring-2'
        />
      ))}
      {hasHidden && (
        <span className='bg-muted text-muted-foreground ring-background relative inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium tabular-nums ring-2'>
          +{hiddenCount}
        </span>
      )}
    </span>
  );
}

const MAX_SHOWN_LABELS = 2;

export function LabelChips({ labelIds }: { labelIds: string[] }) {
  const labels = labelsOf(labelIds);
  const shown = labels.slice(0, MAX_SHOWN_LABELS);
  const hiddenCount = labels.length - shown.length;
  const hasHidden = hiddenCount > 0;

  return (
    <span className='flex min-w-0 items-center gap-1'>
      {shown.map((label) => (
        <Chip key={label.id} color={label.color} className='min-w-0 shrink'>
          <span className='truncate'>{label.name}</span>
        </Chip>
      ))}
      {hasHidden && (
        <Chip color='var(--muted-foreground)' className='tabular-nums'>
          +{hiddenCount}
        </Chip>
      )}
    </span>
  );
}
