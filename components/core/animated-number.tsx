'use client';
import { cn } from '@/lib/utils';
import {
  motion,
  SpringOptions,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { motionElementOf } from './motion-elements';
import { useEffect } from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
  as?: React.ElementType;
};

export function AnimatedNumber({
  value,
  className,
  springOptions,
  as = 'span',
}: AnimatedNumberProps) {
  const MotionComponent = motionElementOf(as) as typeof motion.span;
  const prefersReducedMotion = useReducedMotion();

  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      spring.jump(value);
      return;
    }
    spring.set(value);
  }, [spring, value, prefersReducedMotion]);

  return (
    <MotionComponent className={cn('tabular-nums', className)}>
      {display}
    </MotionComponent>
  );
}
