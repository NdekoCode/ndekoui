'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  motion,
  useInView,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

export type WordRotateDirection = 'up' | 'down';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const TURN_IN: Transition = { duration: 0.5, ease: EASE_OUT_STRONG };

const TURN_OUT: Transition = {
  duration: 0.35,
  ease: EASE_OUT_STRONG,
  opacity: { duration: 0.2, ease: EASE_OUT_STRONG },
};

const FADE_IN: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const FADE_OUT: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

const FACING = 'translateY(0%) rotateX(0deg)';

const LOWER_SIDE = 'translateY(55%) rotateX(-70deg)';

const UPPER_SIDE = 'translateY(-55%) rotateX(70deg)';

const BLURRED = 'blur(4px)';

const SHARP = 'blur(0px)';

function arrivingSideOf(direction: WordRotateDirection) {
  if (direction === 'down') {
    return UPPER_SIDE;
  }
  return LOWER_SIDE;
}

function leavingSideOf(direction: WordRotateDirection) {
  if (direction === 'down') {
    return LOWER_SIDE;
  }
  return UPPER_SIDE;
}

/** The phrases sit on a drum: the next one turns in from one side while the last one turns away. */
const DRUM_VARIANTS: Variants = {
  hidden: (direction: WordRotateDirection) => ({
    transform: arrivingSideOf(direction),
    filter: BLURRED,
    opacity: 0,
  }),
  shown: {
    transform: FACING,
    filter: SHARP,
    opacity: 1,
    transition: TURN_IN,
  },
  gone: (direction: WordRotateDirection) => ({
    transform: leavingSideOf(direction),
    filter: BLURRED,
    opacity: 0,
    transition: TURN_OUT,
  }),
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: FADE_IN },
  gone: { opacity: 0, transition: FADE_OUT },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DRUM_VARIANTS;
}

function useDocumentVisible() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

function spokenTextOf(
  words: readonly string[],
  accessibleText: string | undefined
) {
  if (accessibleText !== undefined) {
    return accessibleText;
  }
  return words.join(', ');
}

export type WordRotateProps = {
  words: readonly string[];
  interval?: number;
  direction?: WordRotateDirection;
  paused?: boolean;
  pauseOnHover?: boolean;
  onIndexChange?: (index: number) => void;
  accessibleText?: string;
  className?: string;
};

export function WordRotate({
  words,
  interval = 2.5,
  direction = 'up',
  paused = false,
  pauseOnHover = true,
  onIndexChange,
  accessibleText,
  className,
}: WordRotateProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isInView = useInView(rootRef);
  const isDocumentVisible = useDocumentVisible();
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const count = words.length;
  const slotCount = Math.max(count, 1);
  const currentIndex = index % slotCount;
  const hasSeveralWords = count > 1;
  const isHeldByPointer = pauseOnHover && isHovered;
  const isOnScreen = isInView && isDocumentVisible;
  const isHeld = paused || isHeldByPointer;
  const isTurning = hasSeveralWords && isOnScreen && !isHeld;

  const turnToNext = useEffectEvent(() => {
    const following = currentIndex + 1;
    const next = following % count;
    setIndex(next);
    onIndexChange?.(next);
  });

  useEffect(() => {
    if (!isTurning) {
      return;
    }
    const intervalMs = interval * 1000;
    const timer = window.setInterval(() => {
      turnToNext();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isTurning, interval]);

  if (count === 0) {
    return null;
  }

  return (
    <span
      ref={rootRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={cn('inline-flex items-baseline', className)}
    >
      <span className='sr-only'>{spokenTextOf(words, accessibleText)}</span>
      <AnimatedSize
        as='span'
        axis='width'
        aria-hidden='true'
        contentClassName='relative [perspective:4em]'
      >
        <AnimatePresence mode='popLayout' initial={false} custom={direction}>
          <motion.span
            key={currentIndex}
            custom={direction}
            variants={variantsOf(shouldReduceMotion)}
            initial='hidden'
            animate='shown'
            exit='gone'
            className='block whitespace-nowrap'
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
    </span>
  );
}
