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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

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

/** The spring of the rail morph, the same as the width of the sidebar. */
const MORPH_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INDICATOR_RADIUS = { borderRadius: 6 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return INDICATOR_TRAVEL;
}

export function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH_SPRING;
}

/** The one highlight of the active row. It travels from the old row to the new one and morphs with the rail. */
export function ActiveRowIndicator({ layoutId }: { layoutId: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden='true'
      layout
      layoutId={layoutId}
      transition={travelOf(shouldReduceMotion)}
      style={INDICATOR_RADIUS}
      className='bg-foreground/[0.07] absolute inset-0'
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
  isCollapsed: boolean;
  indicatorId: string;
  count?: number;
  onSelect: (item: NavItem) => void;
};

export function NavRow({
  item,
  isActive,
  isCollapsed,
  indicatorId,
  count = 0,
  onSelect,
}: NavRowProps) {
  const hasCount = count > 0;
  const showsCount = hasCount && !isCollapsed;
  const showsCountDot = hasCount && isCollapsed;
  const ItemIcon = item.icon;
  const ariaCurrent = ariaCurrentOf(isActive);

  function selectItem() {
    onSelect(item);
  }

  return (
    <li>
      <Tooltip disabled={!isCollapsed}>
        <TooltipTrigger
          type='button'
          aria-current={ariaCurrent}
          onClick={selectItem}
          className={NAV_ROW}
        >
          {isActive && <ActiveRowIndicator layoutId={indicatorId} />}
          <span className='relative flex'>
            <ItemIcon />
            {showsCountDot && (
              <span className='bg-primary ring-sidebar absolute -top-0.5 -right-0.5 size-1.5 rounded-full ring-2' />
            )}
          </span>
          <span
            className={cn(
              'relative min-w-0 flex-1 truncate',
              isCollapsed && 'sr-only'
            )}
          >
            {item.label}
            {showsCountDot && <span>{`, ${count}`}</span>}
          </span>
          {showsCount && (
            <MotionNumber
              value={count}
              className='text-muted-foreground text-xs font-normal'
            />
          )}
        </TooltipTrigger>
        <TooltipContent side='right' className='flex items-center gap-2'>
          {item.label}
          {hasCount && (
            <span className='text-muted-foreground tabular-nums'>{count}</span>
          )}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
