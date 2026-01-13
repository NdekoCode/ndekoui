'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Popover, PopoverTrigger } from '@/registry/ndeko/ui/popover';

const TOUR_STEPS = [
  {
    title: 'Your workspace',
    description:
      'This is your new workspace. Your projects, recent activity and settings all live here.',
  },
  {
    title: 'Quick actions',
    description:
      'Use the toolbar above to create a project, invite a teammate or open the settings.',
  },
  {
    title: 'Help center',
    description:
      'The support icon in the top right corner opens the help center and the documentation.',
  },
  {
    title: 'Command palette',
    description:
      'Press ⌘K to open the command palette, the arrow keys to move and Enter to run an action.',
  },
];

const DIGIT_SHIFT_PX = 8;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const TEXT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const ARROW = [
  'flex fill-popover stroke-border',
  'data-[side=bottom]:-top-[6px]',
  'data-[side=top]:-bottom-[6px] data-[side=top]:rotate-180',
  'data-[side=left]:-right-[9px] data-[side=left]:rotate-90',
  'data-[side=right]:-left-[9px] data-[side=right]:-rotate-90',
].join(' ');

type TileRef = (tile: HTMLDivElement | null) => void;

function textVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TEXT_VARIANTS;
}

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function nextLabelOf(isLastStep: boolean) {
  if (isLastStep) {
    return 'Start over';
  }
  return 'Next';
}

function tileRefOf(isCurrent: boolean, setAnchorTile: TileRef) {
  if (isCurrent) {
    return setAnchorTile;
  }
  return undefined;
}

function sideOf(stepIndex: number) {
  const isLeftColumn = stepIndex % 2 === 0;
  if (isLeftColumn) {
    return 'left';
  }
  return 'right';
}

export default function Popover09() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [anchorTile, setAnchorTile] = useState<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const textVariants = textVariantsOf(shouldReduceMotion);
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const step = TOUR_STEPS[stepIndex];
  const stepNumber = stepIndex + 1;
  const isLastStep = stepNumber === TOUR_STEPS.length;
  const nextLabel = nextLabelOf(isLastStep);

  function restartWhenOpening(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    setDirection(-1);
    setStepIndex(0);
  }

  function showNextStep() {
    if (isLastStep) {
      setDirection(-1);
      setStepIndex(0);
      return;
    }
    setDirection(1);
    setStepIndex(stepIndex + 1);
  }

  return (
    <Popover onOpenChange={restartWhenOpening}>
      <div className='flex flex-col items-center gap-4'>
        <div className='grid grid-cols-2 gap-4'>
          {TOUR_STEPS.map((tourStep, index) => {
            const isCurrent = index === stepIndex;

            return (
              <div
                key={tourStep.title}
                ref={tileRefOf(isCurrent, setAnchorTile)}
                className='bg-foreground/[0.04] text-muted-foreground flex size-10 items-center justify-center rounded-lg text-[13px] font-medium tabular-nums'
              >
                {index + 1}
              </div>
            );
          })}
        </div>
        <PopoverTrigger render={<Button variant='outline' />}>
          Start tour
        </PopoverTrigger>
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchorTile}
          side={sideOf(stepIndex)}
          sideOffset={10}
          className='z-50'
        >
          <PopoverPrimitive.Popup
            className={cn(
              'surface-raised flex w-64 flex-col gap-3 rounded-xl p-3 text-[13px] outline-none',
              POPUP_TRANSITION
            )}
          >
            <AnimatedSize contentClassName='relative flex' aria-live='polite'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.div
                  key={stepIndex}
                  className='flex flex-col gap-1'
                  variants={textVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  <PopoverPrimitive.Title className='font-medium'>
                    {step.title}
                  </PopoverPrimitive.Title>
                  <PopoverPrimitive.Description className='text-muted-foreground text-xs'>
                    {step.description}
                  </PopoverPrimitive.Description>
                </motion.div>
              </AnimatePresence>
            </AnimatedSize>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-muted-foreground flex text-xs tabular-nums'>
                <span className='relative flex overflow-hidden'>
                  <AnimatePresence
                    mode='popLayout'
                    initial={false}
                    custom={direction}
                  >
                    <motion.span
                      key={stepNumber}
                      className='flex'
                      custom={direction}
                      variants={digitVariants}
                      initial='enter'
                      animate='visible'
                      exit='exit'
                      transition={DIGIT_TRANSITION}
                    >
                      {stepNumber}
                    </motion.span>
                  </AnimatePresence>
                </span>
                /{TOUR_STEPS.length}
              </span>
              <Button
                variant='link'
                size='sm'
                onClick={showNextStep}
                className='h-auto p-0 text-xs'
              >
                <AnimatePresence mode='popLayout' initial={false}>
                  <motion.span
                    key={nextLabel}
                    className='flex'
                    variants={textVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    {nextLabel}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </div>
            <PopoverPrimitive.Arrow className={ARROW}>
              <svg width='12' height='6' viewBox='0 0 12 6' aria-hidden='true'>
                <path d='M0 6 6 0l6 6Z' stroke='none' />
                <polyline points='0,6 6,0.5 12,6' fill='none' strokeWidth='1' />
              </svg>
            </PopoverPrimitive.Arrow>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
