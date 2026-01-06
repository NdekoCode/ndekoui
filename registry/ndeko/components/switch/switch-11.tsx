'use client';

import { useState } from 'react';

import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Switch } from '@/registry/ndeko/ui/switch';

const SIDE_ICON = 'flex cursor-pointer transition-colors duration-150';

function sideToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

export default function Switch11() {
  const [isDark, setIsDark] = useState(false);
  const lightTone = sideToneOf(!isDark);
  const darkTone = sideToneOf(isDark);

  function chooseLight() {
    setIsDark(false);
  }

  function chooseDark() {
    setIsDark(true);
  }

  return (
    <div className='inline-flex items-center gap-2'>
      <span
        aria-hidden='true'
        className={cn(SIDE_ICON, lightTone)}
        onClick={chooseLight}
      >
        <SunIcon />
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={setIsDark}
        aria-label='Dark mode'
      />
      <span
        aria-hidden='true'
        className={cn(SIDE_ICON, darkTone)}
        onClick={chooseDark}
      >
        <MoonIcon />
      </span>
    </div>
  );
}
