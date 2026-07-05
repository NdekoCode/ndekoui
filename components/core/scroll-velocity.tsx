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
  type MotionValue,
} from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

export type ScrollVelocityDirection = 'left' | 'right';

type DirectionSign = 1 | -1;

type ScrollVelocityContextValue = {
  boost: MotionValue<number>;
  isRunning: boolean;
  reverseOnScrollUp: boolean;
  lean: boolean;
};

const VELOCITY_SPRING = { damping: 50, stiffness: 400 };

/** At 1000px of scroll per second, the rows run this many times faster than at rest. */
const BOOST_PER_1000_PX = 4;

const LEAN_PER_BOOST = 2;

const MAX_LEAN = 6;

/** A long first frame (a tab coming back) would throw the rows forward, so a frame never counts for more than this. */
const MAX_FRAME_SECONDS = 0.1;

const MAX_COPIES = 24;

/** The copy that screen readers and keyboards reach; the others are visual repeats. */
const READABLE_COPY = 1;

const ScrollVelocityContext = createContext<ScrollVelocityContextValue | null>(
  null
);

function useScrollVelocityContext() {
  const context = useContext(ScrollVelocityContext);
  if (!context) {
    throw new Error('ScrollVelocityRow must be used inside ScrollVelocity');
  }
  return context;
}

function signOf(direction: ScrollVelocityDirection): DirectionSign {
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

function signForBoost(
  boost: number,
  baseSign: DirectionSign,
  current: DirectionSign
) {
  if (boost < 0) {
    return oppositeOf(baseSign);
  }
  if (boost > 0) {
    return baseSign;
  }
  return current;
}

/** Enough copies to cover the row twice over the width of one copy, so neither edge ever shows a gap. */
function copyCountOf(rowWidth: number, copyWidth: number) {
  if (copyWidth <= 0) {
    return 3;
  }
  const covering = rowWidth / copyWidth;
  const rounded = Math.ceil(covering);
  const withSpares = rounded + 2;
  return Math.min(withSpares, MAX_COPIES);
}

function leanOf(boost: number, sign: DirectionSign) {
  const size = Math.abs(boost);
  const raw = size * LEAN_PER_BOOST;
  const clamped = Math.min(raw, MAX_LEAN);
  const against = -sign;
  return clamped * against;
}

/** The track starts one copy to the left, so the readable copy sits at the left edge at rest. */
function trackTransformOf(offset: number, copyWidth: number, lean: number) {
  const shifted = offset - copyWidth;
  return `translateX(${shifted}px) skewX(${lean}deg)`;
}

function isRepeatedCopy(index: number) {
  return index !== READABLE_COPY;
}

function hiddenFromReadersOf(isRepeated: boolean) {
  if (isRepeated) {
    return true;
  }
  return undefined;
}

function copyRefOf(index: number, copyRef: RefObject<HTMLDivElement | null>) {
  if (index === READABLE_COPY) {
    return copyRef;
  }
  return undefined;
}

function frameSecondsOf(delta: number) {
  const seconds = delta / 1000;
  return Math.min(seconds, MAX_FRAME_SECONDS);
}

export type ScrollVelocityProps = {
  children: ReactNode;
  containerRef?: RefObject<HTMLElement | null>;
  reverseOnScrollUp?: boolean;
  lean?: boolean;
  fade?: boolean;
  className?: string;
};

export function ScrollVelocity({
  children,
  containerRef,
  reverseOnScrollUp = true,
  lean = true,
  fade = true,
  className,
}: ScrollVelocityProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll({ container: containerRef });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, VELOCITY_SPRING);
  const boost = useTransform(
    smoothVelocity,
    [0, 1000],
    [0, BOOST_PER_1000_PX],
    { clamp: false }
  );
  const isRunning = isInView && !shouldReduceMotion;
  const value = useMemo(
    () => ({ boost, isRunning, reverseOnScrollUp, lean }),
    [boost, isRunning, reverseOnScrollUp, lean]
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        'flex flex-col overflow-hidden',
        fade && 'mask-x-from-85%',
        className
      )}
    >
      <ScrollVelocityContext.Provider value={value}>
        {children}
      </ScrollVelocityContext.Provider>
    </div>
  );
}

export type ScrollVelocityRowProps = {
  children: ReactNode;
  speed?: number;
  direction?: ScrollVelocityDirection;
  gap?: number;
  className?: string;
};

export function ScrollVelocityRow({
  children,
  speed = 40,
  direction = 'left',
  gap = 32,
  className,
}: ScrollVelocityRowProps) {
  const { boost, isRunning, reverseOnScrollUp, lean } =
    useScrollVelocityContext();
  const rowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [copyCount, setCopyCount] = useState(3);
  const baseSign = signOf(direction);
  const signRef = useRef<DirectionSign>(baseSign);
  const offset = useMotionValue(0);
  const copyWidth = useMotionValue(0);
  const tilt = useMotionValue(0);
  const transform = useTransform<number, string>(
    [offset, copyWidth, tilt],
    ([latestOffset, latestCopyWidth, latestTilt]) =>
      trackTransformOf(latestOffset, latestCopyWidth, latestTilt)
  );
  const copies = Array.from({ length: copyCount }, (_, index) => index);

  useEffect(() => {
    const row = rowRef.current;
    const copy = copyRef.current;
    if (!row) {
      return;
    }
    if (!copy) {
      return;
    }
    const measure = () => {
      const rowWidth = row.getBoundingClientRect().width;
      const measuredCopyWidth = copy.getBoundingClientRect().width;
      const nextCopyCount = copyCountOf(rowWidth, measuredCopyWidth);
      copyWidth.set(measuredCopyWidth);
      setCopyCount(nextCopyCount);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [copyWidth]);

  useAnimationFrame((_, delta) => {
    if (!isRunning) {
      return;
    }
    const currentBoost = boost.get();
    if (reverseOnScrollUp) {
      signRef.current = signForBoost(currentBoost, baseSign, signRef.current);
    }
    if (!reverseOnScrollUp) {
      signRef.current = baseSign;
    }
    const seconds = frameSecondsOf(delta);
    const boostSize = Math.abs(currentBoost);
    const multiplier = 1 + boostSize;
    const distanceAtRest = speed * seconds;
    const distance = distanceAtRest * multiplier;
    const step = signRef.current * distance;
    const width = copyWidth.get();
    if (width <= 0) {
      return;
    }
    const currentOffset = offset.get();
    const travelled = currentOffset + step;
    const wrapped = wrap(-width, 0, travelled);
    offset.set(wrapped);
    if (lean) {
      const nextTilt = leanOf(currentBoost, signRef.current);
      tilt.set(nextTilt);
    }
  });

  return (
    <div ref={rowRef} className={cn('flex overflow-hidden', className)}>
      <motion.div
        className='flex w-max shrink-0 whitespace-nowrap'
        style={{ transform }}
      >
        {copies.map((index) => {
          const isRepeated = isRepeatedCopy(index);

          return (
            <div
              key={index}
              ref={copyRefOf(index, copyRef)}
              aria-hidden={hiddenFromReadersOf(isRepeated)}
              inert={isRepeated}
              className='flex shrink-0 items-center'
              style={{ paddingInlineEnd: gap }}
            >
              {children}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
