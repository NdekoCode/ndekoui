'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

const PRICE_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const COUNT_TRANSITION: Transition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
};

const SLIDE_DISTANCE = 8;

const COUNT_VARIANTS: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction * SLIDE_DISTANCE,
  }),
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction * -SLIDE_DISTANCE,
  }),
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function countVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return COUNT_VARIANTS;
}

export function formatPrice(amount: number) {
  return PRICE_FORMAT.format(amount);
}

type PlanPriceProps = {
  amount: number;
  direction: number;
};

export function PlanPrice({ amount, direction }: PlanPriceProps) {
  const shouldReduceMotion = useReducedMotion();
  const countVariants = countVariantsOf(shouldReduceMotion);
  const label = formatPrice(amount);

  return (
    <p className='flex items-baseline gap-1.5'>
      <span className='relative inline-flex text-4xl font-semibold tabular-nums'>
        <AnimatePresence mode='popLayout' initial={false} custom={direction}>
          <motion.span
            key={amount}
            custom={direction}
            variants={countVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={COUNT_TRANSITION}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className='text-muted-foreground text-[13px]'>per month</span>
    </p>
  );
}
