'use client';
import { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/core/animated-number';
import { StarIcon } from '@/registry/ndeko/lib/icons';

const STAR_COUNT = 2082;

export function AnimatedNumberBasic() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setValue(STAR_COUNT);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className='text-foreground flex w-full items-center justify-center'>
      <StarIcon className='text-muted-foreground mr-2 size-4' />
      <AnimatedNumber
        className='inline-flex items-center text-2xl font-medium'
        springOptions={{
          bounce: 0,
          duration: 2000,
        }}
        value={value}
      />
    </div>
  );
}
