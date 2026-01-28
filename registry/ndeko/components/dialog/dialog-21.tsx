'use client';

import { useEffect, useState } from 'react';

import {
  ArrowUpRightIcon,
  CircleFadingPlusIcon,
  FileInputIcon,
  FolderPlusIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE, CONTROL_SIZES } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/registry/ndeko/ui/command';
import { Kbd } from '@/registry/ndeko/ui/kbd';

const QUICK_ACTIONS = [
  { label: 'New folder', shortcut: '⌘N', Icon: FolderPlusIcon },
  { label: 'Import document', shortcut: '⌘I', Icon: FileInputIcon },
  { label: 'Add block', shortcut: '⌘B', Icon: CircleFadingPlusIcon },
];

const DESTINATIONS = ['Go to dashboard', 'Go to apps', 'Go to connections'];

const SEARCH_TRIGGER = cn(
  CONTROL_RECIPE,
  CONTROL_SIZES.default,
  'text-muted-foreground inline-flex w-64 cursor-pointer items-center gap-2 text-start'
);

function isPaletteShortcut(event: KeyboardEvent) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isKKey && hasModifier;
}

export default function Dialog21() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function togglePalette(event: KeyboardEvent) {
      if (!isPaletteShortcut(event)) {
        return;
      }
      event.preventDefault();
      setIsOpen((current) => !current);
    }

    document.addEventListener('keydown', togglePalette);
    return () => document.removeEventListener('keydown', togglePalette);
  }, []);

  function openPalette() {
    setIsOpen(true);
  }

  function closePalette() {
    setIsOpen(false);
  }

  return (
    <>
      <button type='button' className={SEARCH_TRIGGER} onClick={openPalette}>
        <SearchIcon className='text-muted-foreground/80 size-4 shrink-0' />
        <span className='grow'>Search</span>
        <Kbd>⌘K</Kbd>
      </button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder='Type a command or search' />
        <CommandList>
          <CommandEmpty>No command matches this search.</CommandEmpty>
          <CommandGroup heading='Quick start'>
            {QUICK_ACTIONS.map((action) => (
              <CommandItem key={action.label} onSelect={closePalette}>
                <action.Icon />
                <span>{action.label}</span>
                <CommandShortcut>{action.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Navigation'>
            {DESTINATIONS.map((destination) => (
              <CommandItem key={destination} onSelect={closePalette}>
                <ArrowUpRightIcon />
                <span>{destination}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
