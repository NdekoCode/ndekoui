'use client';
import { cn } from '@/lib/utils';

export type MarqueeDirection = 'horizontal' | 'vertical';

type MarqueeStyle = React.CSSProperties & {
  '--marquee-gap': string;
  '--marquee-duration'?: string;
};

const TRACK_CLASS: Record<MarqueeDirection, string> = {
  horizontal: 'w-max motion-safe:animate-marquee motion-reduce:w-full',
  vertical: 'h-max flex-col motion-safe:animate-marquee-y',
};

const COPY_CLASS: Record<MarqueeDirection, string> = {
  horizontal: 'items-center pr-(--marquee-gap)',
  vertical: 'flex-col pb-(--marquee-gap)',
};

const FIRST_COPY_REDUCED_CLASS: Record<MarqueeDirection, string> = {
  horizontal:
    'motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0',
  vertical: '',
};

const FADE_CLASS: Record<MarqueeDirection, string> = {
  horizontal: 'mask-x-from-85% motion-reduce:mask-none',
  vertical: 'mask-y-from-85%',
};

const PAUSE_CLASS =
  'group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]';

function styleOf(gap: number, duration: number | undefined) {
  const style: MarqueeStyle = { '--marquee-gap': `${gap}px` };
  if (duration !== undefined) {
    style['--marquee-duration'] = `${duration}s`;
  }
  return style;
}

function isRepeatedCopy(index: number) {
  return index > 0;
}

function hiddenFromReadersOf(isRepeated: boolean) {
  if (isRepeated) {
    return true;
  }
  return undefined;
}

export type MarqueeProps = {
  children: React.ReactNode;
  direction?: MarqueeDirection;
  reverse?: boolean;
  pauseOnHover?: boolean;
  gap?: number;
  duration?: number;
  repeat?: number;
  fade?: boolean;
  className?: string;
};

export function Marquee({
  children,
  direction = 'horizontal',
  reverse = false,
  pauseOnHover = true,
  gap = 16,
  duration,
  repeat = 2,
  fade = true,
  className,
}: MarqueeProps) {
  const copyCount = repeat * 2;
  const copies = Array.from({ length: copyCount }, (_, index) => index);
  const isVertical = direction === 'vertical';

  return (
    <div
      style={styleOf(gap, duration)}
      className={cn(
        'group/marquee flex overflow-hidden',
        isVertical && 'flex-col',
        fade && FADE_CLASS[direction],
        className
      )}
    >
      <div
        className={cn(
          'flex',
          TRACK_CLASS[direction],
          reverse && '[animation-direction:reverse]!',
          pauseOnHover && PAUSE_CLASS
        )}
      >
        {copies.map((index) => {
          const isRepeated = isRepeatedCopy(index);

          return (
            <div
              key={index}
              aria-hidden={hiddenFromReadersOf(isRepeated)}
              inert={isRepeated}
              className={cn(
                'flex shrink-0 gap-(--marquee-gap)',
                COPY_CLASS[direction],
                isRepeated && 'motion-reduce:hidden',
                !isRepeated && FIRST_COPY_REDUCED_CLASS[direction]
              )}
            >
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
}
