import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  MoonIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { Person, Presence } from './people';

type PresenceMeta = { label: string; color: string; icon: Icon };

export const PRESENCE_META: Record<Presence, PresenceMeta> = {
  tracking: {
    label: 'Tracking time',
    color: 'var(--primary)',
    icon: ClockIcon,
  },
  online: { label: 'Online', color: 'var(--success)', icon: CheckIcon },
  away: { label: 'Away', color: 'var(--warning)', icon: MoonIcon },
  offline: {
    label: 'Offline',
    color: 'var(--muted-foreground)',
    icon: MinusIcon,
  },
};

type AvatarSize = 'sm' | 'md' | 'lg';

const AVATAR_SIZE: Record<AvatarSize, string> = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-[13px]',
};

const BADGE_SIZE: Record<AvatarSize, string> = {
  sm: 'size-3 [&_svg]:size-2',
  md: 'size-3.5 [&_svg]:size-2',
  lg: 'size-4 [&_svg]:size-2.5',
};

type PersonAvatarProps = {
  person: Pick<Person, 'name' | 'initials' | 'avatar'>;
  size?: AvatarSize;
  /** Drawn as a small glyph on the avatar; its label is read by screen readers. */
  presence?: Presence;
  className?: string;
};

export function PersonAvatar({
  person,
  size = 'md',
  presence,
  className,
}: PersonAvatarProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={AVATAR_SIZE[size]}>
        {person.avatar && <AvatarImage src={person.avatar} alt='' />}
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      {presence && <PresenceBadge presence={presence} size={size} />}
    </span>
  );
}

function PresenceBadge({
  presence,
  size,
}: {
  presence: Presence;
  size: AvatarSize;
}) {
  const meta = PRESENCE_META[presence];
  const PresenceGlyph = meta.icon;
  const badgeStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <>
      <span className='bg-popover absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span
          style={badgeStyle}
          className={cn(
            'chip-3d flex items-center justify-center rounded-full',
            BADGE_SIZE[size]
          )}
        >
          <PresenceGlyph strokeWidth={2.75} />
        </span>
      </span>
      <span className='sr-only'>{meta.label}</span>
    </>
  );
}

function initialOf(email: string) {
  const first = email.charAt(0);
  return first.toUpperCase();
}

type PendingAvatarProps = {
  email: string;
  size?: AvatarSize;
  className?: string;
};

/** Someone invited who has not joined yet: an empty dashed slot with the first letter of the address and a clock. */
export function PendingAvatar({
  email,
  size = 'md',
  className,
}: PendingAvatarProps) {
  const clockStyle = { '--chip': 'var(--warning)' } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      className={cn('relative inline-flex shrink-0', className)}
    >
      <span
        className={cn(
          'hairline-border border-foreground/25 text-muted-foreground flex items-center justify-center rounded-full border-dashed font-medium',
          AVATAR_SIZE[size]
        )}
      >
        {initialOf(email)}
      </span>
      <span className='bg-popover absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span
          style={clockStyle}
          className={cn(
            'chip-3d flex items-center justify-center rounded-full',
            BADGE_SIZE[size]
          )}
        >
          <ClockIcon strokeWidth={2.75} />
        </span>
      </span>
    </span>
  );
}
