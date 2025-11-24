'use client';

import { Command as CommandPrimitive } from 'cmdk';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { MENU_SEPARATOR } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/registry/ndeko/ui/dialog';

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot='command'
      className={cn(
        'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-xl',
        className
      )}
      {...props}
    />
  );
}

type CommandDialogProps = Omit<
  React.ComponentProps<typeof Dialog>,
  'children'
> & {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

function CommandDialog({
  title = 'Command palette',
  description = 'Search for a command to run.',
  className,
  children,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent
        showCloseButton={false}
        instant
        animateSize={false}
        contentClassName='gap-0'
        className={cn('max-w-lg overflow-hidden p-0', className)}
      >
        <DialogTitle className='sr-only'>{title}</DialogTitle>
        <DialogDescription className='sr-only'>{description}</DialogDescription>
        <Command className='rounded-none bg-transparent **:data-[slot=command-input-wrapper]:h-12'>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot='command-input-wrapper'
      className='hairline-b border-border flex h-10 items-center gap-2 px-3'
    >
      <SearchIcon className='text-muted-foreground size-4 shrink-0' />
      <CommandPrimitive.Input
        data-slot='command-input'
        className={cn(
          'placeholder:text-muted-foreground/75 flex h-full w-full bg-transparent text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot='command-list'
      className={cn(
        'max-h-80 flex-1 scroll-py-1 overflow-x-hidden overflow-y-auto p-1',
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot='command-empty'
      className={cn(
        'text-muted-foreground py-6 text-center text-[13px]',
        className
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot='command-group'
      className={cn(
        'text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
        className
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot='command-separator'
      className={cn(MENU_SEPARATOR, className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot='command-item'
      className={cn(
        "data-[selected=true]:bg-foreground/5 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-[13px] outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot='command-shortcut'
      className={cn(
        'keycap-3d text-muted-foreground ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 font-sans text-[11px] font-medium',
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
