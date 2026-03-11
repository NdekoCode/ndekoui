'use client';

import {
  ChevronsUpDownIcon,
  PlusIcon,
  SettingsIcon,
} from '@/registry/ndeko/lib/icons';
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
import { EntityTile } from './sidebar-parts';

const TRIGGER = [
  'flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left outline-none',
  'transition-colors duration-150 hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25',
].join(' ');

function memberCountLabelOf(count: number) {
  if (count === 1) {
    return '1 member';
  }
  return `${count} members`;
}

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  current: Workspace;
  isCollapsed: boolean;
  onSelect: (workspaceId: string) => void;
};

export function WorkspaceSwitcher({
  workspaces,
  current,
  isCollapsed,
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
        <EntityTile entity={current} />
        {!isCollapsed && (
          <>
            <span className='min-w-0 flex-1 truncate text-[13px] font-semibold'>
              {current.name}
            </span>
            <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
          </>
        )}
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
              <EntityTile entity={workspace} size='sm' />
              <span className='min-w-0 flex-1 truncate'>{workspace.name}</span>
              <Kbd aria-hidden='true'>{workspace.memberCount}</Kbd>
              <span className='sr-only'>
                {memberCountLabelOf(workspace.memberCount)}
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
