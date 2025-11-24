'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';

import { ChevronsUpDownIcon, XIcon } from '@/registry/ndeko/lib/icons';
import {
  CONTROL_RECIPE,
  CONTROL_SIZES,
  MENU_ITEM,
  MENU_LABEL,
  MENU_POPUP,
  MENU_SEPARATOR,
  type ControlSize,
} from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

const ITEM_INDICATOR =
  'absolute right-1.5 flex items-center transition-[scale,opacity] duration-150 ease-(--ease-out-strong) data-ending-style:scale-75 data-ending-style:opacity-0 data-starting-style:scale-75 data-starting-style:opacity-0';

const Combobox = ComboboxPrimitive.Root;

const ComboboxValue = ComboboxPrimitive.Value;

function ComboboxInputGroup({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.InputGroup.Props>) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot='combobox-input-group'
      className={cn(
        CONTROL_RECIPE,
        'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:ring-ring/25 flex min-h-8 cursor-text flex-wrap items-center gap-1 px-1.5 py-1 focus-within:ring-[3px]',
        className
      )}
      {...props}
    />
  );
}

function ComboboxInput({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.Input.Props>) {
  return (
    <ComboboxPrimitive.Input
      data-slot='combobox-input'
      className={cn(
        'placeholder:text-muted-foreground/75 h-6 min-w-12 flex-1 bg-transparent px-1 text-base outline-none md:text-[13px]',
        className
      )}
      {...props}
    />
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: WithClassName<ComboboxPrimitive.Trigger.Props>) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot='combobox-trigger'
      className={cn(
        'text-muted-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 ms-auto flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      {children ?? <ChevronsUpDownIcon className='size-3.5' />}
    </ComboboxPrimitive.Trigger>
  );
}

type ComboboxSelectTriggerProps =
  WithClassName<ComboboxPrimitive.Trigger.Props> & {
    size?: ControlSize;
    /** Shown while nothing is chosen. Ignored when children are given. */
    placeholder?: React.ReactNode;
  };

/**
 * A trigger drawn like the select trigger: it shows the chosen value or the placeholder and opens the list.
 * Put the `ComboboxInput` inside `ComboboxContent` to search from the popup.
 */
function ComboboxSelectTrigger({
  className,
  children,
  size = 'default',
  placeholder,
  ...props
}: ComboboxSelectTriggerProps) {
  const chosenValue = children ?? <ComboboxValue placeholder={placeholder} />;

  return (
    <ComboboxPrimitive.Trigger
      data-slot='combobox-select-trigger'
      className={cn(
        CONTROL_RECIPE,
        CONTROL_SIZES[size],
        'data-popup-open:border-foreground/30 data-placeholder:text-muted-foreground/75 flex cursor-pointer items-center justify-between gap-2 text-left',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span data-slot='combobox-select-value' className='flex-1 truncate'>
        {chosenValue}
      </span>
      <ComboboxPrimitive.Icon className='text-muted-foreground flex'>
        <ChevronsUpDownIcon className='size-3.5' />
      </ComboboxPrimitive.Icon>
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({
  className,
  label = 'Clear',
  ...props
}: WithClassName<ComboboxPrimitive.Clear.Props> & { label?: string }) {
  return (
    <ComboboxPrimitive.Clear
      data-slot='combobox-clear'
      aria-label={label}
      className={cn(
        'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      <XIcon className='size-3.5' />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxChips({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.Chips.Props>) {
  return (
    <ComboboxPrimitive.Chips
      data-slot='combobox-chips'
      className={cn('flex w-full flex-wrap items-center gap-1', className)}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.Chip.Props>) {
  return (
    <ComboboxPrimitive.Chip
      data-slot='combobox-chip'
      className={cn(
        'bg-card text-foreground hairline-ring ring-foreground/12 focus-within:ring-ring/50 data-highlighted:bg-foreground/5 flex h-6 cursor-default items-center gap-1 rounded-md ps-2 pe-0.5 text-xs font-medium shadow-[0_1px_1px_rgb(0_0_0/0.04)] outline-none',
        className
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.ChipRemove.Props>) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot='combobox-chip-remove'
      className={cn(
        'text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex size-5 items-center justify-center rounded-[5px] outline-none',
        className
      )}
      {...props}
    >
      <XIcon className='size-3' />
    </ComboboxPrimitive.ChipRemove>
  );
}

type ComboboxContentProps = WithClassName<ComboboxPrimitive.Popup.Props> &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'alignOffset' | 'anchor'
  >;

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxContentProps) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className='z-50 outline-none'
      >
        <ComboboxPrimitive.Popup
          data-slot='combobox-content'
          className={cn(
            MENU_POPUP,
            'w-(--anchor-width) max-w-(--available-width) overscroll-contain',
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.Empty.Props>) {
  return (
    <ComboboxPrimitive.Empty
      data-slot='combobox-empty'
      className={cn(
        'text-muted-foreground px-2 py-6 text-center text-[13px] empty:hidden',
        className
      )}
      {...props}
    />
  );
}

function ComboboxList({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.List.Props>) {
  return (
    <ComboboxPrimitive.List
      data-slot='combobox-list'
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: WithClassName<ComboboxPrimitive.Item.Props>) {
  return (
    <ComboboxPrimitive.Item
      data-slot='combobox-item'
      className={cn(MENU_ITEM, 'pr-8', className)}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className={ITEM_INDICATOR}>
        <SelectedMark />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup(props: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot='combobox-group' {...props} />;
}

function ComboboxGroupLabel({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.GroupLabel.Props>) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot='combobox-group-label'
      className={cn(MENU_LABEL, className)}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: WithClassName<ComboboxPrimitive.Separator.Props>) {
  return (
    <ComboboxPrimitive.Separator
      data-slot='combobox-separator'
      className={cn(MENU_SEPARATOR, className)}
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxSelectTrigger,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  type ComboboxSelectTriggerProps,
};
