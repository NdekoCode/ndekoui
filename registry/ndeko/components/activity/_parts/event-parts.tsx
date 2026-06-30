import {
  ArrowRightIcon,
  CalendarIcon,
  CircleDashedIcon,
  ClockIcon,
  HashIcon,
  MessageCircleIcon,
  PlusIcon,
  UserIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  labelOf,
  type ActivityChange,
  type ActivityEvent,
  type ActivityField,
  type ActivityKind,
} from './activity-model';
import {
  PersonAvatar,
  PRIORITY_NAME,
  PriorityGlyph,
  STATUS_NAME,
  StatusGlyph,
} from './glyphs';
import { actorNameOf, personOf } from './people';
import { durationLabelOf, shortDateOf } from './time';

const KIND_ICON: Record<Exclude<ActivityKind, 'priority'>, Icon> = {
  created: PlusIcon,
  comment: MessageCircleIcon,
  status: CircleDashedIcon,
  assignee: UserIcon,
  estimate: ClockIcon,
  due: CalendarIcon,
  label: HashIcon,
};

/** The kind of an event on a small key cap, the way the property draws it in a menu. */
export function EventGlyph({
  kind,
  className,
}: {
  kind: ActivityKind;
  className?: string;
}) {
  const frame = cn(
    'keycap-3d text-muted-foreground relative flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3',
    className
  );
  if (kind === 'priority') {
    return (
      <span className={frame}>
        <PriorityGlyph priority='high' className='text-muted-foreground' />
      </span>
    );
  }
  const Glyph = KIND_ICON[kind];
  return (
    <span className={frame}>
      <Glyph />
    </span>
  );
}

type Wording = {
  changed: string;
  set: string;
  cleared: string;
};

const WORDING: Record<ActivityField, Wording> = {
  status: {
    changed: 'changed the status',
    set: 'set the status',
    cleared: 'cleared the status',
  },
  assignee: {
    changed: 'reassigned the task',
    set: 'assigned',
    cleared: 'unassigned',
  },
  estimate: {
    changed: 'changed the estimate',
    set: 'set the estimate',
    cleared: 'cleared the estimate',
  },
  priority: {
    changed: 'changed the priority',
    set: 'set the priority',
    cleared: 'cleared the priority',
  },
  due: {
    changed: 'moved the due date',
    set: 'set the due date',
    cleared: 'removed the due date',
  },
  label: {
    changed: 'swapped the label',
    set: 'added the label',
    cleared: 'removed the label',
  },
};

export function verbOf(change: ActivityChange) {
  const wording = WORDING[change.field];
  const hasFrom = change.from !== undefined;
  const hasTo = change.to !== undefined;
  const isReplacement = hasFrom && hasTo;
  if (isReplacement) {
    return wording.changed;
  }
  if (hasTo) {
    return wording.set;
  }
  return wording.cleared;
}

export function sentenceOf(event: ActivityEvent) {
  if (event.kind === 'created') {
    return 'created the task';
  }
  if (event.kind === 'comment') {
    return 'commented';
  }
  return verbOf(event.change);
}

type Side = 'from' | 'to';

const VALUE = 'inline-flex min-w-0 items-center gap-1 align-middle';

function valueNodeOf(change: ActivityChange, side: Side) {
  if (change.field === 'status') {
    const status = change[side];
    if (!status) {
      return null;
    }
    return (
      <>
        <StatusGlyph status={status} />
        {STATUS_NAME[status]}
      </>
    );
  }
  if (change.field === 'priority') {
    const priority = change[side];
    if (!priority) {
      return null;
    }
    return (
      <>
        <PriorityGlyph priority={priority} />
        {PRIORITY_NAME[priority]}
      </>
    );
  }
  if (change.field === 'assignee') {
    const personId = change[side];
    if (!personId) {
      return null;
    }
    const person = personOf(personId);
    return (
      <>
        <PersonAvatar person={person} className='size-4 text-[8px]' />
        {person.firstName}
      </>
    );
  }
  if (change.field === 'estimate') {
    const minutes = change[side];
    if (minutes === undefined) {
      return null;
    }
    return <span className='tabular-nums'>{durationLabelOf(minutes)}</span>;
  }
  if (change.field === 'due') {
    const day = change[side];
    if (!day) {
      return null;
    }
    return <span className='tabular-nums'>{shortDateOf(day)}</span>;
  }
  const labelId = change[side];
  if (!labelId) {
    return null;
  }
  const label = labelOf(labelId);
  return <Chip color={label.color}>{label.name}</Chip>;
}

/** The old value muted, an arrow, then the new value drawn the way its property draws it. */
export function ChangeDetail({
  change,
  className,
}: {
  change: ActivityChange;
  className?: string;
}) {
  const from = valueNodeOf(change, 'from');
  const to = valueNodeOf(change, 'to');
  const isReplacement = Boolean(from) && Boolean(to);
  const isRemoval = Boolean(from) && !to;

  return (
    <span
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]',
        className
      )}
    >
      {isReplacement && (
        <>
          <span className={cn(VALUE, 'text-muted-foreground')}>{from}</span>
          <ArrowRightIcon className='text-muted-foreground/70 size-3' />
          <span className='sr-only'>to</span>
        </>
      )}
      {isRemoval && (
        <span
          className={cn(
            VALUE,
            'text-muted-foreground decoration-foreground/30 line-through'
          )}
        >
          {from}
        </span>
      )}
      {to && <span className={cn(VALUE, 'text-foreground')}>{to}</span>}
    </span>
  );
}

export function ActorName({ actorId }: { actorId: string }) {
  return (
    <span className='text-foreground font-medium'>{actorNameOf(actorId)}</span>
  );
}
