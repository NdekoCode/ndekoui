import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { durationPartsOf, formatDuration } from './figures';

const TWO_DIGITS: Intl.NumberFormatOptions = { minimumIntegerDigits: 2 };

type DurationFigureProps = {
  minutes: number;
  className?: string;
};

/** Hours and minutes roll as two numbers, but a screen reader hears the duration once. */
export function DurationFigure({ minutes, className }: DurationFigureProps) {
  const parts = durationPartsOf(minutes);
  const text = formatDuration(minutes);

  return (
    <span
      className={cn(
        'inline-flex items-baseline whitespace-nowrap tabular-nums',
        className
      )}
    >
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true'>
        <MotionNumber value={parts.hours} suffix='h' />{' '}
        <MotionNumber value={parts.minutes} format={TWO_DIGITS} suffix='m' />
      </span>
    </span>
  );
}
