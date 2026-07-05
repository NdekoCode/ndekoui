'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Toggle } from '@/registry/ndeko/ui/toggle';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function themeGlyphOf(isDark: boolean) {
  if (isDark) {
    return { key: 'dark', icon: <MoonIcon /> };
  }
  return { key: 'light', icon: <SunIcon /> };
}

export default function Button26() {
  const [isDark, setIsDark] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = themeGlyphOf(isDark);

  return (
    <Toggle
      variant='outline'
      pressed={isDark}
      onPressedChange={setIsDark}
      aria-label='Dark mode'
      className='relative size-8 px-0'
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={glyph.key}
          className='flex'
          variants={iconVariants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {glyph.icon}
        </motion.span>
      </AnimatePresence>
    </Toggle>
  );
}
