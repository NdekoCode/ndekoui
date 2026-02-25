'use client';
import { AnimatedNumber } from '@/components/core/animated-number';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';

const TARGET_VALUE = 10000;

export function AnimatedNumberInView() {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref);
  const hasNotStarted = value === 0;
  const shouldStart = isInView && hasNotStarted;

  if (shouldStart) {
    setValue(TARGET_VALUE);
  }

  return (
    <div className='flex w-full items-center justify-center' ref={ref}>
      <AnimatedNumber
        className='text-foreground inline-flex items-center text-2xl font-medium'
        springOptions={{
          bounce: 0,
          duration: 10000,
        }}
        value={value}
      />
    </div>
  );
}
