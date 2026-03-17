import {
  AtSignIcon,
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleDashedIcon,
  MessageCircleIcon,
  UserIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { IssueTypeId, NotificationKind, Person } from './data';

type IssueTypeMeta = {
  name: string;
  color: string;
  glyph: Icon;
};

const ISSUE_TYPES: Record<IssueTypeId, IssueTypeMeta> = {
  task: { name: 'Task', color: 'var(--info)', glyph: CheckIcon },
  bug: { name: 'Bug', color: 'var(--destructive)', glyph: CircleAlertIcon },
  story: { name: 'Story', color: 'var(--success)', glyph: BookmarkIcon },
  epic: { name: 'Epic', color: 'var(--primary)', glyph: ZapIcon },
};

export function IssueTypeGem({
  type,
  className,
}: {
  type: IssueTypeId;
  className?: string;
}) {
  const meta = ISSUE_TYPES[type];
  const Glyph = meta.glyph;
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

const KIND_GLYPH: Record<NotificationKind, Icon> = {
  mention: AtSignIcon,
  comment: MessageCircleIcon,
  assigned: UserIcon,
  status: CircleDashedIcon,
};

function badgeMaterialOf(kind: NotificationKind) {
  if (kind === 'mention') {
    return 'chip-3d [--chip:var(--primary)]';
  }
  return 'keycap-3d text-muted-foreground';
}

export function SenderAvatar({
  person,
  kind,
}: {
  person: Person;
  kind: NotificationKind;
}) {
  const Glyph = KIND_GLYPH[kind];

  return (
    <span className='relative inline-flex shrink-0'>
      <Avatar className='size-7 text-[10px]'>
        {person.avatar && <AvatarImage src={person.avatar} alt='' />}
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      <span
        aria-hidden='true'
        className='bg-popover absolute -end-1.5 -bottom-1.5 inline-flex rounded-full p-0.5'
      >
        <span
          className={cn(
            'inline-flex size-4 items-center justify-center rounded-full',
            badgeMaterialOf(kind)
          )}
        >
          <Glyph strokeWidth={2.25} className='size-2.5' />
        </span>
      </span>
    </span>
  );
}
