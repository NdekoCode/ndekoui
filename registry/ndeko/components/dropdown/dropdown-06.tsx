'use client';

import { useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

export default function Dropdown06() {
  const [hasNextjs, setHasNextjs] = useState(false);
  const [hasSveltekit, setHasSveltekit] = useState(true);
  const [hasRemix, setHasRemix] = useState(false);
  const [hasAstro, setHasAstro] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        Frameworks
        <ChevronDownIcon className='-me-1 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={hasNextjs}
          onCheckedChange={setHasNextjs}
        >
          Next.js
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasSveltekit}
          onCheckedChange={setHasSveltekit}
        >
          SvelteKit
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRemix}
          onCheckedChange={setHasRemix}
          disabled
        >
          Remix
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasAstro}
          onCheckedChange={setHasAstro}
        >
          Astro
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
