'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

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
  const shouldReduceMotion = useReducedMotion();

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

const COUNT_SHIFT_PX = 8;

const COUNT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const COUNT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * COUNT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * COUNT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type CountState = { value: number; direction: number };

function countVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return COUNT_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next > previous) {
    return 1;
  }
  return -1;
}

export function SlidingCount({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState<CountState>({ value, direction: 1 });
  const variants = countVariantsOf(shouldReduceMotion);

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
          key={value}
          custom={shown.direction}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={COUNT_TRANSITION}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
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
            <SlidingCount
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
