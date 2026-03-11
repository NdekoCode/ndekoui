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

export type CreateKind = 'task' | 'project' | 'invite';

type QuickCreateMenuProps = {
  onCreate: (kind: CreateKind) => void;
  side?: 'bottom' | 'right';
};

export function QuickCreateMenu({
  onCreate,
  side = 'bottom',
}: QuickCreateMenuProps) {
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
      <DropdownMenuTrigger
        render={<Button variant='outline' size='icon' aria-label='Create' />}
      >
        <PlusIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align='end' className='w-52'>
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
