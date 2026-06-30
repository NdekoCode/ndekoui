'use client';
import { cn } from '@/lib/utils';
import {
  motion,
  MotionConfig,
  Transition,
  useReducedMotion,
  Variants,
} from 'motion/react';
import React, { CSSProperties } from 'react';

export type SpinningTextProps = {
  children: string | readonly string[];
  style?: CSSProperties;
  duration?: number;
  className?: string;
  reverse?: boolean;
  fontSize?: number;
  radius?: number;
  transition?: Transition;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
};

const BASE_TRANSITION: Transition = {
  repeat: Infinity,
  ease: 'linear',
};

const BASE_ITEM_VARIANTS = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
  },
};

/** Text with an expression in JSX (`{count} left`) arrives as several strings. */
function textOf(children: string | readonly string[]) {
  if (typeof children === 'string') {
    return children;
  }
  return children.join('');
}

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

export function SpinningText({
  children,
  duration = 10,
  style,
  className,
  reverse = false,
  fontSize = 1,
  radius = 5,
  transition,
  variants,
}: SpinningTextProps) {
  const text = textOf(children);
  const letters = Array.from(text);
  const totalLetters = letters.length;

  const finalTransition = {
    ...BASE_TRANSITION,
    ...transition,
    duration: (transition as { duration?: number })?.duration ?? duration,
  };

  const containerVariants = {
    visible: { rotate: reverse ? -360 : 360 },
    ...variants?.container,
  };

  const itemVariants = {
    ...BASE_ITEM_VARIANTS,
    ...variants?.item,
  };

  return (
    <ReducedMotionConfig>
      <motion.div
        className={cn('relative', className)}
        style={{
          ...style,
        }}
        initial='hidden'
        animate='visible'
        variants={containerVariants}
        transition={finalTransition}
      >
        {letters.map((letter, index) => (
          <motion.span
            aria-hidden='true'
            key={`${index}-${letter}`}
            variants={itemVariants}
            className='absolute top-1/2 left-1/2 inline-block'
            style={
              {
                '--index': index,
                '--total': totalLetters,
                '--font-size': fontSize,
                '--radius': radius,
                fontSize: `calc(var(--font-size, 2) * 1rem)`,
                transform: `
                  translate(-50%, -50%)
                  rotate(calc(360deg / var(--total) * var(--index)))
                  translateY(calc(var(--radius, 5) * -1ch))
                `,
                transformOrigin: 'center',
              } as React.CSSProperties
            }
          >
            {letter}
          </motion.span>
        ))}
        <span className='sr-only'>{text}</span>
      </motion.div>
    </ReducedMotionConfig>
  );
}
