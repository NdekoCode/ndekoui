'use client';

import { NumberField } from '@base-ui/react/number-field';
import { AnimatePresence, motion } from 'motion/react';
import type { CSSProperties } from 'react';

import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Slider, SliderThumbValue } from '@/registry/ndeko/ui/slider';

import type { Range } from './data';
import { formatCount, type Tick } from './pricing-model';

/** Below this share of the track between two ticks their names would touch: the marks stay, the names go. */
const MIN_NAME_GAP = 0.16;

/** Two names written towards each other need the room of both. */
const MIN_FACING_GAP = 0.34;

/** A tick past this share of the track writes its name on its left, so the name never leaves the block. */
const NAME_ON_LEFT_FROM = 0.78;

const TICK_PRESENCE = fadePresence();

/** Seats and hours are whole: a typed 12.5 rounds to 13 instead of reaching the estimate. */
const WHOLE_NUMBERS: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

function amountOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function shareOf(value: number, range: Range) {
  const span = range.max - range.min;
  const offset = value - range.min;
  return offset / span;
}

/** The anchor has no width and moves by a share of the row, so it glides with a transform and never widens the page. */
function anchorStyleOf(share: number): CSSProperties {
  const percent = share * 100;
  return { transform: `translateX(${percent}cqw)` };
}

function isNameOnLeft(share: number) {
  return share >= NAME_ON_LEFT_FROM;
}

function nameSideOf(share: number) {
  if (isNameOnLeft(share)) {
    return 'end-1.5';
  }
  return 'start-1.5';
}

/** True when two neighbouring ticks have room for both names, wherever each name is written. */
function isClearBetween(
  first: Tick | undefined,
  second: Tick | undefined,
  range: Range
) {
  if (!first || !second) {
    return true;
  }
  const firstShare = shareOf(first.value, range);
  const secondShare = shareOf(second.value, range);
  const gap = secondShare - firstShare;
  const isFirstOnRight = !isNameOnLeft(firstShare);
  const isSecondOnLeft = isNameOnLeft(secondShare);
  const isFacing = isFirstOnRight && isSecondOnLeft;
  if (isFacing) {
    return gap >= MIN_FACING_GAP;
  }
  return gap >= MIN_NAME_GAP;
}

function hasRoomForName(ticks: readonly Tick[], index: number, range: Range) {
  const tick = ticks[index];
  const isClearBefore = isClearBetween(ticks[index - 1], tick, range);
  const isClearAfter = isClearBetween(tick, ticks[index + 1], range);
  return isClearBefore && isClearAfter;
}

type TickRowProps = {
  ticks: readonly Tick[];
  range: Range;
};

/** Marks under the track where the plan that fits changes, named with the plan they lead to. */
function TickRow({ ticks, range }: TickRowProps) {
  return (
    <div aria-hidden='true' className='@container relative -mt-1 h-6'>
      <AnimatePresence initial={false}>
        {ticks.map((tick, index) => {
          const share = shareOf(tick.value, range);
          const showsName = hasRoomForName(ticks, index, range);
          return (
            <span
              key={tick.key}
              style={anchorStyleOf(share)}
              className='absolute top-0 left-0 w-0 transition-transform duration-300 ease-(--ease-out-strong)'
            >
              <motion.span {...TICK_PRESENCE} className='absolute top-0 left-0'>
                <span className='bg-foreground/30 absolute top-0 left-0 h-2 w-px -translate-x-1/2' />
                {showsName && (
                  <span
                    className={cn(
                      'text-muted-foreground absolute top-2 text-xs whitespace-nowrap',
                      nameSideOf(share)
                    )}
                  >
                    {tick.plan.name}
                  </span>
                )}
              </motion.span>
            </span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

type MeterSliderProps = {
  /** The id of the typed field, so its label names it. */
  id: string;
  label: string;
  /** What the typed number counts, written after the field. */
  unit: string;
  range: Range;
  value: number;
  ticks: readonly Tick[];
  /** What the thumb says to a screen reader, for example "14 seats, Team fits". */
  valueTextOf: (value: number) => string;
  onValueChange: (value: number) => void;
};

/** One number set three ways: dragged or keyed on the slider, or typed in the field beside its label. */
export function MeterSlider({
  id,
  label,
  unit,
  range,
  value,
  ticks,
  valueTextOf,
  onValueChange,
}: MeterSliderProps) {
  const bubble = formatCount(value);

  function changeFromSlider(next: number | readonly number[]) {
    const amount = amountOf(next);
    onValueChange(amount);
  }

  function changeFromField(next: number | null) {
    if (next === null) {
      return;
    }
    onValueChange(next);
  }

  function spokenValueOf(_formatted: string, next: number) {
    return valueTextOf(next);
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center justify-between gap-3'>
        <label htmlFor={id} className='text-[13px] font-medium text-pretty'>
          {label}
        </label>
        <NumberField.Root
          id={id}
          value={value}
          min={range.min}
          max={range.max}
          step={range.step}
          locale='en-US'
          format={WHOLE_NUMBERS}
          onValueChange={changeFromField}
          className='flex shrink-0 items-center gap-2'
        >
          <NumberField.Input
            className={cn(
              CONTROL_RECIPE,
              'h-8 w-16 px-2.5 text-end tabular-nums'
            )}
          />
          <span className='text-muted-foreground w-10 text-xs'>{unit}</span>
        </NumberField.Root>
      </div>
      <Slider
        value={value}
        min={range.min}
        max={range.max}
        step={range.step}
        thumbLabels={[label]}
        getAriaValueText={spokenValueOf}
        thumbContent={() => <SliderThumbValue>{bubble}</SliderThumbValue>}
        onValueChange={changeFromSlider}
      />
      <TickRow ticks={ticks} range={range} />
    </div>
  );
}
