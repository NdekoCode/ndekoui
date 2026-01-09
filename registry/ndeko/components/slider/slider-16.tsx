'use client';

import { useId, type KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const MIN_COMPRESSION = 0;
const MAX_COMPRESSION = 100;
const INITIAL_COMPRESSION = [25];

export default function Slider16() {
  const inputId = useId();
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({
    minValue: MIN_COMPRESSION,
    maxValue: MAX_COMPRESSION,
    initialValue: INITIAL_COMPRESSION,
  });

  function commitCompression() {
    validateAndUpdateValue(inputValues[0], 0);
  }

  function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    commitCompression();
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label htmlFor={inputId}>Compression</Label>
      <div className='flex items-center gap-4'>
        <Slider
          className='grow'
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={MIN_COMPRESSION}
          max={MAX_COMPRESSION}
          thumbLabels={['Compression']}
        />
        <Input
          id={inputId}
          className='w-12 shrink-0 tabular-nums'
          type='text'
          inputMode='decimal'
          value={inputValues[0]}
          onChange={(event) => handleInputChange(event, 0)}
          onBlur={commitCompression}
          onKeyDown={commitOnEnter}
        />
      </div>
    </div>
  );
}
