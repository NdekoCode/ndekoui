import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { PRESENCE_META, type Member } from './people';

const SIZE_CLASS = {
  sm: { avatar: 'size-7', badge: 'size-3.5', glyph: 'size-2' },
  md: { avatar: 'size-9', badge: 'size-4', glyph: 'size-2.5' },
  lg: { avatar: 'size-12', badge: 'size-5', glyph: 'size-3' },
} as const;

type PresenceAvatarProps = {
  member: Member;
  size?: keyof typeof SIZE_CLASS;
  /** The colour behind the badge's cut-out: the surface the avatar sits on. */
  surfaceClassName?: string;
  className?: string;
};

/** A person's face with their presence as a small glyph on its corner, read out after the name. */
export function PresenceAvatar({
  member,
  size = 'md',
  surfaceClassName = 'bg-card',
  className,
}: PresenceAvatarProps) {
  const presence = PRESENCE_META[member.presence];
  const Glyph = presence.glyph;
  const badgeStyle = { '--chip': presence.color } as React.CSSProperties;
  const sizes = SIZE_CLASS[size];

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={sizes.avatar} seed={member.name} />
      <span
        aria-hidden='true'
        className={cn(
          'absolute -end-0.5 -bottom-0.5 flex rounded-full p-px',
          surfaceClassName
        )}
      >
        <span
          style={badgeStyle}
          className={cn(
            'chip-3d flex items-center justify-center rounded-full',
            sizes.badge
          )}
        >
          <Glyph className={sizes.glyph} strokeWidth={2.75} />
        </span>
      </span>
      <span className='sr-only'>{presence.label}</span>
    </span>
  );
}
