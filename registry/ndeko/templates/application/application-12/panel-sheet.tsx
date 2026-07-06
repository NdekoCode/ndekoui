'use client';

import { useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

/** How far the sheet has to be dragged down before letting go closes it. */
const CLOSE_AFTER_PX = 80;

/** A grip moved less than this was pressed, not dragged. */
const DRAG_SLACK_PX = 4;

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

function panelOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-0';
  }
  return 'translate-y-[calc(100%+1rem)]';
}

type PanelSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** Drawn inside the template, so the demonstration never opens a layer over the rest of the page. */
export function PanelSheet({ isOpen, onClose, children }: PanelSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pulled = useRef(0);

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
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-20 @3xl:hidden', layerOf(isOpen))}
    >
      <button
        type='button'
        tabIndex={-1}
        aria-label='Close the work panel'
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-black/40 transition-opacity duration-200',
          backdropOf(isOpen)
        )}
      />
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='Work of the agent'
        className={cn(
          'bg-card hairline-ring ring-border absolute inset-x-2 bottom-2 flex h-[80%] flex-col rounded-2xl px-4 pb-4 shadow-xl shadow-black/8 transition-[translate] duration-300 ease-(--ease-drawer)',
          panelOf(isOpen)
        )}
      >
        <button
          type='button'
          data-panel-sheet-grip
          aria-label='Close the work panel'
          onClick={closeFromGrip}
          onPointerDown={startPull}
          onPointerMove={pull}
          onPointerUp={endPull}
          onPointerCancel={endPull}
          className='group/grip flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none active:cursor-grabbing'
        >
          <span className='bg-foreground/20 group-focus-visible/grip:bg-primary h-1 w-9 rounded-full transition-colors duration-150' />
        </button>
        {children}
      </div>
    </div>
  );
}
