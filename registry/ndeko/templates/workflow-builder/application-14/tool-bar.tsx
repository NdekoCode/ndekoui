'use client';

import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  RedoIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import type { Notice, RunTotals } from './session';
import { useZoomPercent, type Viewport } from './use-viewport';
import type { ViewStore } from './viewport';

/** Under a dollar a cost keeps three decimals, as in the rest of the kit. */
const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const SECONDS_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const DIVIDER = 'bg-border mx-0.5 h-4 w-(--hairline) shrink-0';

/** The only part of the tool bar that draws again while the canvas zooms. */
function ZoomValue({ store }: { store: ViewStore }) {
  const percent = useZoomPercent(store);

  return (
    <span className='text-muted-foreground w-10 shrink-0 text-center text-xs tabular-nums'>
      <span className='sr-only'>Zoom </span>
      {percent}%
    </span>
  );
}

const NO_TOTALS: RunTotals = { durationMs: 0, costUsd: 0 };

type RunFiguresProps = {
  lastRun: RunTotals | null;
  hasRunStarted: boolean;
};

/**
 * The figures of the last run that ended. They stand at zero while the first run plays and roll
 * once, when a run ends: a figure never ticks while a run is on its way.
 */
function RunFigures({ lastRun, hasRunStarted }: RunFiguresProps) {
  const hasFigures = lastRun !== null || hasRunStarted;
  if (!hasFigures) {
    return (
      <span className='text-muted-foreground px-1.5 text-xs'>No run yet</span>
    );
  }
  const totals = lastRun ?? NO_TOTALS;
  const seconds = totals.durationMs / 1000;

  return (
    <span className='flex items-center gap-2 px-1.5 text-xs'>
      <span className='sr-only'>Last run</span>
      <MotionNumber value={seconds} format={SECONDS_FORMAT} suffix='s' />
      <MotionNumber value={totals.costUsd} format={COST_FORMAT} />
      <Badge variant='secondary'>Illustrative</Badge>
    </span>
  );
}

/** A key that played Undo or Redo shows on its button, the way a press would. */
export type HistoryEcho = 'undo' | 'redo' | null;

type ToolBarProps = {
  viewport: Viewport;
  canUndo: boolean;
  canRedo: boolean;
  echo: HistoryEcho;
  notice: Notice | null;
  lastRun: RunTotals | null;
  hasRunStarted: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUndoNotice: () => void;
};

/**
 * Zoom, fit and history at the bottom of the canvas, then the figures of the last run. What just
 * happened shows in one line above it, with its way back: "Step removed, Undo".
 */
export const ToolBar = memo(function ToolBar({
  viewport,
  canUndo,
  canRedo,
  echo,
  notice,
  lastRun,
  hasRunStarted,
  onUndo,
  onRedo,
  onUndoNotice,
}: ToolBarProps) {
  const { store, zoomBy, fit } = viewport;
  const shouldReduceMotion = usePrefersReducedMotion();
  const noticePresence = risePresenceOf(shouldReduceMotion);

  return (
    <div
      data-solid
      data-canvas-overlay='bottom'
      className='pointer-events-auto flex max-w-full min-w-0 flex-col items-start gap-1.5'
    >
      <AnimatePresence initial={false}>
        {notice && (
          <motion.div
            key={notice.token}
            className='surface-raised flex max-w-full items-center gap-1 rounded-lg py-1 ps-2.5 pe-1 text-[13px]'
            {...noticePresence}
          >
            <span className='min-w-0 py-0.5 pe-1.5'>{notice.text}</span>
            {notice.canUndo && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={onUndoNotice}
                className='text-primary-ink h-6'
              >
                Undo
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        role='toolbar'
        aria-label='Canvas tools'
        className='bg-card hairline-ring ring-border flex max-w-full flex-wrap items-center gap-y-0.5 rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Zoom out'
          onClick={() => zoomBy(-1)}
          className='text-muted-foreground'
        >
          <ZoomOutIcon />
        </Button>
        <ZoomValue store={store} />
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Zoom in'
          onClick={() => zoomBy(1)}
          className='text-muted-foreground'
        >
          <ZoomInIcon />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-label='Fit the whole flow in view'
          onClick={fit}
          className='text-muted-foreground'
        >
          Fit
        </Button>
        <span aria-hidden='true' className={DIVIDER} />
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Undo'
          disabled={!canUndo}
          onClick={onUndo}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(echo === 'undo')
          )}
        >
          <UndoIcon />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Redo'
          disabled={!canRedo}
          onClick={onRedo}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(echo === 'redo')
          )}
        >
          <RedoIcon />
        </Button>
        <span aria-hidden='true' className={DIVIDER} />
        <RunFigures lastRun={lastRun} hasRunStarted={hasRunStarted} />
      </div>
    </div>
  );
});
