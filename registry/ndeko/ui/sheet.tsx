'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { OVERLAY_BACKDROP } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />;
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot='sheet-close' {...props} />;
}

const SIDE_CLASS = {
  right:
    'inset-y-2 right-2 w-[calc(100%-1rem)] max-w-sm data-starting-style:translate-x-[calc(100%+1rem)] data-ending-style:translate-x-[calc(100%+1rem)]',
  left: 'inset-y-2 left-2 w-[calc(100%-1rem)] max-w-sm data-starting-style:-translate-x-[calc(100%+1rem)] data-ending-style:-translate-x-[calc(100%+1rem)]',
  top: 'inset-x-2 top-2 max-h-[90dvh] data-starting-style:-translate-y-[calc(100%+1rem)] data-ending-style:-translate-y-[calc(100%+1rem)]',
  bottom:
    'inset-x-2 bottom-2 max-h-[90dvh] pb-[max(1.5rem,env(safe-area-inset-bottom))] data-starting-style:translate-y-[calc(100%+1rem)] data-ending-style:translate-y-[calc(100%+1rem)]',
} as const;

type SheetSide = keyof typeof SIDE_CLASS;

type SheetContentProps = WithClassName<SheetPrimitive.Popup.Props> & {
  side?: SheetSide;
  showCloseButton?: boolean;
  closeLabel?: string;
};

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  closeLabel = 'Close',
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop className={OVERLAY_BACKDROP} />
      <SheetPrimitive.Popup
        data-slot='sheet-content'
        data-side={side}
        className={cn(
          'bg-card text-card-foreground hairline-ring ring-border fixed z-50 flex flex-col gap-4 overflow-y-auto rounded-2xl p-6 shadow-xl shadow-black/8 outline-none',
          'transition-[translate,opacity] duration-300 ease-(--ease-drawer) data-ending-style:duration-200',
          SIDE_CLASS[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                className='text-muted-foreground absolute top-3 right-3'
              />
            }
          >
            <XIcon />
            <span className='sr-only'>{closeLabel}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-header'
      className={cn('flex flex-col gap-1.5 pr-8', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn('mt-auto flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: WithClassName<SheetPrimitive.Title.Props>) {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('text-lg leading-tight font-semibold', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: WithClassName<SheetPrimitive.Description.Props>) {
  return (
    <SheetPrimitive.Description
      data-slot='sheet-description'
      className={cn('text-muted-foreground text-[13px]', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
