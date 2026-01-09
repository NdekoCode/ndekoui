'use client';

import { useState } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Slider, SliderThumbValue } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

const BUBBLE_LOOK = [
  'mb-2.5 rounded-lg bg-transparent px-2 py-1 text-popover-foreground',
  '[--bubble-top:var(--popover)] [--bubble-bottom:color-mix(in_oklab,var(--popover),var(--primary)_9%)]',
  'bg-linear-to-b from-(--bubble-top) to-(--bubble-bottom) hairline-ring ring-border shadow-md shadow-black/6',
].join(' ');

function firstValueOf(value: SliderValue) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

export default function Slider10() {
  const [strength, setStrength] = useState(50);

  function changeStrength(value: SliderValue) {
    const nextStrength = firstValueOf(value);
    setStrength(nextStrength);
  }

  function renderStrength() {
    return (
      <SliderThumbValue className={BUBBLE_LOOK}>{strength}</SliderThumbValue>
    );
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Noise reduction</Label>
      <div className='flex flex-col gap-2'>
        <span
          className='text-muted-foreground flex w-full items-center justify-between gap-2 text-xs font-medium'
          aria-hidden='true'
        >
          <span>Low</span>
          <span>High</span>
        </span>
        <Slider
          value={strength}
          onValueChange={changeStrength}
          step={10}
          thumbLabels={['Noise reduction']}
          thumbContent={renderStrength}
        />
      </div>
    </div>
  );
}
