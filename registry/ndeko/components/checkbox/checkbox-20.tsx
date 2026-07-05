'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { buttonVariants } from '@/registry/ndeko/ui/button';

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

const THEME_CHECKBOX = buttonVariants({ variant: 'outline', size: 'icon' });

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

export default function Checkbox20() {
  const captionId = useId();
  const [isDark, setIsDark] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = themeGlyphOf(isDark);

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Dark mode
      </span>
      <CheckboxPrimitive.Root
        checked={isDark}
        onCheckedChange={setIsDark}
        aria-labelledby={captionId}
        className={THEME_CHECKBOX}
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
      </CheckboxPrimitive.Root>
    </div>
  );
}
