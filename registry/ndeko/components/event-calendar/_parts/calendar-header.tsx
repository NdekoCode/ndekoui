'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import {
  periodCaptionOf,
  periodKeyOf,
  periodTitleOf,
  periodUnitOf,
} from './navigation';
import type { CalendarView } from './types';

const TITLE_SHIFT_PX = 6;

const TITLE_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const TITLE_EXIT: Transition = { duration: 0.1, ease: [0.23, 1, 0.32, 1] };

const TITLE_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * TITLE_SHIFT_PX;
    return { opacity: 0, x: offset };
  },
  visible: { opacity: 1, x: 0 },
  exit: (direction: number) => {
    const offset = direction * TITLE_SHIFT_PX;
    return { opacity: 0, x: -offset, transition: TITLE_EXIT };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: TITLE_EXIT },
};

function titleVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TITLE_VARIANTS;
}

type PeriodHeadingProps = {
  view: CalendarView;
  date: Date;
  direction: number;
};

/** The period on screen. Only the heading answers previous and next, with a short nudge. */
function PeriodHeading({ view, date, direction }: PeriodHeadingProps) {
  const shouldReduceMotion = useReducedMotion();
  const title = periodTitleOf(date, view);
  const caption = periodCaptionOf(date, view);
  const titleKey = `${view}-${periodKeyOf(date, view)}`;

  return (
    <div className='flex min-w-0 flex-1 items-baseline gap-2'>
      <h2 className='relative flex min-w-0 text-sm font-semibold @2xl:text-base'>
        <span className='sr-only' aria-live='polite'>
          {title.full}
        </span>
        <AnimatePresence mode='popLayout' initial={false} custom={direction}>
          <motion.span
            key={titleKey}
            aria-hidden='true'
            className='min-w-0 truncate'
            custom={direction}
            variants={titleVariantsOf(shouldReduceMotion)}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={TITLE_TRANSITION}
          >
            <span className='@xl:hidden'>{title.short}</span>
            <span className='hidden @xl:inline'>{title.full}</span>
          </motion.span>
        </AnimatePresence>
      </h2>
      {caption && (
        <span className='text-muted-foreground hidden shrink-0 text-xs @3xl:inline'>
          {caption}
        </span>
      )}
    </div>
  );
}

type CalendarHeaderProps = {
  view: CalendarView;
  date: Date;
  /** `1` after next, `-1` after previous, `0` when the view changes. */
  direction: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  /** Placed before Today, for example a button that opens a sidebar. */
  start?: React.ReactNode;
  /** Placed after the heading: the view switcher and the actions. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Today, previous and next, and the period heading. On a narrow calendar the children wrap
 * under it; a child with `order-last w-full` takes the second row on its own.
 */
export function CalendarHeader({
  view,
  date,
  direction,
  onPrevious,
  onNext,
  onToday,
  start,
  children,
  className,
}: CalendarHeaderProps) {
  const unit = periodUnitOf(view);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 p-3 @2xl:flex-nowrap @2xl:gap-3 @2xl:px-4',
        className
      )}
    >
      {start}
      <Button variant='outline' onClick={onToday}>
        Today
      </Button>
      <div className='flex items-center'>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Previous ${unit}`}
          onClick={onPrevious}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Next ${unit}`}
          onClick={onNext}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <PeriodHeading view={view} date={date} direction={direction} />
      {children}
    </div>
  );
}
