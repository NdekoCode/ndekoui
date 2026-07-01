'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import type { MouseEvent } from 'react';

import { useIsClient } from '@/hooks/useIsClient';
import {
  applyThemeClass,
  originOf,
  transitionTheme,
  type ThemeName,
} from '@/lib/theme-transition';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const ICON_TURN = {
  hidden: { opacity: 0, rotate: -90, scale: 0.5 },
  shown: { opacity: 1, rotate: 0, scale: 1 },
  gone: { opacity: 0, transition: { duration: 0 } },
};

const ICON_FADE = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  gone: { opacity: 0, transition: { duration: 0 } },
};

const ICON_TIMING = { duration: 0.45, ease: [0.2, 0, 0, 1] } as const;

function themeOf(resolvedTheme: string | undefined): ThemeName {
  if (resolvedTheme === 'dark') {
    return 'dark';
  }
  return 'light';
}

function oppositeOf(theme: ThemeName): ThemeName {
  if (theme === 'dark') {
    return 'light';
  }
  return 'dark';
}

function iconMotionOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return ICON_FADE;
  }
  return ICON_TURN;
}

function ThemeGlyph({ theme }: { theme: ThemeName }) {
  if (theme === 'dark') {
    return <MoonIcon />;
  }
  return <SunIcon />;
}

/** Light opens in a circle from the button, dark closes back into it, and the new icon turns a quarter turn as it grows. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();

  if (!isClient) {
    return <span aria-hidden='true' className='size-7' />;
  }

  const theme = themeOf(resolvedTheme);
  const nextTheme = oppositeOf(theme);
  const iconMotion = iconMotionOf(prefersReducedMotion);

  function applyNextTheme() {
    applyThemeClass(nextTheme, setTheme);
  }

  function switchTheme(event: MouseEvent<HTMLButtonElement>) {
    const origin = originOf(event.currentTarget);
    transitionTheme(nextTheme, applyNextTheme, origin);
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
          initial={iconMotion.hidden}
          animate={iconMotion.shown}
          exit={iconMotion.gone}
          transition={ICON_TIMING}
        >
          <ThemeGlyph theme={theme} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
