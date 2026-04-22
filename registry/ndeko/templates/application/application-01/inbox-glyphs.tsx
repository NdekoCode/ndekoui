import {
  AtSignIcon,
  CircleDashedIcon,
  MessageCircleIcon,
  UserIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { NotificationKind, Person } from './data';

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
