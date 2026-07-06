'use client';

import {
  ChevronsUpDownIcon,
  PlusIcon,
  SettingsIcon,
} from '@/registry/ndeko/lib/icons';
import { nounOf } from '@/registry/ndeko/lib/words';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { Workspace } from './data';

const TRIGGER = [
  'flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-start outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
].join(' ');

function memberLabelOf(count: number) {
  const noun = nounOf(count, 'member');
  return `${count} ${noun}`;
}

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  current: Workspace;
  onSelect: (workspaceId: string) => void;
};

export function WorkspaceSwitcher({
  workspaces,
  current,
  onSelect,
}: WorkspaceSwitcherProps) {
  function selectWorkspace(value: unknown) {
    if (typeof value === 'string') {
      onSelect(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label={`Workspace: ${current.name}`}
            className={TRIGGER}
          />
        }
      >
        <CompanyMark seed={current.name} className='size-6 rounded-md' />
        <span className='min-w-0 flex-1 truncate text-[13px] font-semibold'>
          {current.name}
        </span>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64'>
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={current.id}
          onValueChange={selectWorkspace}
        >
          {workspaces.map((workspace) => (
            <DropdownMenuRadioItem
              key={workspace.id}
              value={workspace.id}
              closeOnClick
              className='h-9'
            >
              <CompanyMark seed={workspace.name} />
              <span className='min-w-0 flex-1 truncate'>{workspace.name}</span>
              <Kbd aria-hidden='true'>{workspace.memberCount}</Kbd>
              <span className='sr-only'>
                {memberLabelOf(workspace.memberCount)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SettingsIcon />
          Workspace settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PlusIcon />
          Add workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
