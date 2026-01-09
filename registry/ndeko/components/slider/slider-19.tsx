'use client';

import type { KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const MIN_DISTANCE = 0;
const MAX_DISTANCE = 200;
const INITIAL_DISTANCES = [50, 150];

export default function Slider19() {
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({
    minValue: MIN_DISTANCE,
    maxValue: MAX_DISTANCE,
    initialValue: INITIAL_DISTANCES,
  });

  function commitInput(index: number) {
    validateAndUpdateValue(inputValues[index], index);
  }

  function commitOnEnter(
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (event.key !== 'Enter') {
      return;
    }
    commitInput(index);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Distance in km</Label>
      <div className='flex items-center gap-4'>
        <Input
          className='w-12 shrink-0 tabular-nums'
          type='text'
          inputMode='decimal'
          value={inputValues[0]}
          onChange={(event) => handleInputChange(event, 0)}
          onBlur={() => commitInput(0)}
          onKeyDown={(event) => commitOnEnter(event, 0)}
          aria-label='Minimum distance'
        />
        <Slider
          className='grow'
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={MIN_DISTANCE}
          max={MAX_DISTANCE}
          thumbLabels={['Minimum distance', 'Maximum distance']}
        />
        <Input
          className='w-12 shrink-0 tabular-nums'
          type='text'
          inputMode='decimal'
          value={inputValues[1]}
          onChange={(event) => handleInputChange(event, 1)}
          onBlur={() => commitInput(1)}
          onKeyDown={(event) => commitOnEnter(event, 1)}
          aria-label='Maximum distance'
        />
      </div>
    </div>
  );
}
