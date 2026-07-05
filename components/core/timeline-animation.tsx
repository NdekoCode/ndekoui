'use client';
import {
  motion,
  type MotionValue,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;
const SETTLE_DURATION = 0.3;
const SETTLE_DISTANCE = 8;
const SETTLE_MARGIN = '0px 0px -10% 0px';

type TimelineAnimationContextValue = {
  containerRef?: RefObject<HTMLElement | null>;
};

const TimelineAnimationContext = createContext<TimelineAnimationContextValue>(
  {}
);

function fillOf(
  prefersReducedMotion: boolean | null,
  progress: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return 1;
  }
  return progress;
}

function reachedOpacityOf(progress: number): number {
  if (progress > 0) {
    return 1;
  }
  return 0;
}

function settleStateOf(isSettled: boolean) {
  if (isSettled) {
    return 'visible';
  }
  return 'hidden';
}

function settleVariantsOf(prefersReducedMotion: boolean | null): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }
  return {
    hidden: { opacity: 0, y: SETTLE_DISTANCE },
    visible: { opacity: 1, y: 0 },
  };
}

export type TimelineAnimationProps = {
  children: ReactNode;
  className?: string;
  containerRef?: RefObject<HTMLElement | null>;
};

export function TimelineAnimation({
  children,
  className,
  containerRef,
}: TimelineAnimationProps) {
  const value = useMemo(() => ({ containerRef }), [containerRef]);

  return (
    <TimelineAnimationContext value={value}>
      <ol className={cn('flex flex-col', className)}>{children}</ol>
    </TimelineAnimationContext>
  );
}

export type TimelineAnimationItemProps = {
  children: ReactNode;
  className?: string;
};

export function TimelineAnimationItem({
  children,
  className,
}: TimelineAnimationItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);
  const segmentRef = useRef<HTMLSpanElement>(null);
  const { containerRef } = useContext(TimelineAnimationContext);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isInView = useInView(itemRef, {
    root: containerRef,
    once: true,
    margin: SETTLE_MARGIN,
  });
  const prefersStill = Boolean(prefersReducedMotion);
  const isSettled = isInView || prefersStill;
  const settleState = settleStateOf(isSettled);
  const settleVariants = settleVariantsOf(prefersReducedMotion);

  // The segment runs from this dot to the next one, so its progress fills the line exactly
  // where the middle of the scrolling area is.
  const { scrollYProgress } = useScroll({
    target: segmentRef,
    container: containerRef,
    offset: ['start center', 'end center'],
  });
  const reachedOpacity = useTransform(scrollYProgress, reachedOpacityOf);
  const lineFill = fillOf(prefersReducedMotion, scrollYProgress);
  const dotFill = fillOf(prefersReducedMotion, reachedOpacity);

  return (
    <li
      ref={itemRef}
      className={cn('group/item relative ps-8 pb-10 last:pb-0', className)}
    >
      <span
        ref={segmentRef}
        aria-hidden='true'
        className='bg-border absolute start-[7.5px] top-2.5 -bottom-2.5 w-px group-last/item:invisible'
      >
        <motion.span
          style={{ scaleY: lineFill }}
          className='bg-primary absolute inset-0 origin-top'
        />
      </span>
      <span
        aria-hidden='true'
        className='bg-muted absolute start-0 top-0.5 grid size-4 place-items-center rounded-full'
      >
        <span className='bg-foreground/15 col-start-1 row-start-1 size-1.5 rounded-full' />
        <motion.span
          style={{ opacity: dotFill }}
          className='bg-primary col-start-1 row-start-1 size-1.5 rounded-full transition-opacity duration-200'
        />
      </span>
      <motion.div
        initial='hidden'
        animate={settleState}
        variants={settleVariants}
        transition={{ duration: SETTLE_DURATION, ease: EASE_OUT_STRONG }}
      >
        {children}
      </motion.div>
    </li>
  );
}
