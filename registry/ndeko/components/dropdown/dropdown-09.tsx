'use client';

import { useState } from 'react';

import {
  ArchiveIcon,
  ChevronDownIcon,
  PlusIcon,
  Share2Icon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';

function Shortcut({ keys }: { keys: string[] }) {
  return (
    <DropdownMenuShortcut>
      <KbdGroup>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    </DropdownMenuShortcut>
  );
}

export default function Dropdown09() {
  const [framework, setFramework] = useState('nextjs');
  const [hasEmailNotifications, setHasEmailNotifications] = useState(false);
  const [hasPushNotifications, setHasPushNotifications] = useState(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        Project
        <ChevronDownIcon className='-me-1 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <PlusIcon />
          New
          <Shortcut keys={['⌘', 'N']} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Framework</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={framework}
                onValueChange={setFramework}
              >
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Notifications</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuCheckboxItem
                checked={hasEmailNotifications}
                onCheckedChange={setHasEmailNotifications}
              >
                Email
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hasPushNotifications}
                onCheckedChange={setHasPushNotifications}
              >
                Push
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Share2Icon />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ArchiveIcon />
            Archive
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive'>
          <TrashIcon />
          Delete
          <Shortcut keys={['⌘', '⌫']} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
