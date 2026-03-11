'use client';

import {
  CircleCheckIcon,
  FolderPlusIcon,
  PlusIcon,
  UserRoundPlusIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

export type CreateKind = 'task' | 'project' | 'invite';

type QuickCreateMenuProps = {
  onCreate: (kind: CreateKind) => void;
  isCollapsed: boolean;
};

function menuSideOf(isCollapsed: boolean) {
  if (isCollapsed) {
    return 'right' as const;
  }
  return 'bottom' as const;
}

function menuAlignOf(isCollapsed: boolean) {
  if (isCollapsed) {
    return 'start' as const;
  }
  return 'end' as const;
}

export function QuickCreateMenu({
  onCreate,
  isCollapsed,
}: QuickCreateMenuProps) {
  const menuSide = menuSideOf(isCollapsed);
  const menuAlign = menuAlignOf(isCollapsed);

  function createTask() {
    onCreate('task');
  }

  function createProject() {
    onCreate('project');
  }

  function invitePeople() {
    onCreate('invite');
  }

  return (
    <DropdownMenu>
      <Tooltip disabled={!isCollapsed}>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant='outline' size='icon' aria-label='Create' />
              }
            />
          }
        >
          <PlusIcon />
        </TooltipTrigger>
        <TooltipContent side='right'>Create</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side={menuSide} align={menuAlign} className='w-52'>
        <DropdownMenuItem onClick={createTask}>
          <CircleCheckIcon />
          New task
          <Kbd className='ml-auto'>C</Kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={createProject}>
          <FolderPlusIcon />
          New project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={invitePeople}>
          <UserRoundPlusIcon />
          Invite people
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
