'use client';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Cursor } from '@/components/core/cursor';
import { ImageIcon, PlusIcon } from '@/registry/ndeko/lib/icons';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

const INSTANT = { duration: 0 };

function pillTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return undefined;
}

function pillSizeOf(isHovering: boolean) {
  if (isHovering) {
    return { width: 80, height: 32 };
  }
  return { width: 16, height: 16 };
}

function labelMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.6 },
  };
}

function isPointInside(rect: DOMRect, x: number, y: number) {
  const isWithinX = x >= rect.left && x <= rect.right;
  const isWithinY = y >= rect.top && y <= rect.bottom;
  return isWithinX && isWithinY;
}

export function Cursor1() {
  const [isHovering, setIsHovering] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const pillSize = pillSizeOf(isHovering);
  const labelMotion = labelMotionOf(shouldReduceMotion);
  const pillTransition = pillTransitionOf(shouldReduceMotion);

  const handlePositionChange = (x: number, y: number) => {
    if (!targetRef.current) {
      return;
    }
    const rect = targetRef.current.getBoundingClientRect();
    setIsHovering(isPointInside(rect, x, y));
  };

  return (
    <div className='flex h-[400px] w-full items-center justify-center'>
      <Cursor
        attachToParent
        variants={{
          initial: { scale: 0.3, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.3, opacity: 0 },
        }}
        springConfig={{
          bounce: 0.001,
        }}
        transition={{
          ease: EASE_OUT_STRONG,
          duration: 0.15,
        }}
        onPositionChange={handlePositionChange}
      >
        <motion.div
          animate={pillSize}
          transition={pillTransition}
          className='bg-foreground/70 flex items-center justify-center rounded-full backdrop-blur-md'
        >
          <AnimatePresence>
            {isHovering && (
              <motion.div
                initial={labelMotion.initial}
                animate={labelMotion.animate}
                exit={labelMotion.exit}
                className='inline-flex w-full items-center justify-center'
              >
                <div className='text-background inline-flex items-center text-[13px] font-medium'>
                  More <PlusIcon className='ml-1 size-4' />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Cursor>
      <div ref={targetRef}>
        <div className='bg-primary/10 flex h-52 w-48 flex-col justify-between rounded-xl p-4'>
          <span className='gem-plate grid size-9 place-items-center rounded-lg [--gem:var(--primary)]'>
            <ImageIcon className='size-4' />
          </span>
          <span className='flex flex-col'>
            <span className='text-foreground text-sm font-medium'>
              Riverside market
            </span>
            <span className='text-muted-foreground text-xs'>
              Poster series, 2025
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
