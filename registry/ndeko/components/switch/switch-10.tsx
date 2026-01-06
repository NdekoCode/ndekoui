'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

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

export default function Switch10() {
  const id = useId();
  const [isDark, setIsDark] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = themeGlyphOf(isDark);

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id={id} checked={isDark} onCheckedChange={setIsDark} />
      <Label htmlFor={id} className='relative'>
        <span className='sr-only'>Dark mode</span>
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
      </Label>
    </div>
  );
}
