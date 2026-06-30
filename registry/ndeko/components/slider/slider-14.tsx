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

const STOP_LABELS = ['First stop', 'Middle stop', 'Last stop'];

function valuesOf(value: SliderValue) {
  if (typeof value === 'number') {
    return [value];
  }
  return [...value];
}

export default function Slider14() {
  const [stops, setStops] = useState([25, 50, 100]);

  function changeStops(value: SliderValue) {
    const nextStops = valuesOf(value);
    setStops(nextStops);
  }

  function renderStop(index: number) {
    return (
      <SliderThumbValue className={BUBBLE_LOOK}>
        {stops[index]}%
      </SliderThumbValue>
    );
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3 px-3'>
      <Label>Gradient stops</Label>
      <Slider
        value={stops}
        onValueChange={changeStops}
        thumbLabels={STOP_LABELS}
        thumbContent={renderStop}
      />
    </div>
  );
}
