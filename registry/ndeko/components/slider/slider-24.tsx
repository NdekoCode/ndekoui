'use client';

import { useState } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

const THUMB_LABELS = ['Lowest difficulty', 'Highest difficulty'];

const VALUE_BUBBLE = [
  'pointer-events-none absolute start-full top-1/2 ms-2.5 -translate-y-1/2 origin-left whitespace-nowrap',
  'rounded-lg px-2 py-1 text-xs font-medium tabular-nums text-popover-foreground',
  '[--bubble-top:var(--popover)] [--bubble-bottom:color-mix(in_oklab,var(--popover),var(--primary)_9%)]',
  'bg-linear-to-b from-(--bubble-top) to-(--bubble-bottom) hairline-ring ring-border shadow-md shadow-black/6',
  'scale-95 opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out-strong)',
  'group-data-dragging/thumb:scale-100 group-data-dragging/thumb:opacity-100',
  'group-has-focus-visible/thumb:scale-100 group-has-focus-visible/thumb:opacity-100',
].join(' ');

function valuesOf(value: SliderValue) {
  if (typeof value === 'number') {
    return [value];
  }
  return [...value];
}

export default function Slider24() {
  const [difficulties, setDifficulties] = useState([2, 7]);

  function changeDifficulties(value: SliderValue) {
    const nextDifficulties = valuesOf(value);
    setDifficulties(nextDifficulties);
  }

  function renderDifficulty(index: number) {
    return (
      <span className={VALUE_BUBBLE} aria-hidden='true'>
        {difficulties[index]}
      </span>
    );
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Difficulty range</Label>
      <div className='flex h-40 justify-center'>
        <Slider
          value={difficulties}
          onValueChange={changeDifficulties}
          max={10}
          orientation='vertical'
          thumbLabels={THUMB_LABELS}
          thumbContent={renderDifficulty}
        />
      </div>
    </div>
  );
}
