'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  BookmarkIcon,
  CheckIcon,
  CircleAlertIcon,
  ClockIcon,
  MinusIcon,
  MoonIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import type { IssueType, Member, Presence, Role } from './data';

type Meta = { label: string; color: string; glyph: Icon };

export const PRESENCE_META: Record<Presence, Meta> = {
  tracking: {
    label: 'Tracking time',
    color: 'var(--primary)',
    glyph: ClockIcon,
  },
  online: { label: 'Online', color: 'var(--success)', glyph: CheckIcon },
  away: { label: 'Away', color: 'var(--warning)', glyph: MoonIcon },
  offline: {
    label: 'Offline',
    color: 'var(--muted-foreground)',
    glyph: MinusIcon,
  },
};

const ISSUE_TYPES: Record<IssueType, Meta> = {
  task: { label: 'Task', color: 'var(--info)', glyph: CheckIcon },
  bug: { label: 'Bug', color: 'var(--destructive)', glyph: CircleAlertIcon },
  story: { label: 'Story', color: 'var(--success)', glyph: BookmarkIcon },
};

export const ROLE_LABELS: Record<Role, string> = {
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const restText = String(rest);
  const paddedRest = restText.padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

export function TeamTile({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <MeshTile
      seed={name}
      color={color}
      className={cn('size-10 rounded-xl', className)}
    />
  );
}

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

export function MemberAvatar({
  member,
  className,
}: {
  member: Member;
  className?: string;
}) {
  return (
    <Avatar
      className={cn('size-7 text-[10px]', className)}
      seed={member.name}
    />
  );
}

/** A face with the person's presence as a small glyph on its corner, read out after the name. */
export function PresenceAvatar({ member }: { member: Member }) {
  const presence = PRESENCE_META[member.presence];
  const Glyph = presence.glyph;
  const badgeStyle = { '--chip': presence.color } as React.CSSProperties;

  return (
    <span className='relative inline-flex shrink-0'>
      <MemberAvatar member={member} className='size-8 text-[11px]' />
      <span
        aria-hidden='true'
        className='bg-card absolute -end-0.5 -bottom-0.5 flex rounded-full p-px'
      >
        <span
          style={badgeStyle}
          className='chip-3d flex size-3.5 items-center justify-center rounded-full'
        >
          <Glyph className='size-2' strokeWidth={2.75} />
        </span>
      </span>
      <span className='sr-only'>{presence.label}</span>
    </span>
  );
}

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** The spring AnimatedSize resizes with, so rows close at the pace their list follows. */
const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const ROW_VARIANTS: Variants = {
  shown: {
    height: 'auto',
    opacity: 1,
    transition: {
      ...SIZE_SPRING,
      opacity: { duration: 0.2, ease: EASE_OUT_STRONG },
    },
  },
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      ...SIZE_SPRING,
      opacity: { duration: 0.12, ease: EASE_OUT_STRONG },
    },
  },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT_STRONG } },
  hidden: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT_STRONG } },
};

export function rowCollapseOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

const SHIFT_PX = 8;

const SLIDE_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const SLIDE_FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function slideVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return SLIDE_FADE;
  }
  return SLIDE_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next > previous) {
    return 1;
  }
  return -1;
}

type Shown = { value: number; direction: number };

/** A figure that changed under the person's choice: it slides in the direction of the change. */
export function SlidingFigure({
  value,
  format,
  className,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState<Shown>({ value, direction: 1 });
  const text = format(value);

  if (shown.value !== value) {
    const direction = directionOf(shown.value, value);
    setShown({ value, direction });
  }

  return (
    <span
      className={cn(
        'relative inline-flex overflow-hidden tabular-nums',
        className
      )}
    >
      <AnimatePresence
        mode='popLayout'
        initial={false}
        custom={shown.direction}
      >
        <motion.span
          key={text}
          custom={shown.direction}
          variants={slideVariantsOf(shouldReduceMotion)}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SLIDE_TRANSITION}
          className='whitespace-nowrap'
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
