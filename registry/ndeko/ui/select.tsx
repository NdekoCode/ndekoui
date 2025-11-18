'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from '@/registry/ndeko/lib/icons';
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

const Select = SelectPrimitive.Root;

type SelectTriggerProps = WithClassName<SelectPrimitive.Trigger.Props> & {
  size?: ControlSize;
};

function SelectTrigger({
  className,
  children,
  size = 'default',
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      className={cn(
        CONTROL_RECIPE,
        CONTROL_SIZES[size],
        'data-popup-open:border-foreground/30 data-placeholder:text-muted-foreground/75 flex cursor-pointer items-center justify-between gap-2 text-left',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className='text-muted-foreground'>
        <ChevronsUpDownIcon className='size-3.5' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({
  className,
  ...props
}: WithClassName<SelectPrimitive.Value.Props>) {
  return (
    <SelectPrimitive.Value
      data-slot='select-value'
      className={cn('flex-1 truncate', className)}
      {...props}
    />
  );
}

type SelectContentProps = WithClassName<SelectPrimitive.Popup.Props> &
  Pick<
    SelectPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'alignItemWithTrigger'
  >;

const SCROLL_ARROW =
  'flex h-5 w-full cursor-default items-center justify-center text-muted-foreground [&_svg]:size-3.5';

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        className='z-50 outline-none'
      >
        <SelectPrimitive.Popup
          data-slot='select-content'
          className={cn(MENU_POPUP, 'min-w-(--anchor-width)', className)}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className={SCROLL_ARROW}>
            <ChevronUpIcon />
          </SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow className={SCROLL_ARROW}>
            <ChevronDownIcon />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: WithClassName<SelectPrimitive.Item.Props>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(MENU_ITEM, 'pr-8', className)}
      {...props}
    >
      <SelectPrimitive.ItemText className='flex min-w-0 flex-1 items-center gap-2.5 truncate'>
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className='absolute right-1.5 flex items-center transition-[scale,opacity] duration-150 ease-(--ease-out-strong) data-ending-style:scale-75 data-ending-style:opacity-0 data-starting-style:scale-75 data-starting-style:opacity-0'>
        <SelectedMark />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />;
}

function SelectLabel({
  className,
  ...props
}: WithClassName<SelectPrimitive.GroupLabel.Props>) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot='select-label'
      className={cn(MENU_LABEL, className)}
      {...props}
    />
  );
}

function SelectSeparator({
  className,
  ...props
}: WithClassName<SelectPrimitive.Separator.Props>) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn(MENU_SEPARATOR, className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
