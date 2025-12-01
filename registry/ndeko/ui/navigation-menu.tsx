'use client';

import { NavigationMenu as NavigationMenuPrimitive } from '@base-ui/react/navigation-menu';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

const MORPH_STYLE = {
  '--duration': '0.25s',
  '--easing': 'var(--ease-out-strong)',
} as React.CSSProperties;

function NavigationMenu({
  className,
  children,
  ...props
}: WithClassName<NavigationMenuPrimitive.Root.Props>) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot='navigation-menu'
      className={cn('relative min-w-max', className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Portal>
        <NavigationMenuPrimitive.Positioner
          sideOffset={8}
          collisionPadding={{ top: 5, bottom: 5, left: 16, right: 16 }}
          collisionAvoidance={{ side: 'none' }}
          style={MORPH_STYLE}
          className="z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-(--duration) ease-(--easing) before:absolute before:content-[''] data-instant:transition-none data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:-top-2.5 data-[side=bottom]:before:h-2.5"
        >
          <NavigationMenuPrimitive.Popup className='surface-raised relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-xl transition-[opacity,scale,width,height] duration-(--duration) ease-(--easing) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-95 data-starting-style:opacity-0'>
            <NavigationMenuPrimitive.Viewport className='relative h-full w-full overflow-hidden' />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>
      </NavigationMenuPrimitive.Portal>
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: WithClassName<NavigationMenuPrimitive.List.Props>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot='navigation-menu-list'
      className={cn('relative flex items-center gap-1', className)}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: WithClassName<NavigationMenuPrimitive.Item.Props>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot='navigation-menu-item'
      className={cn('relative', className)}
      {...props}
    />
  );
}

const TRIGGER =
  'inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 data-popup-open:text-foreground';

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: WithClassName<NavigationMenuPrimitive.Trigger.Props>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot='navigation-menu-trigger'
      className={cn(TRIGGER, className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon className='transition-transform duration-200 ease-(--ease-out-strong) data-popup-open:rotate-180'>
        <ChevronDownIcon className='size-3.5' />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  );
}

const CONTENT = [
  'w-[calc(100vw-2.5rem)] p-2 sm:w-max sm:min-w-80',
  'transition-[opacity,translate] duration-(--duration) ease-(--easing)',
  'data-starting-style:opacity-0 data-ending-style:opacity-0',
  'data-starting-style:data-[activation-direction=left]:-translate-x-1/2 data-starting-style:data-[activation-direction=right]:translate-x-1/2',
  'data-ending-style:data-[activation-direction=left]:translate-x-1/2 data-ending-style:data-[activation-direction=right]:-translate-x-1/2',
].join(' ');

function NavigationMenuContent({
  className,
  ...props
}: WithClassName<NavigationMenuPrimitive.Content.Props>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot='navigation-menu-content'
      className={cn(CONTENT, className)}
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: WithClassName<NavigationMenuPrimitive.Link.Props>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot='navigation-menu-link'
      className={cn(
        'hover:bg-foreground/[0.04] focus-visible:ring-ring/25 data-active:bg-primary/[0.06] flex flex-col gap-1 rounded-lg p-2.5 text-[13px] transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  TRIGGER as navigationMenuTriggerStyle,
};
