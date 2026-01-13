'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

const TIPS = [
  {
    title: 'Welcome to your dashboard',
    description:
      'This is your new workspace. Your projects, recent activity and settings all live here.',
  },
  {
    title: 'Quick actions',
    description:
      'Use the toolbar above to create a project, invite a teammate or open the settings.',
  },
  {
    title: 'Need help?',
    description:
      'The support icon in the top right corner opens the help center and the documentation.',
  },
  {
    title: 'Keyboard shortcuts',
    description:
      'Press ⌘K to open the command palette, the arrow keys to move and Enter to run an action.',
  },
  {
    title: 'Stay updated',
    description:
      'Turn on notifications to hear about your projects, your team and the deadlines that matter.',
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

export default function Popover06() {
  const [tipIndex, setTipIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const textVariants = textVariantsOf(shouldReduceMotion);
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const tip = TIPS[tipIndex];
  const tipNumber = tipIndex + 1;
  const isFirstTip = tipIndex === 0;
  const isLastTip = tipNumber === TIPS.length;

  function showPreviousTip() {
    if (isFirstTip) {
      return;
    }
    setDirection(-1);
    setTipIndex(tipIndex - 1);
  }

  function showNextTip() {
    if (isLastTip) {
      return;
    }
    setDirection(1);
    setTipIndex(tipIndex + 1);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        Quick tour
      </PopoverTrigger>
      <PopoverContent side='top' className='flex w-64 flex-col gap-3 p-3'>
        <AnimatedSize contentClassName='relative flex' aria-live='polite'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={tipIndex}
              className='flex flex-col gap-1'
              variants={textVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <p className='font-medium'>{tip.title}</p>
              <p className='text-muted-foreground text-xs'>{tip.description}</p>
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
                  key={tipNumber}
                  className='flex'
                  custom={direction}
                  variants={digitVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={DIGIT_TRANSITION}
                >
                  {tipNumber}
                </motion.span>
              </AnimatePresence>
            </span>
            /{TIPS.length}
          </span>
          <div className='flex gap-0.5'>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={showPreviousTip}
              disabled={isFirstTip}
              focusableWhenDisabled
              aria-label='Previous tip'
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={showNextTip}
              disabled={isLastTip}
              focusableWhenDisabled
              aria-label='Next tip'
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
