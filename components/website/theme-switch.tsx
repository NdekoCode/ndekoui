'use client';

import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { buttonVariants } from '@/registry/ndeko/ui/button';

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          aria-label='Toggle theme'
          type='button'
        >
          {isLight && <SunIcon />}
          {!isLight && <MoonIcon />}
          <span className='sr-only'>Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
