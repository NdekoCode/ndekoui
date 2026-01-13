'use client';

import { useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

export default function Dropdown07() {
  const [framework, setFramework] = useState('nextjs');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        Framework
        <ChevronDownIcon className='-me-1 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={framework} onValueChange={setFramework}>
          <DropdownMenuRadioItem value='nextjs' closeOnClick>
            Next.js
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='sveltekit' closeOnClick disabled>
            SvelteKit
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='remix' closeOnClick>
            Remix
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='astro' closeOnClick>
            Astro
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
