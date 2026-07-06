import { cn } from '@/registry/ndeko/lib/utils';

const VIEW = 120;

const CENTRE = VIEW / 2;

const RADIUS = 52;

const STROKE_WIDTH = 8;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function openLengthOf(score: number, max: number) {
  const ratio = score / max;
  const atLeastNone = Math.max(0, ratio);
  const share = Math.min(1, atLeastNone);
  const open = 1 - share;
  return CIRCUMFERENCE * open;
}

function easedOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'transition-none';
  }
  return 'transition-[stroke-dashoffset] duration-[1100ms] ease-(--ease-out-strong)';
}

type ScoreRingProps = {
  score: number;
  max: number;
  shouldReduceMotion: boolean;
  className?: string;
  children?: React.ReactNode;
};

/** The stroke is the only thing that moves: it closes to its length once, as the score in the middle rolls. */
export function ScoreRing({
  score,
  max,
  shouldReduceMotion,
  className,
  children,
}: ScoreRingProps) {
  return (
    <span
      className={cn(
        'relative inline-flex size-32 shrink-0 items-center justify-center',
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
          strokeWidth={STROKE_WIDTH}
          className='stroke-foreground/10'
        />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill='none'
          strokeWidth={STROKE_WIDTH}
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={openLengthOf(score, max)}
          className={cn('stroke-primary', easedOf(shouldReduceMotion))}
        />
      </svg>
      {children}
    </span>
  );
}
