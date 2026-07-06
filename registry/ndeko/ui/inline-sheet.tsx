'use client';

import { useRef } from 'react';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

export type InlineSheetSide = 'bottom' | 'start' | 'center';

export type InlineSheetCloser = 'button' | 'grip' | 'none';

/** How far the sheet has to be dragged down before letting go closes it. */
const CLOSE_AFTER_PX = 80;

/** A grip moved less than this was pressed, not dragged. */
const DRAG_SLACK_PX = 4;

const BACKDROP =
  'absolute inset-0 cursor-default bg-black/40 transition-opacity duration-200';

const BACKDROP_BLUR: Record<InlineSheetSide, string | undefined> = {
  bottom: undefined,
  start: undefined,
  center: 'backdrop-blur-xs',
};

const PANEL =
  'bg-card hairline-ring ring-border absolute rounded-2xl shadow-xl shadow-black/8';

const PANEL_PLACE: Record<InlineSheetSide, string> = {
  bottom:
    'inset-x-2 bottom-2 flex flex-col transition-[translate] duration-300 ease-(--ease-drawer)',
  start:
    'inset-y-2 start-2 flex w-[19rem] max-w-[calc(100%-3.5rem)] flex-col transition-[translate] duration-300 ease-(--ease-drawer)',
  center:
    'top-1/2 left-1/2 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto transition-[opacity,scale] duration-200 ease-(--ease-out-strong)',
};

const PANEL_OPEN: Record<InlineSheetSide, string> = {
  bottom: 'translate-y-0',
  start: 'translate-x-0',
  center: 'scale-100 opacity-100',
};

const PANEL_SHUT: Record<InlineSheetSide, string> = {
  bottom: 'translate-y-[calc(100%+1rem)]',
  start: '-translate-x-[calc(100%+1rem)]',
  center: 'scale-95 opacity-0 duration-150',
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

function panelStateOf(isOpen: boolean, side: InlineSheetSide) {
  if (isOpen) {
    return PANEL_OPEN[side];
  }
  return PANEL_SHUT[side];
}

/** A list opened from a field inside is drawn outside the sheet, yet its keys still reach the sheet: Escape there closes the list and nothing else. */
function isEscapeInside(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  const isInside =
    target instanceof Node && event.currentTarget.contains(target);
  return event.key === 'Escape' && isInside;
}

export type InlineSheetProps = {
  side: InlineSheetSide;
  isOpen: boolean;
  onClose: () => void;
  /** Names the dialog. */
  label?: string;
  /** The id of a heading inside that names the dialog, in place of `label`. */
  labelledBy?: string;
  /** The id of a line inside that describes the dialog. */
  describedBy?: string;
  /** Names the backdrop and the close control the sheet draws. */
  closeLabel: string;
  /**
   * The control drawn above the content: a close button, a grip that follows the finger and closes
   * the sheet when pulled far enough (a bottom sheet only), or none when the content brings its own.
   */
  closer?: InlineSheetCloser;
  /** Set as `data-sheet-close` on that control, so the opener can move the focus to it. */
  name?: string;
  /**
   * False when the caller leaves the rest of its container reachable while the sheet is open: the
   * dialog then does not tell assistive technology that everything else is out of reach.
   */
  isModal?: boolean;
  /** Classes of the layer: the container variant from which the sheet is gone, a z-index. */
  className?: string;
  /** Classes of the panel: its surface, padding, height and gap. */
  panelClassName?: string;
  children: React.ReactNode;
};

/**
 * A sheet or a dialog drawn inside its container, so a demonstration never opens a layer over the
 * page; it needs a positioned ancestor. Escape pressed inside it, its backdrop and its close control
 * call `onClose`. A demonstration may open it too, so the caller makes the page behind inert while it
 * is open and moves the focus in, and back to the opener, from a person's own action.
 */
export function InlineSheet({
  side,
  isOpen,
  onClose,
  label,
  labelledBy,
  describedBy,
  closeLabel,
  closer = 'button',
  name,
  isModal = true,
  className,
  panelClassName,
  children,
}: InlineSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pulled = useRef(0);
  const isBottom = side === 'bottom';
  const hasGripCloser = closer === 'grip';
  const showsGrip = hasGripCloser && isBottom;
  const showsButton = closer === 'button';

  function startPull(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    startY.current = event.clientY;
    pulled.current = 0;
  }

  function pull(event: React.PointerEvent<HTMLButtonElement>) {
    const panel = panelRef.current;
    const origin = startY.current;
    if (!panel || origin === null) {
      return;
    }
    const travelled = event.clientY - origin;
    const distance = Math.max(0, travelled);
    pulled.current = distance;
    panel.style.transition = 'none';
    panel.style.translate = `0 ${distance}px`;
  }

  function endPull() {
    const panel = panelRef.current;
    const wasPulling = startY.current !== null;
    startY.current = null;
    if (!panel || !wasPulling) {
      return;
    }
    panel.style.transition = '';
    panel.style.translate = '';
    if (pulled.current > CLOSE_AFTER_PX) {
      pulled.current = 0;
      onClose();
    }
  }

  function closeFromGrip() {
    const wasDragged = pulled.current > DRAG_SLACK_PX;
    pulled.current = 0;
    if (!wasDragged) {
      onClose();
    }
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isEscapeInside(event)) {
      onClose();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-20', className, layerOf(isOpen))}
    >
      <button
        type='button'
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className={cn(BACKDROP, BACKDROP_BLUR[side], backdropOf(isOpen))}
      />
      <div
        ref={panelRef}
        role='dialog'
        aria-modal={isModal}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cn(
          PANEL,
          PANEL_PLACE[side],
          panelClassName,
          panelStateOf(isOpen, side)
        )}
      >
        {showsGrip && (
          <button
            type='button'
            data-sheet-close={name}
            aria-label={closeLabel}
            onClick={closeFromGrip}
            onPointerDown={startPull}
            onPointerMove={pull}
            onPointerUp={endPull}
            onPointerCancel={endPull}
            className='group/grip flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none active:cursor-grabbing'
          >
            <span className='bg-foreground/20 group-focus-visible/grip:bg-primary h-1 w-9 rounded-full transition-colors duration-150' />
          </button>
        )}
        {showsButton && (
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
        )}
        {children}
      </div>
    </div>
  );
}
