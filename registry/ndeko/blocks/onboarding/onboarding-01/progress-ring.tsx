import { cn } from '@/registry/ndeko/lib/utils';

export type ProgressRingSize = 'sm' | 'md';

const SIZE_CLASS: Record<ProgressRingSize, string> = {
  sm: 'size-5',
  md: 'size-9',
};

const STROKE_WIDTH: Record<ProgressRingSize, number> = {
  sm: 5,
  md: 3,
};

const VIEW = 36;

const CENTRE = VIEW / 2;

const RADIUS = 15;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The part of the ring that stays empty. No step yet counts as nothing done. */
function emptyLengthOf(done: number, total: number) {
  if (total <= 0) {
    return CIRCUMFERENCE;
  }
  const share = Math.min(1, done / total);
  return CIRCUMFERENCE * (1 - share);
}

type ProgressRingProps = {
  done: number;
  total: number;
  size?: ProgressRingSize;
  className?: string;
  /** What sits in the middle of the ring: a count, or nothing. */
  children?: React.ReactNode;
};

/**
 * A ring that fills as steps are done. The stroke eases to its new length once per step, which is
 * the only time it is painted again. With nothing done the stroke is hidden: a round cap would
 * leave a dot.
 */
export function ProgressRing({
  done,
  total,
  size = 'md',
  className,
  children,
}: ProgressRingProps) {
  const strokeWidth = STROKE_WIDTH[size];
  const isEmpty = done <= 0;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        SIZE_CLASS[size],
        className
      )}
    >
      <svg
        aria-hidden='true'
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className='absolute inset-0 size-full -rotate-90'
      >
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill='none'
          strokeWidth={strokeWidth}
          className='stroke-foreground/10'
        />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill='none'
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={emptyLengthOf(done, total)}
          className={cn(
            'stroke-primary transition-[stroke-dashoffset] duration-500 ease-(--ease-out-strong)',
            isEmpty && 'invisible'
          )}
        />
      </svg>
      {children}
    </span>
  );
}
