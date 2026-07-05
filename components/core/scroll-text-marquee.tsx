'use client';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react';
import { useRef, type RefObject } from 'react';
import useMeasure from 'react-use-measure';

export type ScrollTextMarqueeDirection = 'left' | 'right';

type DirectionSign = 1 | -1;

type MeasureRef = ReturnType<typeof useMeasure>[0];

const VELOCITY_SPRING = { damping: 50, stiffness: 400 };

/** At 1000px of scroll per second, the text runs this many times faster than at rest. */
const BOOST_PER_1000_PX = 4;

function signOf(direction: ScrollTextMarqueeDirection): DirectionSign {
  if (direction === 'right') {
    return 1;
  }
  return -1;
}

function oppositeOf(sign: DirectionSign): DirectionSign {
  if (sign === 1) {
    return -1;
  }
  return 1;
}

function translateOf(offset: number, copyWidth: number) {
  if (copyWidth === 0) {
    return 'translateX(0px)';
  }
  const wrappedOffset = wrap(-copyWidth, 0, offset);
  return `translateX(${wrappedOffset}px)`;
}

function hiddenFromReadersOf(index: number) {
  if (index > 0) {
    return true;
  }
  return undefined;
}

function measuredRefOf(index: number, measureRef: MeasureRef) {
  if (index === 0) {
    return measureRef;
  }
  return undefined;
}

export type ScrollTextMarqueeProps = {
  children: React.ReactNode;
  speed?: number;
  direction?: ScrollTextMarqueeDirection;
  bidirectional?: boolean;
  repeat?: number;
  containerRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export function ScrollTextMarquee({
  children,
  speed = 60,
  direction = 'left',
  bidirectional = false,
  repeat = 4,
  containerRef,
  className,
}: ScrollTextMarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [copyRef, { width: copyWidth }] = useMeasure();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isInView = useInView(rootRef);
  const baseSign = signOf(direction);
  const signRef = useRef<DirectionSign>(baseSign);
  const offset = useMotionValue(0);
  const { scrollY } = useScroll({ container: containerRef });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, VELOCITY_SPRING);
  const boost = useTransform(
    smoothVelocity,
    [0, 1000],
    [0, BOOST_PER_1000_PX],
    { clamp: false }
  );
  const transform = useTransform(offset, (latest) =>
    translateOf(latest, copyWidth)
  );
  const copies = Array.from({ length: repeat }, (_, index) => index);
  const isStill = shouldReduceMotion || !isInView;

  useAnimationFrame((_, delta) => {
    if (isStill) {
      return;
    }
    const currentBoost = boost.get();
    const isScrollingUp = currentBoost < 0;
    const isScrollingDown = currentBoost > 0;
    if (!bidirectional) {
      signRef.current = baseSign;
    }
    const followsScrollUp = bidirectional && isScrollingUp;
    const followsScrollDown = bidirectional && isScrollingDown;
    if (followsScrollUp) {
      signRef.current = oppositeOf(baseSign);
    }
    if (followsScrollDown) {
      signRef.current = baseSign;
    }
    const seconds = delta / 1000;
    const distanceAtRest = speed * seconds;
    const boostSize = Math.abs(currentBoost);
    const multiplier = 1 + boostSize;
    const distance = distanceAtRest * multiplier;
    const step = signRef.current * distance;
    const nextOffset = offset.get() + step;
    offset.set(nextOffset);
  });

  return (
    <div
      ref={rootRef}
      className={cn(
        'flex overflow-hidden text-5xl leading-tight font-semibold whitespace-nowrap sm:text-7xl',
        className
      )}
    >
      <motion.div className='flex w-max' style={{ transform }}>
        {copies.map((index) => (
          <span
            key={index}
            ref={measuredRefOf(index, copyRef)}
            aria-hidden={hiddenFromReadersOf(index)}
            className='shrink-0 pr-[0.4em]'
          >
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
