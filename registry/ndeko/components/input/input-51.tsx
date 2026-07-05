'use client';

import { Input as InputPrimitive } from '@base-ui/react/input';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';
import images, { type CardImages } from 'react-payment-inputs/images';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CreditCardIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

const CARD_IMAGES = images as unknown as CardImages;

const CARD_GROUP = cn(
  CONTROL_RECIPE,
  'flex flex-col overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

const BARE_INPUT =
  'placeholder:text-muted-foreground/75 h-8 w-full min-w-0 bg-transparent px-2.5 tabular-nums outline-none [direction:inherit]';

const HAIRLINE = 'bg-foreground/12 dark:bg-foreground/15 shrink-0';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function cardKeyOf(cardType: { type: string } | undefined) {
  if (!cardType) {
    return 'unknown';
  }
  return cardType.type;
}

export default function Input51() {
  const id = useId();
  const {
    meta,
    getCardNumberProps,
    getExpiryDateProps,
    getCVCProps,
    getCardImageProps,
  } = usePaymentInputs();
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const hasCardType = Boolean(meta.cardType);
  const cardKey = cardKeyOf(meta.cardType);

  return (
    <fieldset className='w-full max-w-xs'>
      <legend className={cn(LABEL_RECIPE, 'mb-1.5')}>Card details</legend>
      <div className={CARD_GROUP}>
        <div className='relative'>
          <InputPrimitive
            {...getCardNumberProps()}
            id={`${id}-number`}
            className={cn(BARE_INPUT, 'pe-8')}
          />
          <span className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex w-8 items-center justify-center'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={cardKey}
                className='flex'
                variants={swapVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {hasCardType && (
                  <svg
                    className='overflow-hidden rounded-[3px]'
                    {...getCardImageProps({ images: CARD_IMAGES })}
                    width={20}
                  />
                )}
                {!hasCardType && <CreditCardIcon className='size-4' />}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <span className={cn(HAIRLINE, 'h-(--hairline)')} aria-hidden='true' />
        <div className='flex'>
          <InputPrimitive
            {...getExpiryDateProps()}
            id={`${id}-expiry`}
            className={BARE_INPUT}
          />
          <span className={cn(HAIRLINE, 'w-(--hairline)')} aria-hidden='true' />
          <InputPrimitive
            {...getCVCProps()}
            id={`${id}-cvc`}
            className={BARE_INPUT}
          />
        </div>
      </div>
    </fieldset>
  );
}
