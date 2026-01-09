'use client';

import { useId, useState, type KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type Axis = {
  name: string;
  initialOffset: number;
};

const AXES: Axis[] = [
  { name: 'X', initialOffset: -2 },
  { name: 'Y', initialOffset: 4 },
  { name: 'Z', initialOffset: 2 },
];

const MIN_OFFSET = -10;
const MAX_OFFSET = 10;
const DEFAULT_OFFSET = [0];

function startOffsetOf(axis: Axis, hasBeenReset: boolean) {
  if (hasBeenReset) {
    return DEFAULT_OFFSET;
  }
  return [axis.initialOffset];
}

type AxisSliderProps = {
  name: string;
  startOffset: number[];
};

function AxisSlider({ name, startOffset }: AxisSliderProps) {
  const inputId = useId();
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({
    minValue: MIN_OFFSET,
    maxValue: MAX_OFFSET,
    initialValue: startOffset,
    defaultValue: DEFAULT_OFFSET,
  });

  function commitOffset() {
    validateAndUpdateValue(inputValues[0], 0);
  }

  function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    commitOffset();
  }

  return (
    <div className='flex items-center gap-3'>
      <Label htmlFor={inputId} className='text-muted-foreground w-3 text-xs'>
        {name}
      </Label>
      <Slider
        className='grow **:data-index:rounded-[5px]'
        value={sliderValue}
        onValueChange={handleSliderChange}
        min={MIN_OFFSET}
        max={MAX_OFFSET}
        thumbLabels={[`${name} position`]}
      />
      <Input
        id={inputId}
        className='w-12 shrink-0 tabular-nums'
        type='text'
        inputMode='decimal'
        value={inputValues[0]}
        onChange={(event) => handleInputChange(event, 0)}
        onBlur={commitOffset}
        onKeyDown={commitOnEnter}
      />
    </div>
  );
}

export default function Slider25() {
  const [resetCount, setResetCount] = useState(0);
  const hasBeenReset = resetCount > 0;

  function resetPosition() {
    setResetCount((count) => count + 1);
  }

  return (
    <fieldset className='flex w-full max-w-xs flex-col gap-4'>
      <legend className='mb-4 text-[13px] font-medium'>Object position</legend>
      <div className='flex flex-col gap-2'>
        {AXES.map((axis) => (
          <AxisSlider
            key={`${axis.name}-${resetCount}`}
            name={axis.name}
            startOffset={startOffsetOf(axis, hasBeenReset)}
          />
        ))}
      </div>
      <Button variant='outline' className='w-full' onClick={resetPosition}>
        <RotateCcwIcon className='-ms-1 opacity-60' />
        Reset position
      </Button>
    </fieldset>
  );
}
