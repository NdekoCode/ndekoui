'use client';

import { createContext, useContext } from 'react';

import { SquareArrowOutUpRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';

/** Where a modal's content is drawn: open in the page as a preview, or inside the real dialog. */
export type ModalHost = 'preview' | 'dialog';

const ModalHostContext = createContext<ModalHost>('preview');

export function useModalHost() {
  return useContext(ModalHostContext);
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-[44rem]',
};

const TITLE = 'text-lg leading-tight font-semibold text-balance';

const DESCRIPTION = 'text-muted-foreground text-[13px]';

const BODY = 'flex flex-col gap-4';

type ModalTextProps = { className?: string; children: React.ReactNode };

export function ModalTitle({ className, children }: ModalTextProps) {
  const host = useModalHost();
  if (host === 'dialog') {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }
  return <h2 className={cn(TITLE, className)}>{children}</h2>;
}

export function ModalDescription({ className, children }: ModalTextProps) {
  const host = useModalHost();
  if (host === 'dialog') {
    return (
      <DialogDescription className={className}>{children}</DialogDescription>
    );
  }
  return <p className={cn(DESCRIPTION, className)}>{children}</p>;
}

/** Leaves room for the dialog's close button, so the preview and the dialog lay out the same. */
export function ModalHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />
  );
}

export function ModalFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

/** Closes the dialog. In the preview it stays a plain button that runs its own action, if any. */
export function ModalCloseButton({ children, ...props }: ButtonProps) {
  const host = useModalHost();
  if (host === 'dialog') {
    return <DialogClose render={<Button {...props} />}>{children}</DialogClose>;
  }
  return <Button {...props}>{children}</Button>;
}

type ModalPreviewProps = {
  /** The content, drawn twice: open in the page, and inside the dialog the trigger opens. */
  children: React.ReactNode;
  triggerLabel: string;
  size?: ModalSize;
  className?: string;
};

/** Shows a modal open and whole on the page, with a small trigger that opens the same content in the real dialog. */
export function ModalPreview({
  children,
  triggerLabel,
  size = 'md',
  className,
}: ModalPreviewProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <div className='flex w-full flex-col items-center gap-4'>
      <ModalHostContext.Provider value='preview'>
        <div
          className={cn(
            'surface-raised w-full rounded-2xl p-6 text-left',
            sizeClass,
            className
          )}
        >
          <AnimatedSize contentClassName={BODY}>{children}</AnimatedSize>
        </div>
      </ModalHostContext.Provider>
      <Dialog>
        <DialogTrigger render={<Button variant='outline' size='sm' />}>
          <SquareArrowOutUpRightIcon />
          {triggerLabel}
        </DialogTrigger>
        <DialogContent className={cn(sizeClass, className)}>
          <ModalHostContext.Provider value='dialog'>
            {children}
          </ModalHostContext.Provider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
