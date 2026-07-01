'use client';

import { useTheme } from 'next-themes';

import {
  applyThemeClass,
  originOf,
  transitionTheme,
  type ThemeName,
  type TransitionOrigin,
} from '@/lib/theme-transition';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { useIsClient } from '@/hooks/useIsClient';

type ThemeChangeDetails = { event: Event };

function themeNameOf(value: unknown): ThemeName {
  if (value === 'dark') {
    return 'dark';
  }
  return 'light';
}

function tabOf(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return null;
  }
  return target.closest('[role="tab"]');
}

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const hasTheme = isClient && Boolean(resolvedTheme);

  function changeTheme(value: unknown, details: ThemeChangeDetails) {
    const theme = themeNameOf(value);
    const tab = tabOf(details.event);
    let origin: TransitionOrigin | undefined;
    if (tab) {
      origin = originOf(tab);
    }

    function applyTheme() {
      applyThemeClass(theme, setTheme);
    }

    transitionTheme(theme, applyTheme, origin);
  }

  if (!hasTheme) {
    return <div className='h-8 w-[156px]' aria-hidden='true' />;
  }

  return (
    <Tabs value={resolvedTheme} onValueChange={changeTheme}>
      <TabsList variant='segmented' aria-label='Theme'>
        <TabsTab value='light'>
          <SunIcon />
          Light
        </TabsTab>
        <TabsTab value='dark'>
          <MoonIcon />
          Dark
        </TabsTab>
      </TabsList>
    </Tabs>
  );
}
