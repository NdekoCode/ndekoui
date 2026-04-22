'use client';

import {
  BellIcon,
  ChevronsUpDownIcon,
  CommandIcon,
  LifeBuoyIcon,
  LogOutIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { PageId, Person } from './data';
import { PersonAvatar } from './sidebar-parts';

const TRIGGER = [
  'flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-left outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
].join(' ');

type AccountMenuProps = {
  person: Person;
  onOpenSettings: (pageId: PageId) => void;
};

export function AccountMenuItems({ person, onOpenSettings }: AccountMenuProps) {
  function openProfile() {
    onOpenSettings('profile');
  }

  function openNotifications() {
    onOpenSettings('notifications');
  }

  return (
    <>
      <div className='flex items-center gap-2.5 px-2 py-2'>
        <PersonAvatar person={person} />
        <div className='min-w-0'>
          <p className='truncate text-[13px] font-medium'>{person.name}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {person.role}
          </p>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={openProfile}>
        <UserIcon />
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openNotifications}>
        <BellIcon />
        Notifications
      </DropdownMenuItem>
      <DropdownMenuItem>
        <CommandIcon />
        Keyboard shortcuts
        <Kbd className='ml-auto'>?</Kbd>
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
    </>
  );
}

export function AccountMenu({ person, onOpenSettings }: AccountMenuProps) {
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
        <PersonAvatar person={person} className='size-6 text-[10px]' />
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          {person.name}
        </span>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-60'>
        <AccountMenuItems person={person} onOpenSettings={onOpenSettings} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
