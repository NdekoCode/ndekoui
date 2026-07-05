'use client';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  motion,
  AnimatePresence,
  Transition,
  Variants,
  AnimatePresenceProps,
  MotionConfig,
} from 'motion/react';
import { useState, useEffect, useRef, Children } from 'react';

export type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  onIndexChange?: (index: number) => void;
  trigger?: boolean;
  mode?: AnimatePresenceProps['mode'];
};

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

export function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
  onIndexChange,
  trigger = true,
  mode = 'popLayout',
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const latestIndex = useRef(0);
  const items = Children.toArray(children);

  useEffect(() => {
    if (!trigger) return;

    const intervalMs = interval * 1000;
    // The parent is told from the timer, never from inside a state update: a parent that sets its own state there would be updated while this component renders.
    const timer = setInterval(() => {
      const next = (latestIndex.current + 1) % items.length;
      latestIndex.current = next;
      setCurrentIndex(next);
      onIndexChange?.(next);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, trigger]);

  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  return (
    <ReducedMotionConfig>
      <span
        className={cn('relative inline-block whitespace-nowrap', className)}
      >
        <AnimatePresence mode={mode} initial={false}>
          <motion.span
            key={currentIndex}
            className='inline-block'
            initial='initial'
            animate='animate'
            exit='exit'
            transition={transition}
            variants={variants || motionVariants}
          >
            {items[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
    </ReducedMotionConfig>
  );
}
