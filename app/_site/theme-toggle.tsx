'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';

import { useIsClient } from '@/hooks/useIsClient';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

type Theme = 'light' | 'dark';

const ICON_SWAP = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
} as const;

const MORPH = {
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  shown: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

const FADE = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

function themeOf(resolvedTheme: string | undefined): Theme {
  if (resolvedTheme === 'dark') {
    return 'dark';
  }
  return 'light';
}

function oppositeOf(theme: Theme): Theme {
  if (theme === 'dark') {
    return 'light';
  }
  return 'dark';
}

function swapOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return FADE;
  }
  return MORPH;
}

function ThemeGlyph({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return <MoonIcon />;
  }
  return <SunIcon />;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();

  if (!isClient) {
    return <span aria-hidden='true' className='size-7' />;
  }

  const theme = themeOf(resolvedTheme);
  const nextTheme = oppositeOf(theme);
  const swap = swapOf(prefersReducedMotion);

  function switchTheme() {
    setTheme(nextTheme);
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={switchTheme}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={theme}
          className='flex'
          initial={swap.hidden}
          animate={swap.shown}
          exit={swap.hidden}
          transition={ICON_SWAP}
        >
          <ThemeGlyph theme={theme} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
