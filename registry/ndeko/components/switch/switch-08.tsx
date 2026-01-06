'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function stateLabelOf(isOn: boolean) {
  if (isOn) {
    return 'On';
  }
  return 'Off';
}

export default function Switch08() {
  const id = useId();
  const [isOn, setIsOn] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const stateLabel = stateLabelOf(isOn);

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch
        id={id}
        checked={isOn}
        onCheckedChange={setIsOn}
        aria-label='Auto-save'
      />
      <Label htmlFor={id} className='relative'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={stateLabel}
            className='flex'
            variants={labelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {stateLabel}
          </motion.span>
        </AnimatePresence>
      </Label>
    </div>
  );
}
