'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  motion,
  SpringOptions,
  useMotionValue,
  useSpring,
  AnimatePresence,
  Transition,
  Variant,
  MotionConfig,
  MotionValue,
  useReducedMotion,
} from 'motion/react';
import { cn } from '@/lib/utils';

export type CursorProps = {
  children: React.ReactNode;
  className?: string;
  springConfig?: SpringOptions;
  attachToParent?: boolean;
  transition?: Transition;
  variants?: {
    initial: Variant;
    animate: Variant;
    exit: Variant;
  };
  onPositionChange?: (x: number, y: number) => void;
};

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function followerOf(
  prefersReducedMotion: boolean | null,
  pointer: MotionValue<number>,
  spring: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return pointer;
  }
  return spring;
}

export function Cursor({
  children,
  className,
  springConfig,
  attachToParent,
  variants,
  transition,
  onPositionChange,
}: CursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!attachToParent);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      cursorX.set(window.innerWidth / 2);
      cursorY.set(window.innerHeight / 2);
    }
  }, [cursorX, cursorY]);

  useEffect(() => {
    if (!attachToParent) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'auto';
    }

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      onPositionChange?.(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', updatePosition);

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      if (!attachToParent) {
        document.body.style.cursor = 'auto';
      }
    };
  }, [cursorX, cursorY, onPositionChange, attachToParent]);

  const cursorXSpring = useSpring(cursorX, springConfig || { duration: 0 });
  const cursorYSpring = useSpring(cursorY, springConfig || { duration: 0 });
  const followerX = followerOf(prefersReducedMotion, cursorX, cursorXSpring);
  const followerY = followerOf(prefersReducedMotion, cursorY, cursorYSpring);

  useEffect(() => {
    const parent = cursorRef.current?.parentElement;
    const shouldTrackParent = attachToParent && parent;
    if (!shouldTrackParent) {
      return;
    }

    const handleMouseEnter = () => {
      parent.style.cursor = 'none';
      setIsVisible(true);
    };
    const handleMouseLeave = () => {
      parent.style.cursor = 'auto';
      setIsVisible(false);
    };

    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [attachToParent]);

  return (
    <ReducedMotionConfig>
      <motion.div
        ref={cursorRef}
        className={cn('pointer-events-none fixed top-0 left-0 z-50', className)}
        style={{
          x: followerX,
          y: followerY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial='initial'
              animate='animate'
              exit='exit'
              variants={variants}
              transition={transition}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ReducedMotionConfig>
  );
}
