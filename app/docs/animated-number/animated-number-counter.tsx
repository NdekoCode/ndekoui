'use client';
import { useState } from 'react';
import { AnimatedNumber } from '@/components/core/animated-number';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const STEP = 100;

export function AnimatedNumberCounter() {
  const [value, setValue] = useState(1000);

  return (
    <div className='text-foreground flex w-full items-center justify-center space-x-3'>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label='Decrease by 100'
        onClick={() => setValue((prev) => prev - STEP)}
      >
        <MinusIcon />
      </Button>
      <AnimatedNumber
        className='inline-flex min-w-[5ch] items-center justify-center text-2xl font-medium'
        springOptions={{
          bounce: 0,
          duration: 1000,
        }}
        value={value}
      />
      <Button
        variant='outline'
        size='icon-sm'
        aria-label='Increase by 100'
        onClick={() => setValue((prev) => prev + STEP)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
