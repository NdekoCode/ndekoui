'use client';

import { differenceInCalendarDays } from 'date-fns';
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import { useState } from 'react';
import {
  Day,
  useDayPicker,
  type DayProps,
  type MonthProps,
} from 'react-day-picker';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Calendar } from '@/registry/ndeko/ui/calendar';

type CalendarProps = React.ComponentProps<typeof Calendar>;

type ShownMonth = { time: number; direction: number };

const MONTH_SHIFT_PX = 12;
const RANGE_STEP_MS = 12;
const RANGE_GROWTH_MAX_MS = 240;

const MONTH_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const MONTH_AT_REST: TargetAndTransition = { opacity: 1, x: 0 };

const SETTLING_DAY_BUTTON = [
  'transition-[color,background-color,border-radius,box-shadow,scale] ease-(--ease-out-strong) active:scale-90',
  'group-[.range-middle]:[transition-delay:var(--range-delay),var(--range-delay),0ms,0ms,0ms]',
].join(' ');

function rangeStartOf(selected: unknown) {
  if (!selected) {
    return undefined;
  }
  if (typeof selected !== 'object') {
    return undefined;
  }
  if (!('from' in selected)) {
    return undefined;
  }
  return selected.from as Date | undefined;
}

function rangeDelayOf(day: Date, rangeStart: Date | undefined) {
  if (!rangeStart) {
    return '0ms';
  }
  const step = differenceInCalendarDays(day, rangeStart);
  const delay = Math.min(step * RANGE_STEP_MS, RANGE_GROWTH_MAX_MS);
  const positiveDelay = Math.max(0, delay);
  return `${positiveDelay}ms`;
}

function monthEnterOf(direction: number, shouldReduceMotion: boolean | null) {
  if (direction === 0) {
    return false;
  }
  if (shouldReduceMotion) {
    return { opacity: 0 };
  }
  const offset = direction * MONTH_SHIFT_PX;
  return { opacity: 0, x: offset };
}

function GrowingRangeDay({ style, ...props }: DayProps) {
  const { selected } = useDayPicker();
  const rangeStart = rangeStartOf(selected);
  const delay = rangeDelayOf(props.day.date, rangeStart);
  const dayStyle = { ...style, '--range-delay': delay } as React.CSSProperties;

  return <Day {...props} style={dayStyle} />;
}

function SlidingMonth({
  calendarMonth,
  displayIndex,
  children,
  ...props
}: MonthProps) {
  const time = calendarMonth.date.getTime();
  const [shown, setShown] = useState<ShownMonth>({ time, direction: 0 });
  const shouldReduceMotion = useReducedMotion();

  if (shown.time !== time) {
    const direction = Math.sign(time - shown.time);
    setShown({ time, direction });
  }

  return (
    <div data-display-index={displayIndex} {...props}>
      <AnimatedSize>
        <motion.div
          key={time}
          initial={monthEnterOf(shown.direction, shouldReduceMotion)}
          animate={MONTH_AT_REST}
          transition={MONTH_TRANSITION}
        >
          {children}
        </motion.div>
      </AnimatedSize>
    </div>
  );
}

function withSettlingDays(classNames: CalendarProps['classNames']) {
  const dayButton = cn(SETTLING_DAY_BUTTON, classNames?.day_button);
  return { ...classNames, day_button: dayButton };
}

/**
 * The calendar primitive with the date picker micro-interactions: a picked day settles in,
 * a range grows from its start to its end, a new month slides in from the side it comes from
 * and the card resizes to the number of weeks.
 */
function AnimatedCalendar({ classNames, components, ...props }: CalendarProps) {
  return (
    <Calendar
      classNames={withSettlingDays(classNames)}
      components={{ Day: GrowingRangeDay, Month: SlidingMonth, ...components }}
      {...props}
    />
  );
}

export { AnimatedCalendar };
