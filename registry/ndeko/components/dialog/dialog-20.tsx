'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ArrowRightIcon,
  FolderIcon,
  type Icon,
  LayoutGridIcon,
  LifeBuoyIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';

type OnboardingStep = {
  title: string;
  description: string;
  Icon: Icon;
  hue: string;
};

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to your workspace',
    description:
      'Projects, tasks and docs live side by side here. This tour takes less than a minute.',
    Icon: LayoutGridIcon,
    hue: 'var(--primary)',
  },
  {
    title: 'Plan with projects',
    description:
      'Group tasks into projects, give them a due date and see what is late before anyone asks.',
    Icon: FolderIcon,
    hue: 'var(--info)',
  },
  {
    title: 'Invite your team',
    description:
      'Teammates join with a link and only see the projects you share with them.',
    Icon: UsersIcon,
    hue: 'var(--success)',
  },
  {
    title: 'Get help at any time',
    description:
      'Press the question mark key anywhere to see the shortcuts, or write to support from the help menu.',
    Icon: LifeBuoyIcon,
    hue: 'var(--warning)',
  },
];

const LAST_STEP_INDEX = STEPS.length - 1;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const TRAVEL_TRANSITION: Transition = {
  duration: 0.25,
  ease: [0.77, 0, 0.175, 1],
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const GLYPH_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const TEXT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function glyphVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return GLYPH_VARIANTS;
}

function textVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TEXT_VARIANTS;
}

function travelTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return TRAVEL_TRANSITION;
}

export default function Dialog20() {
  const indicatorId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const glyphVariants = glyphVariantsOf(shouldReduceMotion);
  const textVariants = textVariantsOf(shouldReduceMotion);
  const travelTransition = travelTransitionOf(shouldReduceMotion);
  const step = STEPS[stepIndex];
  const stepNumber = stepIndex + 1;
  const isLastStep = stepIndex === LAST_STEP_INDEX;
  const glyphStyle = { '--gem': step.hue } as React.CSSProperties;

  function restartOnOpen(open: boolean) {
    if (open) {
      setStepIndex(0);
    }
  }

  function goToNextStep() {
    setStepIndex((current) => {
      const next = current + 1;
      return Math.min(next, LAST_STEP_INDEX);
    });
  }

  return (
    <Dialog onOpenChange={restartOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Start the tour
      </DialogTrigger>
      <DialogContent className='p-1' contentClassName='gap-0'>
        <div className='bg-foreground/[0.03] hairline-ring ring-border flex h-44 items-center justify-center rounded-lg'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={step.title}
              aria-hidden='true'
              style={glyphStyle}
              className='gem-plate flex size-14 items-center justify-center rounded-2xl'
              variants={glyphVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <step.Icon className='size-7' />
            </motion.span>
          </AnimatePresence>
        </div>
        <div className='flex flex-col gap-6 px-4 pt-3 pb-4'>
          <DialogHeader className='pr-0'>
            <DialogTitle className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={step.title}
                  className='block'
                  variants={textVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {step.title}
                </motion.span>
              </AnimatePresence>
            </DialogTitle>
            <DialogDescription className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={step.title}
                  className='block'
                  variants={textVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {step.description}
                </motion.span>
              </AnimatePresence>
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex justify-center gap-1.5 max-sm:order-1'>
              {STEPS.map((item, index) => (
                <span
                  key={item.title}
                  aria-hidden='true'
                  className='bg-foreground/15 relative size-1.5 rounded-full'
                >
                  {index === stepIndex && (
                    <motion.span
                      layoutId={indicatorId}
                      className='bg-primary absolute inset-0 rounded-full'
                      transition={travelTransition}
                    />
                  )}
                </span>
              ))}
              <span className='sr-only' aria-live='polite'>
                Step {stepNumber} of {STEPS.length}
              </span>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant='outline' size='lg' />}>
                Skip tour
              </DialogClose>
              {isLastStep && (
                <DialogClose render={<Button size='lg' />}>
                  Get started
                </DialogClose>
              )}
              {!isLastStep && (
                <Button size='lg' className='group' onClick={goToNextStep}>
                  Next
                  <ArrowRightIcon className='-me-1 opacity-60 transition-transform group-hover:translate-x-0.5' />
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
