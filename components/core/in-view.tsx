'use client';
import { ReactNode, useRef, useState } from 'react';
import {
  MotionConfig,
  useInView,
  useReducedMotion,
  Variant,
  Transition,
  UseInViewOptions,
} from 'motion/react';
import { motionElementOf } from './motion-elements';

export type InViewProps = {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean;
};

const defaultVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function ReducedMotionConfig({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = 'div',
  once,
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);

  const [isViewed, setIsViewed] = useState(false);

  const MotionComponent = motionElementOf(as) as typeof as;

  return (
    <ReducedMotionConfig>
      <MotionComponent
        ref={ref}
        initial='hidden'
        onAnimationComplete={() => {
          if (once) setIsViewed(true);
        }}
        animate={isInView || isViewed ? 'visible' : 'hidden'}

        variants={variants}
        transition={transition}
      >
        {children}
      </MotionComponent>
    </ReducedMotionConfig>
  );
}
