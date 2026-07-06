'use client';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

export type SheetSide = 'start' | 'bottom';

const PANEL_PLACE: Record<SheetSide, string> = {
  start: 'inset-y-2 start-2 w-[min(19rem,calc(100%-3.5rem))]',
  bottom: 'inset-x-2 bottom-2 h-[80%]',
};

const PANEL_SHUT: Record<SheetSide, string> = {
  start: '-translate-x-[calc(100%+1rem)]',
  bottom: 'translate-y-[calc(100%+1rem)]',
};

function layerOf(isOpen: boolean) {
  if (isOpen) {
    return undefined;
  }
  return 'pointer-events-none';
}

function backdropOf(isOpen: boolean) {
  if (isOpen) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function panelOf(isOpen: boolean, side: SheetSide) {
  if (isOpen) {
    return 'translate-x-0 translate-y-0';
  }
  return PANEL_SHUT[side];
}

type InlineSheetProps = {
  name: string;
  title: string;
  closeLabel: string;
  side: SheetSide;
  isOpen: boolean;
  /** The container variant from which the panel sits in the page and the sheet no longer exists. */
  hiddenFrom: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Drawn inside the template, so the demonstration never opens a layer over the rest of the page. */
export function InlineSheet({
  name,
  title,
  closeLabel,
  side,
  isOpen,
  hiddenFrom,
  onClose,
  children,
}: InlineSheetProps) {
  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-20', hiddenFrom, layerOf(isOpen))}
    >
      <button
        type='button'
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-black/40 transition-opacity duration-200',
          backdropOf(isOpen)
        )}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={cn(
          'bg-sidebar hairline-ring ring-border absolute flex flex-col gap-1 rounded-2xl p-3 shadow-xl shadow-black/8 transition-[translate] duration-300 ease-(--ease-drawer)',
          PANEL_PLACE[side],
          panelOf(isOpen, side)
        )}
      >
        <div className='flex shrink-0 justify-end'>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            data-sheet-close={name}
            aria-label={closeLabel}
            onClick={onClose}
            className='text-muted-foreground'
          >
            <XIcon />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
