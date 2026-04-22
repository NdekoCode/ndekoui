'use client';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/ndeko/ui/command';
import { Kbd } from '@/registry/ndeko/ui/kbd';

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

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type='button'
      onClick={onOpen}
      className={cn(
        CONTROL_RECIPE,
        'text-muted-foreground flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 px-2.5 text-left'
      )}
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
};

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  onNavigate,
}: CommandPaletteProps) {
  function closePalette() {
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Search'
      description='Go to a settings page'
    >
      <CommandInput placeholder='Go to a settings page' />
      <CommandList>
        <CommandEmpty>
          Nothing matches. Try the name of a settings page.
        </CommandEmpty>
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
