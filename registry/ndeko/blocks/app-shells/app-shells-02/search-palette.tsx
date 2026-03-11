'use client';

import { CircleCheckIcon, SearchIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/registry/ndeko/ui/command';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import type { NavGroup, PageId } from './data';

function headingOf(group: NavGroup) {
  if (group.team) {
    return group.team.name;
  }
  if (group.label) {
    return group.label;
  }
  return 'Personal';
}

const SEARCH_FIELD =
  'text-muted-foreground flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 px-2.5 text-left';

const SEARCH_ICON_BUTTON =
  'text-muted-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center px-0';

type SearchTriggerProps = {
  isCollapsed: boolean;
  onOpen: () => void;
};

export function SearchTrigger({ isCollapsed, onOpen }: SearchTriggerProps) {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          type='button'
          aria-label='Search'
          onClick={onOpen}
          className={cn(CONTROL_RECIPE, SEARCH_ICON_BUTTON)}
        >
          <SearchIcon className='size-4' />
        </TooltipTrigger>
        <TooltipContent side='right' className='flex items-center gap-2'>
          Search
          <Kbd>⌘K</Kbd>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type='button'
      onClick={onOpen}
      className={cn(CONTROL_RECIPE, SEARCH_FIELD)}
    >
      <SearchIcon className='size-4 shrink-0' />
      <span className='min-w-0 flex-1 truncate'>Search</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NavGroup[];
  onNavigate: (pageId: PageId) => void;
  onCreateTask: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  onNavigate,
  onCreateTask,
}: CommandPaletteProps) {
  function closePalette() {
    onOpenChange(false);
  }

  function createTask() {
    closePalette();
    onCreateTask();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Search'
      description='Go to a page or run an action'
    >
      <CommandInput placeholder='Go to a page or run an action' />
      <CommandList>
        <CommandEmpty>Nothing matches. Try the name of a page.</CommandEmpty>
        <CommandGroup heading='Actions'>
          <CommandItem onSelect={createTask}>
            <CircleCheckIcon />
            New task
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        {groups.map((group) => (
          <CommandGroup key={group.id} heading={headingOf(group)}>
            {group.items.map((item) => {
              const ItemIcon = item.icon;

              function goToPage() {
                closePalette();
                onNavigate(item.id);
              }

              return (
                <CommandItem
                  key={item.id}
                  value={`${group.id} ${item.label}`}
                  onSelect={goToPage}
                >
                  <ItemIcon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
