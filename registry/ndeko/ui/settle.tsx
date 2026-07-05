'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useState } from 'react';

const GROUP: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06 } },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  shown: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    transitionEnd: { filter: 'none' },
  },
};

const ITEM_FADE: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.2 } },
};

function groupStateOf(hasShown: boolean) {
  if (hasShown) {
    return 'shown';
  }
  return 'hidden';
}

function itemVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ITEM_FADE;
  }
  return ITEM;
}

type SettleProps = {
  /** True once the piece is on screen. The entrance plays the first time and never again. */
  isShown: boolean;
  className?: string;
  children: React.ReactNode;
};

/** The parts of a piece arrive in order the first time it is seen: each sharpens and rises 8px, 60ms after the one before. */
export function Settle({ isShown, className, children }: SettleProps) {
  const [hasShown, setHasShown] = useState(isShown);
  const isFirstShow = isShown && !hasShown;
  if (isFirstShow) {
    setHasShown(true);
  }

  return (
    <motion.div
      initial='hidden'
      animate={groupStateOf(hasShown)}
      variants={GROUP}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type SettleItemProps = {
  className?: string;
  children: React.ReactNode;
};

export function SettleItem({ className, children }: SettleItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={itemVariantsOf(shouldReduceMotion)}
      className={className}
    >
      {children}
    </motion.div>
  );
}
