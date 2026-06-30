'use client';

import { useState } from 'react';

import {
  ArchiveIcon,
  CommandIcon,
  FolderIcon,
  InboxIcon,
  LinkIcon,
  PinIcon,
  PlusIcon,
  SettingsIcon,
  UserRoundPlusIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/registry/ndeko/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

const TOOLTIP_ACTIONS = [
  { label: 'Copy link', icon: LinkIcon },
  { label: 'Pin to sidebar', icon: PinIcon },
  { label: 'Archive project', icon: ArchiveIcon },
];

export function TooltipDemo() {
  const actionHint = useTooltipHandle<string>();

  return (
    <div className='flex items-center gap-1'>
      {TOOLTIP_ACTIONS.map((action) => {
        const ActionIcon = action.icon;
        return (
          <TooltipTrigger
            key={action.label}
            handle={actionHint}
            payload={action.label}
            closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
            render={
              <Button variant='ghost' size='icon' aria-label={action.label} />
            }
          >
            <ActionIcon />
          </TooltipTrigger>
        );
      })}
      <Tooltip handle={actionHint}>
        {({ payload }) => <TooltipContent glide>{payload}</TooltipContent>}
      </Tooltip>
    </div>
  );
}

type CommandEntriesProps = {
  onRun?: () => void;
};

function CommandEntries({ onRun }: CommandEntriesProps) {
  return (
    <CommandList>
      <CommandEmpty>No command matches your search.</CommandEmpty>
      <CommandGroup heading='Tasks'>
        <CommandItem onSelect={onRun}>
          <PlusIcon />
          Create task
          <CommandShortcut>C</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={onRun}>
          <UserRoundPlusIcon />
          Assign to me
          <CommandShortcut>I</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading='Go to'>
        <CommandItem onSelect={onRun}>
          <InboxIcon />
          Inbox
        </CommandItem>
        <CommandItem onSelect={onRun}>
          <FolderIcon />
          Projects
        </CommandItem>
        <CommandItem onSelect={onRun}>
          <SettingsIcon />
          Settings
        </CommandItem>
      </CommandGroup>
    </CommandList>
  );
}

export function CommandDemo() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  function openPalette() {
    setIsPaletteOpen(true);
  }

  function closePalette() {
    setIsPaletteOpen(false);
  }

  return (
    <div className='flex w-full flex-col items-center gap-4'>
      <Command className='hairline-ring ring-border w-full max-w-sm shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <CommandInput placeholder='Search commands' />
        <CommandEntries />
      </Command>
      <Button variant='outline' onClick={openPalette}>
        <CommandIcon />
        Open the palette
      </Button>
      <CommandDialog open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
        <CommandInput placeholder='Type a command or search' />
        <CommandEntries onRun={closePalette} />
      </CommandDialog>
    </div>
  );
}

export function DialogDemo() {
  const [hasNote, setHasNote] = useState(false);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        <UserRoundPlusIcon />
        Invite people
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to Atlas</DialogTitle>
          <DialogDescription>
            They get an email with a link to join the workspace.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>Email addresses</FieldLabel>
          <Input placeholder='omar@example.com, priya@example.com' size='lg' />
        </Field>
        <Label>
          <Switch checked={hasNote} onCheckedChange={setHasNote} />
          Add a personal note
        </Label>
        {hasNote && (
          <Field>
            <FieldLabel>Note</FieldLabel>
            <Textarea placeholder='The roadmap is in Docs, start there' />
          </Field>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant='outline' size='lg' />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button size='lg' />}>Send invites</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
