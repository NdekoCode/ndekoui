'use client';

import { motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  EASE_IN_OUT_STRONG,
  INSTANT,
} from '@/registry/ndeko/lib/motion-presets';

import type { NavItem } from './data';

export const NAV_ROW = [
  'relative flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-start text-[13px] font-medium text-foreground outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
  "[&_svg]:pointer-events-none [&_svg]:relative [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
].join(' ');

const INDICATOR_TRAVEL: Transition = {
  duration: 0.25,
  ease: EASE_IN_OUT_STRONG,
};

function travelOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return INDICATOR_TRAVEL;
}

function ActiveRowIndicator({ layoutId }: { layoutId: string }) {
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

function ariaCurrentOf(isActive: boolean) {
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

  function selectItem() {
    onSelect(item);
  }

  return (
    <li>
      <button
        type='button'
        aria-current={ariaCurrentOf(isActive)}
        onClick={selectItem}
        className={NAV_ROW}
      >
        {isActive && <ActiveRowIndicator layoutId={indicatorId} />}
        <ItemIcon />
        <span className='relative min-w-0 flex-1 truncate'>{item.label}</span>
        {hasCount && (
          <MotionNumber
            value={count}
            className='text-muted-foreground relative text-xs font-normal'
          />
        )}
      </button>
    </li>
  );
}
