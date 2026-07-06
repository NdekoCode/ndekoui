'use client';

import {
  ChevronsUpDownIcon,
  CommandIcon,
  LifeBuoyIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { Person } from './data';

const TRIGGER = [
  'flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-start outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
].join(' ');

export function AccountMenu({ person }: { person: Person }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label={`Account: ${person.name}`}
            className={TRIGGER}
          />
        }
      >
        <Avatar seed={person.name} className='size-6' />
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          {person.name}
        </span>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-60'>
        <div className='flex items-center gap-2.5 px-2 py-2'>
          <Avatar seed={person.name} />
          <div className='min-w-0'>
            <p className='truncate text-[13px] font-medium'>{person.name}</p>
            <p className='text-muted-foreground truncate text-xs'>
              {person.role}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CommandIcon />
          Keyboard shortcuts
          <Kbd className='ms-auto'>?</Kbd>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoyIcon />
          Help and docs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive'>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
