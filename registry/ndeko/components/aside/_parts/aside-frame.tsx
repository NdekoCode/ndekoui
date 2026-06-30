'use client';

import { createContext, useContext } from 'react';

import { PanelsTopLeftIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/registry/ndeko/ui/sheet';

/** Where an aside's content is drawn: open in the page as a preview, or inside the real sheet. */
export type AsideHost = 'preview' | 'sheet';

const AsideHostContext = createContext<AsideHost>('preview');

export function useAsideHost() {
  return useContext(AsideHostContext);
}

export type AsideSide = 'left' | 'right';

const TITLE = 'text-lg leading-tight font-semibold';

const DESCRIPTION = 'text-muted-foreground text-[13px]';

/** The background of the surface the aside sits on, for parts that must cover what scrolls under them. */
export const ASIDE_SURFACE = 'bg-[var(--aside-surface)]';

type AsideTextProps = { className?: string; children: React.ReactNode };

export function AsideTitle({ className, children }: AsideTextProps) {
  const host = useAsideHost();
  if (host === 'sheet') {
    return <SheetTitle className={className}>{children}</SheetTitle>;
  }
  return <h2 className={cn(TITLE, className)}>{children}</h2>;
}

export function AsideDescription({ className, children }: AsideTextProps) {
  const host = useAsideHost();
  if (host === 'sheet') {
    return (
      <SheetDescription className={className}>{children}</SheetDescription>
    );
  }
  return <p className={cn(DESCRIPTION, className)}>{children}</p>;
}

/** The close button of the sheet's header. The preview has nothing to close, so it draws nothing. */
export function AsideCloseButton({
  label = 'Close panel',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const host = useAsideHost();
  if (host === 'preview') {
    return null;
  }
  return (
    <SheetClose
      render={
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={label}
          className={cn('text-muted-foreground', className)}
        />
      }
    >
      <XIcon />
    </SheetClose>
  );
}

type AsidePreviewProps = {
  /** The content, drawn twice: open in the page, and inside the sheet the trigger opens. */
  children: React.ReactNode;
  triggerLabel: string;
  side?: AsideSide;
  className?: string;
};

/** Shows an aside open and whole on the page, with a small trigger that slides the same content in as a real sheet. */
export function AsidePreview({
  children,
  triggerLabel,
  side = 'right',
  className,
}: AsidePreviewProps) {
  return (
    <div className='flex w-full flex-col items-center gap-4'>
      <AsideHostContext.Provider value='preview'>
        <div
          className={cn(
            'surface-raised flex w-full max-w-sm flex-col overflow-hidden rounded-2xl text-left [--aside-surface:var(--popover)]',
            className
          )}
        >
          {children}
        </div>
      </AsideHostContext.Provider>
      <Sheet>
        <SheetTrigger render={<Button variant='outline' size='sm' />}>
          <PanelsTopLeftIcon />
          {triggerLabel}
        </SheetTrigger>
        <SheetContent
          side={side}
          showCloseButton={false}
          className={cn('gap-0 p-0 [--aside-surface:var(--card)]', className)}
        >
          <AsideHostContext.Provider value='sheet'>
            {children}
          </AsideHostContext.Provider>
        </SheetContent>
      </Sheet>
    </div>
  );
}
