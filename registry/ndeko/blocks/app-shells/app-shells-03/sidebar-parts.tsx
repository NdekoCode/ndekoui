'use client';

import { motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import type { Entity, NavItem, Person } from './data';

export const NAV_ROW = [
  'relative flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[13px] font-medium text-foreground outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
  "[&_svg]:pointer-events-none [&_svg]:relative [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
].join(' ');

const INDICATOR_TRAVEL: Transition = {
  duration: 0.25,
  ease: [0.77, 0, 0.175, 1],
};

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return INDICATOR_TRAVEL;
}

/** The one highlight of the active row. It travels from the old row to the new one. */
export function ActiveRowIndicator({ layoutId }: { layoutId: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden='true'
      layoutId={layoutId}
      transition={travelOf(shouldReduceMotion)}
      className='bg-foreground/[0.07] absolute inset-0 rounded-md'
    />
  );
}

const TILE_SIZE = {
  xs: 'size-4 rounded-[4px] text-[9px]',
  sm: 'size-5 rounded-[5px] text-[10px]',
  md: 'size-6 rounded-md text-[11px]',
} as const;

export function EntityTile({
  entity,
  size = 'md',
  className,
}: {
  entity: Entity;
  size?: keyof typeof TILE_SIZE;
  className?: string;
}) {
  const tileStyle = { '--gem': entity.color } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={tileStyle}
      className={cn(
        'gem-plate inline-flex shrink-0 items-center justify-center font-semibold',
        TILE_SIZE[size],
        className
      )}
    >
      {entity.initials}
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
    <Avatar className={className}>
      {person.avatar && <AvatarImage src={person.avatar} alt='' />}
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  );
}

export function ariaCurrentOf(isActive: boolean) {
  if (isActive) {
    return 'page' as const;
  }
  return undefined;
}

type NavRowProps = {
  item: NavItem;
  isActive: boolean;
  indicatorId: string;
  count?: number;
  onSelect: (item: NavItem) => void;
};

export function NavRow({
  item,
  isActive,
  indicatorId,
  count = 0,
  onSelect,
}: NavRowProps) {
  const hasCount = count > 0;
  const ItemIcon = item.icon;
  const ariaCurrent = ariaCurrentOf(isActive);

  function selectItem() {
    onSelect(item);
  }

  return (
    <li>
      <button
        type='button'
        aria-current={ariaCurrent}
        onClick={selectItem}
        className={NAV_ROW}
      >
        {isActive && <ActiveRowIndicator layoutId={indicatorId} />}
        <ItemIcon />
        <span className='relative min-w-0 flex-1 truncate'>{item.label}</span>
        {hasCount && (
          <MotionNumber
            value={count}
            className='text-muted-foreground text-xs font-normal'
          />
        )}
      </button>
    </li>
  );
}
