import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  MoonIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

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

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const AVATAR_SIZE: Record<AvatarSize, string> = {
  xs: 'size-5',
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-12',
};

const BADGE_SIZE: Record<AvatarSize, string> = {
  xs: 'size-2.5 [&_svg]:size-1.5',
  sm: 'size-3 [&_svg]:size-2',
  md: 'size-3.5 [&_svg]:size-2',
  lg: 'size-4.5 [&_svg]:size-3',
};

type PersonAvatarProps = {
  person: Pick<Person, 'name'>;
  size?: AvatarSize;
  /** Drawn as a small glyph on the avatar, never as a plain dot; its label is read by screen readers. */
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
      <Avatar className={AVATAR_SIZE[size]} seed={person.name} />
      {presence && <PresenceGlyph presence={presence} size={size} />}
    </span>
  );
}

function PresenceGlyph({
  presence,
  size,
}: {
  presence: Presence;
  size: AvatarSize;
}) {
  const meta = PRESENCE_META[presence];
  const Glyph = meta.icon;
  const badgeStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <>
      <span className='absolute -right-0.5 -bottom-0.5 flex rounded-full bg-[var(--aside-surface,var(--popover))] p-px'>
        <span
          style={badgeStyle}
          className={cn(
            'chip-3d flex items-center justify-center rounded-full',
            BADGE_SIZE[size]
          )}
        >
          <Glyph strokeWidth={2.75} />
        </span>
      </span>
      <span className='sr-only'>{meta.label}</span>
    </>
  );
}
