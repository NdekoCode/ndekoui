import {
  AtSignIcon,
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  EclipseIcon,
  EyeIcon,
  MessageCircleIcon,
  UserRoundPlusIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { IssueType, NotificationKind, Person, StatusId } from './data';

type Meta = { label: string; color: string; glyph: Icon };

const ISSUE_TYPES: Record<IssueType, Meta> = {
  task: { label: 'Task', color: 'var(--info)', glyph: CheckIcon },
  bug: { label: 'Bug', color: 'var(--destructive)', glyph: CircleAlertIcon },
  story: { label: 'Story', color: 'var(--success)', glyph: BookmarkIcon },
};

const KINDS: Record<NotificationKind, Meta> = {
  mention: { label: 'Mention', color: 'var(--info)', glyph: AtSignIcon },
  comment: {
    label: 'Comment',
    color: 'var(--success)',
    glyph: MessageCircleIcon,
  },
  assigned: {
    label: 'Assignment',
    color: 'var(--primary)',
    glyph: UserRoundPlusIcon,
  },
  status: {
    label: 'Status change',
    color: 'var(--muted-foreground)',
    glyph: CircleDashedIcon,
  },
};

export const STATUSES: Record<StatusId, Meta> = {
  todo: { label: 'Todo', color: 'var(--info)', glyph: CircleIcon },
  'in-progress': {
    label: 'In progress',
    color: 'var(--warning)',
    glyph: EclipseIcon,
  },
  'in-review': { label: 'In review', color: 'var(--primary)', glyph: EyeIcon },
  done: { label: 'Done', color: 'var(--success)', glyph: CircleCheckIcon },
};

export function IssueTypeGem({ type }: { type: IssueType }) {
  const meta = ISSUE_TYPES[type];
  const Glyph = meta.glyph;
  const gemStyle = { '--gem': meta.color } as React.CSSProperties;

  return (
    <span
      role='img'
      aria-label={meta.label}
      style={gemStyle}
      className='gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[5px]'
    >
      <Glyph strokeWidth={2.5} className='size-2.5' />
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
    <Avatar
      className={cn('size-7 text-[10px]', className)}
      seed={person.name}
    />
  );
}

/** A sender's face with the kind of the notification on its lower corner. */
export function SenderAvatar({
  person,
  kind,
  className,
}: {
  person: Person;
  kind: NotificationKind;
  className?: string;
}) {
  const meta = KINDS[kind];
  const Glyph = meta.glyph;
  const badgeStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <PersonAvatar person={person} />
      <span
        aria-hidden='true'
        className='bg-card absolute -end-1 -bottom-1 inline-flex rounded-full p-px'
      >
        <span
          style={badgeStyle}
          className='chip-3d inline-flex size-4 items-center justify-center rounded-full'
        >
          <Glyph strokeWidth={2.25} className='size-2.5' />
        </span>
      </span>
    </span>
  );
}

export function StatusChip({ status }: { status: StatusId }) {
  const meta = STATUSES[status];
  const Glyph = meta.glyph;
  const chipStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <span
      style={chipStyle}
      className='chip-3d inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap'
    >
      <Glyph strokeWidth={2.25} className='size-3' />
      {meta.label}
    </span>
  );
}
