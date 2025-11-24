'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { OVERLAY_BACKDROP } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

const DIALOG_POPUP = [
  'fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto',
  'rounded-2xl bg-card p-6 text-card-foreground outline-none hairline-ring ring-border shadow-xl shadow-black/8',
  'transition-[opacity,scale] duration-200 ease-(--ease-out-strong) data-ending-style:duration-150',
  'data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
  'data-instant:transition-none',
].join(' ');

const DIALOG_BODY = 'flex flex-col gap-4';

type DialogContentProps = WithClassName<DialogPrimitive.Popup.Props> & {
  showCloseButton?: boolean;
  closeLabel?: string;
  /** Classes of the body that holds the children: its layout and gap. */
  contentClassName?: string;
  /** Animates the dialog's height when its content changes. On by default. */
  animateSize?: boolean;
  /** Opens and closes without motion, for a layer opened many times a day from the keyboard. */
  instant?: boolean;
};

function DialogBody({
  animateSize,
  className,
  children,
}: {
  animateSize: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (animateSize) {
    return (
      <AnimatedSize contentClassName={cn(DIALOG_BODY, className)}>
        {children}
      </AnimatedSize>
    );
  }
  return <div className={cn(DIALOG_BODY, className)}>{children}</div>;
}

function DialogContent({
  className,
  contentClassName,
  children,
  showCloseButton = true,
  closeLabel = 'Close',
  animateSize = true,
  instant = false,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot='dialog-backdrop'
        data-instant={instant || undefined}
        className={cn(OVERLAY_BACKDROP, 'data-instant:transition-none')}
      />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        data-instant={instant || undefined}
        className={cn(DIALOG_POPUP, className)}
        {...props}
      >
        <DialogBody animateSize={animateSize} className={contentClassName}>
          {children}
        </DialogBody>
        {showCloseButton && (
          <DialogPrimitive.Close
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
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('flex flex-col gap-1.5 pr-8 text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: WithClassName<DialogPrimitive.Title.Props>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn(
        'text-lg leading-tight font-semibold text-balance',
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: WithClassName<DialogPrimitive.Description.Props>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('text-muted-foreground text-[13px]', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
