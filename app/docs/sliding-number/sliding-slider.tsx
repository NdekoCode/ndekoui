'use client';
import { SlidingNumber } from '@/components/core/sliding-number';
import { useState } from 'react';

export function SlidingNumberWithSlider() {
  const [value, setValue] = useState(100);

  return (
    <div className='flex flex-col items-start gap-0'>
      <div className='text-muted-foreground flex items-center gap-2 text-[13px]'>
        Current ARR:
      </div>
      <div className='text-foreground inline-flex items-center gap-1 leading-none tabular-nums'>
        $<SlidingNumber value={value} />
      </div>
      <input
        type='range'
        aria-label='Current ARR'
        value={value}
        min={500}
        max={100000}
        step={50}
        onChange={(e) => setValue(+e.target.value)}
        className='accent-primary mt-2'
      />
    </div>
  );
}
