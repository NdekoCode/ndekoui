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
import { Button } from '@/registry/ndeko/ui/button';

type Theme = 'light' | 'dark';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const EXIT_TRANSITION: Transition = { duration: 0.1, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.6,
    filter: 'blur(2px)',
    transition: EXIT_TRANSITION,
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT_TRANSITION },
};

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function oppositeOf(theme: Theme): Theme {
  if (theme === 'dark') {
    return 'light';
  }
  return 'dark';
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return <MoonIcon />;
  }
  return <SunIcon />;
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const nextTheme = oppositeOf(theme);

  function toggleTheme() {
    setTheme(oppositeOf);
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={toggleTheme}
      className='text-muted-foreground'
    >
      <span className='relative flex'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={theme}
            className='flex'
            variants={iconVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <ThemeIcon theme={theme} />
          </motion.span>
        </AnimatePresence>
      </span>
    </Button>
  );
}

export { ThemeToggle };
