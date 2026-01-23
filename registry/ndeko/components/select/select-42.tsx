'use client';

import { useId, useState } from 'react';

import { ChevronsUpDownIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE, CONTROL_SIZES } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/registry/ndeko/ui/command';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

const ORGANIZATIONS = [
  { value: 'lumen', label: 'Lumen Labs' },
  { value: 'kivu', label: 'Kivu Studio' },
];

const TRIGGER = cn(
  CONTROL_RECIPE,
  CONTROL_SIZES.default,
  'flex cursor-pointer items-center justify-between gap-2 text-left',
  'data-popup-open:border-foreground/30'
);

function labelOf(value: string) {
  const organization = ORGANIZATIONS.find((item) => item.value === value);
  return organization?.label ?? 'Pick an organization';
}

export default function Select42() {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('lumen');

  function selectOrganization(nextValue: string) {
    setValue(nextValue);
    setIsOpen(false);
  }

  function startNewOrganization() {
    setIsOpen(false);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label htmlFor={id}>Organization</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger id={id} className={TRIGGER}>
          <span className='flex-1 truncate'>{labelOf(value)}</span>
          <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
        </PopoverTrigger>
        <PopoverContent align='start' className='w-(--anchor-width) p-0'>
          <Command>
            <CommandInput placeholder='Find an organization' />
            <CommandList>
              <CommandEmpty>No organization matches your search.</CommandEmpty>
              <CommandGroup>
                {ORGANIZATIONS.map((organization) => (
                  <CommandItem
                    key={organization.value}
                    value={organization.label}
                    onSelect={() => selectOrganization(organization.value)}
                  >
                    <span className='truncate'>{organization.label}</span>
                    {organization.value === value && (
                      <SelectedMark label='Selected' className='ms-auto' />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator alwaysRender />
              <CommandGroup forceMount>
                <CommandItem
                  forceMount
                  value='new-organization'
                  onSelect={startNewOrganization}
                >
                  <PlusIcon />
                  New organization
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
