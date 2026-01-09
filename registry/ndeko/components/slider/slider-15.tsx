'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, type KeyboardEvent } from 'react';

import { useSliderWithInput } from '@/registry/ndeko/hooks/use-slider-with-input';
import { RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 2;
const INITIAL_TEMPERATURE = [1.25];
const DEFAULT_TEMPERATURE = [1];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const RESET_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function resetVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return RESET_VARIANTS;
}

export default function Slider15() {
  const inputId = useId();
  const shouldReduceMotion = useReducedMotion();
  const resetVariants = resetVariantsOf(shouldReduceMotion);
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    showReset,
  } = useSliderWithInput({
    minValue: MIN_TEMPERATURE,
    maxValue: MAX_TEMPERATURE,
    initialValue: INITIAL_TEMPERATURE,
    defaultValue: DEFAULT_TEMPERATURE,
  });

  function commitTemperature() {
    validateAndUpdateValue(inputValues[0], 0);
  }

  function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    commitTemperature();
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <Label htmlFor={inputId}>Temperature</Label>
        <div className='flex items-center gap-1'>
          <span className='flex size-7'>
            <AnimatePresence initial={false}>
              {showReset && (
                <motion.span
                  key='reset'
                  className='flex'
                  variants={resetVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label='Reset to default'
                          onClick={resetToDefault}
                        />
                      }
                    >
                      <RotateCcwIcon />
                    </TooltipTrigger>
                    <TooltipContent>Reset to default</TooltipContent>
                  </Tooltip>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <Input
            id={inputId}
            size='sm'
            className='w-12 tabular-nums'
            type='text'
            inputMode='decimal'
            value={inputValues[0]}
            onChange={(event) => handleInputChange(event, 0)}
            onBlur={commitTemperature}
            onKeyDown={commitOnEnter}
          />
        </div>
      </div>
      <Slider
        value={sliderValue}
        onValueChange={handleSliderChange}
        min={MIN_TEMPERATURE}
        max={MAX_TEMPERATURE}
        step={0.01}
        thumbLabels={['Temperature']}
      />
    </div>
  );
}
