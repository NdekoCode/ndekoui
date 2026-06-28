'use client';
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  Children,
  createContext,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';

const DEEPEST_SCALE = 0.9;
const MAX_SCALE_STEP = 0.04;
const DIM_STEP = 0.12;
const MAX_DIM = 0.48;

type StackingCardsContextValue = {
  progress: MotionValue<number>;
  count: number;
  peek: number;
  frameClassName?: string;
};

const StackingCardsContext = createContext<StackingCardsContextValue | null>(
  null
);
const StackingCardIndexContext = createContext(0);

function useStackingCards() {
  const context = useContext(StackingCardsContext);
  if (!context) {
    throw new Error('StackingCard must be used inside StackingCards');
  }
  return context;
}

function scaleStepOf(count: number) {
  if (count < 2) {
    return 0;
  }
  const scaleRange = 1 - DEEPEST_SCALE;
  const gaps = count - 1;
  const evenStep = scaleRange / gaps;
  return Math.min(MAX_SCALE_STEP, evenStep);
}

function rangeStartOf(index: number, lastIndex: number) {
  if (lastIndex === 0) {
    return 0;
  }
  return index / lastIndex;
}

function scaleOf(
  prefersReducedMotion: boolean | null,
  scale: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return 1;
  }
  return scale;
}

function dimOf(prefersReducedMotion: boolean | null, dim: MotionValue<number>) {
  if (prefersReducedMotion) {
    return 0;
  }
  return dim;
}

export type StackingCardsProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
  containerRef?: RefObject<HTMLElement | null>;
  peek?: number;
};

export function StackingCards({
  children,
  className,
  frameClassName,
  containerRef,
  peek = 16,
}: StackingCardsProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const cards = Children.toArray(children);
  const count = cards.length;

  const { scrollYProgress } = useScroll({
    target: stackRef,
    container: containerRef,
    offset: ['start start', 'end end'],
  });

  const value = { progress: scrollYProgress, count, peek, frameClassName };

  return (
    <StackingCardsContext value={value}>
      <div ref={stackRef} className={cn('relative', className)}>
        {cards.map((card, index) => (
          <StackingCardIndexContext key={index} value={index}>
            {card}
          </StackingCardIndexContext>
        ))}
      </div>
    </StackingCardsContext>
  );
}

export type StackingCardProps = {
  children: ReactNode;
  className?: string;
};

export function StackingCard({ children, className }: StackingCardProps) {
  const { progress, count, peek, frameClassName } = useStackingCards();
  const index = useContext(StackingCardIndexContext);
  const prefersReducedMotion = useReducedMotion();

  const lastIndex = count - 1;
  const depth = lastIndex - index;
  const scaleStep = scaleStepOf(count);
  const targetScale = 1 - depth * scaleStep;
  const depthDim = depth * DIM_STEP;
  const targetDim = Math.min(MAX_DIM, depthDim);
  const rangeStart = rangeStartOf(index, lastIndex);
  const stackOffset = index * peek;

  const scale = useTransform(progress, [rangeStart, 1], [1, targetScale]);
  const dim = useTransform(progress, [rangeStart, 1], [0, targetDim]);
  const cardScale = scaleOf(prefersReducedMotion, scale);
  const cardDim = dimOf(prefersReducedMotion, dim);
  const offsetStyle = {
    '--stack-offset': `${stackOffset}px`,
  } as CSSProperties;

  return (
    <div
      style={offsetStyle}
      className={cn(
        'sticky top-0 flex h-svh items-center justify-center',
        'motion-reduce:static motion-reduce:h-auto motion-reduce:py-2',
        frameClassName
      )}
    >
      <motion.div
        style={{ scale: cardScale }}
        className={cn(
          'relative top-(--stack-offset) w-full origin-top overflow-clip motion-reduce:top-0',
          className
        )}
      >
        {children}
        <motion.div
          aria-hidden='true'
          style={{ opacity: cardDim }}
          className='bg-background pointer-events-none absolute inset-0'
        />
      </motion.div>
    </div>
  );
}
