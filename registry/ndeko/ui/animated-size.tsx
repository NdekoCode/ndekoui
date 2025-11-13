'use client';

import { motion, useReducedMotion, type Transition } from 'motion/react';
import { useLayoutEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type SizeAxis = 'height' | 'width' | 'both';

type MeasuredSize = {
  width: number;
  height: number;
};

const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

function useMeasuredSize(target: HTMLElement | null) {
  const [size, setSize] = useState<MeasuredSize | null>(null);

  useLayoutEffect(() => {
    if (!target) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0];
      setSize({ width: box.inlineSize, height: box.blockSize });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return size;
}

function targetOf(axis: SizeAxis, size: MeasuredSize | null) {
  if (!size) {
    return { height: 'auto', width: 'auto' };
  }
  if (axis === 'height') {
    return { height: size.height };
  }
  if (axis === 'width') {
    return { width: size.width };
  }
  return { height: size.height, width: size.width };
}

function transitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SIZE_SPRING;
}

type AnimatedSizeProps = React.HTMLAttributes<HTMLElement> & {
  axis?: SizeAxis;
  /** `span` keeps the markup valid inside a button or a label. */
  as?: 'div' | 'span';
  /** Classes of the measured content, for example its flex layout. */
  contentClassName?: string;
};

/** Animates its own size to the size of its content, so a container that changes content resizes smoothly. */
function AnimatedSize({
  axis = 'height',
  as = 'div',
  className,
  contentClassName,
  children,
  ...props
}: AnimatedSizeProps) {
  const [content, setContent] = useState<HTMLElement | null>(null);
  const size = useMeasuredSize(content);
  const shouldReduceMotion = useReducedMotion();
  const isWidthAnimated = axis !== 'height';
  const outerClassName = cn('-m-1 overflow-hidden', className);
  const innerClassName = cn(
    'p-1',
    isWidthAnimated && 'w-max',
    contentClassName
  );

  if (as === 'span') {
    return (
      <motion.span
        data-slot='animated-size'
        initial={false}
        animate={targetOf(axis, size)}
        transition={transitionOf(shouldReduceMotion)}
        className={cn('inline-block align-middle', outerClassName)}
      >
        <span
          ref={setContent}
          className={cn('block', innerClassName)}
          {...props}
        >
          {children}
        </span>
      </motion.span>
    );
  }

  return (
    <motion.div
      data-slot='animated-size'
      initial={false}
      animate={targetOf(axis, size)}
      transition={transitionOf(shouldReduceMotion)}
      className={outerClassName}
    >
      <div ref={setContent} className={innerClassName} {...props}>
        {children}
      </div>
    </motion.div>
  );
}

export { AnimatedSize, type SizeAxis };
