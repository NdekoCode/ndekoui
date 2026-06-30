'use client';

import { useTheme } from 'next-themes';

import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { useIsClient } from '@/hooks/useIsClient';

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const hasTheme = isClient && Boolean(resolvedTheme);

  function changeTheme(value: unknown) {
    const theme = String(value);
    setTheme(theme);
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
