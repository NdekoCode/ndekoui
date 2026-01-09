'use client';

import { useId, type KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const PRICES = [
  80, 95, 110, 125, 130, 140, 145, 150, 155, 165, 175, 185, 195, 205, 215, 225,
  235, 245, 255, 260, 265, 270, 275, 280, 285, 290, 290, 295, 295, 295, 298,
  299, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365,
  365, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440,
  445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495, 495, 498, 499, 500,
  500, 500, 515, 530, 545, 560, 575, 590, 605, 620, 635, 650, 655, 660, 665,
  670, 675, 680, 685, 690, 695, 700, 700, 700, 700, 700, 700, 725, 750, 775,
  800, 815, 830, 845, 845, 845, 870, 875, 880, 885, 890, 895, 898, 900,
];

const BAR_COUNT = 40;
const MIN_PRICE = Math.min(...PRICES);
const MAX_PRICE = Math.max(...PRICES);
const BAR_WIDTH = (MAX_PRICE - MIN_PRICE) / BAR_COUNT;
const INITIAL_PRICES = [200, 780];

type Bar = {
  start: number;
  end: number;
  count: number;
};

function countPricesBetween(min: number, max: number) {
  const pricesInRange = PRICES.filter((price) => {
    const isAboveMin = price >= min;
    const isBelowMax = price <= max;
    return isAboveMin && isBelowMax;
  });
  return pricesInRange.length;
}

function barAt(index: number): Bar {
  const start = MIN_PRICE + index * BAR_WIDTH;
  const end = start + BAR_WIDTH;
  const pricesInBar = PRICES.filter((price) => {
    const isFromStart = price >= start;
    const isBeforeEnd = price < end;
    return isFromStart && isBeforeEnd;
  });
  return { start, end, count: pricesInBar.length };
}

const BARS = Array.from({ length: BAR_COUNT }, (_, index) => barAt(index));
const BAR_COUNTS = BARS.map((bar) => bar.count);
const TALLEST_BAR = Math.max(...BAR_COUNTS);

function barHeightOf(bar: Bar) {
  const ratio = bar.count / TALLEST_BAR;
  const percent = ratio * 100;
  return `${percent}%`;
}

function isBarSelected(bar: Bar, range: readonly number[], matches: number) {
  const [lowest, highest] = range;
  const hasMatches = matches > 0;
  const startsBeforeHighest = bar.start <= highest;
  const endsAfterLowest = bar.end >= lowest;
  return hasMatches && startsBeforeHighest && endsAfterLowest;
}

function showLabelOf(matches: number) {
  if (matches === 0) {
    return 'No items in this range';
  }
  if (matches === 1) {
    return 'Show 1 item';
  }
  return `Show ${matches} items`;
}

export default function Slider26() {
  const id = useId();
  const minId = `${id}-min`;
  const maxId = `${id}-max`;
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({
    minValue: MIN_PRICE,
    maxValue: MAX_PRICE,
    initialValue: INITIAL_PRICES,
  });
  const [lowest, highest] = sliderValue;
  const matches = countPricesBetween(lowest, highest);
  const hasMatches = matches > 0;

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
    <div className='flex w-full max-w-xs flex-col gap-4'>
      <Label>Price</Label>
      <div className='flex flex-col'>
        <div className='flex h-12 w-full items-end' aria-hidden='true'>
          {BARS.map((bar) => {
            const isSelected = isBarSelected(bar, sliderValue, matches);
            return (
              <div
                key={bar.start}
                className='flex flex-1 justify-center'
                style={{ height: barHeightOf(bar) }}
              >
                <span
                  className={cn(
                    'bg-foreground/10 size-full transition-colors duration-150',
                    isSelected && 'bg-primary/40'
                  )}
                />
              </div>
            );
          })}
        </div>
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={MIN_PRICE}
          max={MAX_PRICE}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor={minId}>Min price</Label>
          <div className='relative'>
            <Input
              id={minId}
              className='peer ps-6 tabular-nums'
              type='text'
              inputMode='decimal'
              value={inputValues[0]}
              onChange={(event) => handleInputChange(event, 0)}
              onBlur={() => commitInput(0)}
              onKeyDown={(event) => commitOnEnter(event, 0)}
            />
            <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-[13px] peer-disabled:opacity-50'>
              $
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor={maxId}>Max price</Label>
          <div className='relative'>
            <Input
              id={maxId}
              className='peer ps-6 tabular-nums'
              type='text'
              inputMode='decimal'
              value={inputValues[1]}
              onChange={(event) => handleInputChange(event, 1)}
              onBlur={() => commitInput(1)}
              onKeyDown={(event) => commitOnEnter(event, 1)}
            />
            <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-[13px] peer-disabled:opacity-50'>
              $
            </span>
          </div>
        </div>
      </div>
      <Button variant='outline' className='w-full' disabled={!hasMatches}>
        {showLabelOf(matches)}
      </Button>
    </div>
  );
}
