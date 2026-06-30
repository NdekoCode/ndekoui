'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />;
}

/**
 * The first open does not glide: Base UI positions the popup while it still holds transitions off.
 * `trigger-change` marks a popover resting after a move between triggers, so scroll and resize
 * tracking stay instant; a keyboard open (`click`) still glides.
 */
const POPOVER_GLIDE = [
  'transition-[top,left,right,bottom,transform] duration-250 ease-(--ease-out-strong)',
  'data-closed:transition-none data-[instant=trigger-change]:transition-none',
].join(' ');

function positionerClassOf(glide: boolean) {
  return cn('z-50', glide && POPOVER_GLIDE);
}

type PopoverContentProps = WithClassName<PopoverPrimitive.Popup.Props> &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'alignOffset'
  > & {
    /** Glide to the next anchor of a popover shared by several triggers. */
    glide?: boolean;
  };

function PopoverContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'center',
  alignOffset = 0,
  glide = false,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={positionerClassOf(glide)}
      >
        <PopoverPrimitive.Popup
          data-slot='popover-content'
          className={cn(
            'surface-raised w-72 rounded-xl p-4 text-[13px] outline-none',
            POPUP_TRANSITION,
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({
  className,
  ...props
}: WithClassName<PopoverPrimitive.Title.Props>) {
  return (
    <PopoverPrimitive.Title
      data-slot='popover-title'
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: WithClassName<PopoverPrimitive.Description.Props>) {
  return (
    <PopoverPrimitive.Description
      data-slot='popover-description'
      className={cn('text-muted-foreground text-[13px]', className)}
      {...props}
    />
  );
}

function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot='popover-close' {...props} />;
}

export {
  POPOVER_GLIDE,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
};
