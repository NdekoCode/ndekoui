'use client';

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const SQUEEZE = 0.74;

const SPREAD_PERCENT = 8;

const SQUEEZED_STYLE = {
  width: `${100 / SQUEEZE}%`,
  transform: `scaleX(${SQUEEZE})`,
};

type SlidingLineProps = {
  progress: MotionValue<number>;
  direction: 1 | -1;
  isStill: boolean;
  children: string;
};

function slideDirectionOf(index: number): 1 | -1 {
  if (index % 2 === 0) {
    return 1;
  }
  return -1;
}

function shiftOf(isStill: boolean, direction: 1 | -1) {
  if (isStill) {
    return [0, 0];
  }
  return [-SPREAD_PERCENT * direction, SPREAD_PERCENT * direction];
}

function SlidingLine({
  progress,
  direction,
  isStill,
  children,
}: SlidingLineProps) {
  const shift = shiftOf(isStill, direction);
  const x = useTransform(progress, [0, 1], [`${shift[0]}%`, `${shift[1]}%`]);

  return (
    <motion.p style={{ x }} className='origin-left whitespace-nowrap'>
      <span
        style={SQUEEZED_STYLE}
        className='block origin-left text-[clamp(2.75rem,12cqw,9rem)] leading-[0.92] font-semibold tracking-[-0.03em]'
      >
        {children}
      </span>
    </motion.p>
  );
}

type SlidingHeadlinesProps = {
  lines: readonly string[];
};

/** A line is laid out wider than the page and squeezed back in, which is how the face gets its condensed width. */
export function SlidingHeadlines({ lines }: SlidingHeadlinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <div ref={ref} className='flex flex-col gap-1 overflow-x-clip'>
      {lines.map((line, index) => {
        const direction = slideDirectionOf(index);
        return (
          <SlidingLine
            key={line}
            progress={scrollYProgress}
            direction={direction}
            isStill={Boolean(shouldReduceMotion)}
          >
            {line}
          </SlidingLine>
        );
      })}
    </div>
  );
}
