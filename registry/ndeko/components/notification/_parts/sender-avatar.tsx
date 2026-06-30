import {
  AtSignIcon,
  CircleDashedIcon,
  MailIcon,
  MessageCircleIcon,
  UserRoundPlusIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { Person } from './people';

export type NotificationKind =
  'mention' | 'comment' | 'assigned' | 'status' | 'invite';

type KindMeta = { label: string; color: string; glyph: Icon };

export const KIND_META: Record<NotificationKind, KindMeta> = {
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
  invite: { label: 'Invitation', color: 'var(--warning)', glyph: MailIcon },
};

type SenderAvatarProps = {
  person: Person;
  kind: NotificationKind;
  /** The colour behind the badge's cut-out: the surface the avatar sits on. */
  surfaceClassName?: string;
  className?: string;
};

/** A sender's face with the kind of the notification on its lower corner. */
export function SenderAvatar({
  person,
  kind,
  surfaceClassName = 'bg-card',
  className,
}: SenderAvatarProps) {
  const meta = KIND_META[kind];
  const Glyph = meta.glyph;
  const badgeStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className='size-8 text-[11px]'>
        {person.avatar && <AvatarImage src={person.avatar} alt='' />}
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      <span
        aria-hidden='true'
        className={cn(
          'absolute -end-1 -bottom-1 inline-flex rounded-full p-px',
          surfaceClassName
        )}
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
