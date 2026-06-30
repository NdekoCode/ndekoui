import {
  CheckIcon,
  CircleDashedIcon,
  ClockIcon,
  ListTreeIcon,
  MessageCircleIcon,
  PlusIcon,
  UserIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { Person, StatusId, WorkEventKind } from './data';
import { segmentsOf } from './work-model';

const STATUS_COLOR: Record<StatusId, string> = {
  backlog: 'var(--muted-foreground)',
  todo: 'var(--muted-foreground)',
  in_progress: 'var(--warning)',
  in_review: 'var(--primary)',
  done: 'var(--success)',
};

export const STATUS_NAME: Record<StatusId, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
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

export function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar className={cn('size-6 text-[10px]', className)}>
      {person.avatar && <AvatarImage src={person.avatar} alt='' />}
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  );
}

export function PeopleStack({
  people,
  ringClassName = 'ring-background',
}: {
  people: Person[];
  ringClassName?: string;
}) {
  return (
    <span className='flex items-center -space-x-1.5'>
      {people.map((person) => (
        <PersonAvatar
          key={person.id}
          person={person}
          className={cn('size-5 text-[9px] ring-2', ringClassName)}
        />
      ))}
    </span>
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

export function ProgressRing({ done, total }: { done: number; total: number }) {
  const share = shareOf(done, total);
  const isComplete = total > 0 && done === total;
  const dashOffset = RING_LENGTH * (1 - share);
  return (
    <svg viewBox='0 0 16 16' aria-hidden='true' className='size-4 -rotate-90'>
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
        className={cn(
          'stroke-primary transition-[stroke-dashoffset,stroke] duration-300 ease-(--ease-out-strong)',
          isComplete && 'stroke-success'
        )}
      />
    </svg>
  );
}

/** A title struck from left to right when its sub-task is done. */
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

const EVENT_ICON: Record<WorkEventKind, Icon> = {
  created: PlusIcon,
  status: CircleDashedIcon,
  assignee: UserIcon,
  estimate: ClockIcon,
  subtask: ListTreeIcon,
  comment: MessageCircleIcon,
};

export function EventGlyph({
  kind,
  className,
}: {
  kind: WorkEventKind;
  className?: string;
}) {
  const Glyph = EVENT_ICON[kind];
  return (
    <span
      className={cn(
        'keycap-3d text-muted-foreground relative flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3',
        className
      )}
    >
      <Glyph />
    </span>
  );
}

export function DoneMark() {
  return (
    <span className='bg-success/15 text-success-foreground flex size-4 items-center justify-center rounded-full'>
      <CheckIcon strokeWidth={3} className='size-2.5' />
    </span>
  );
}

export function CommentText({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  const segments = segmentsOf(body);
  return (
    <p
      className={cn(
        'text-[13px] leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap',
        className
      )}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (segment.isMention) {
          return (
            <span
              key={key}
              className='bg-primary/10 text-primary-ink dark:bg-primary/20 rounded-[4px] px-0.5 font-medium'
            >
              {segment.text}
            </span>
          );
        }
        return <span key={key}>{segment.text}</span>;
      })}
    </p>
  );
}
