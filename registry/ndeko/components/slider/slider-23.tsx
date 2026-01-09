'use client';

import { useId, type KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const MIN_LEVEL = 0;
const MAX_LEVEL = 100;
const INITIAL_LEVEL = [25];

export default function Slider23() {
  const inputId = useId();
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({
    minValue: MIN_LEVEL,
    maxValue: MAX_LEVEL,
    initialValue: INITIAL_LEVEL,
  });

  function commitLevel() {
    validateAndUpdateValue(inputValues[0], 0);
  }

  function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    commitLevel();
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label htmlFor={inputId}>Tank level</Label>
      <div className='flex flex-col items-center gap-4'>
        <div className='flex h-40 justify-center'>
          <Slider
            value={sliderValue}
            onValueChange={handleSliderChange}
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            orientation='vertical'
            thumbLabels={['Tank level']}
          />
        </div>
        <Input
          id={inputId}
          className='w-12 text-center tabular-nums'
          type='text'
          inputMode='decimal'
          value={inputValues[0]}
          onChange={(event) => handleInputChange(event, 0)}
          onBlur={commitLevel}
          onKeyDown={commitOnEnter}
        />
      </div>
    </div>
  );
}
