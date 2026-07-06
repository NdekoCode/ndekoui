'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, SlidersIcon } from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';

import { Canvas } from './canvas';
import type { StepActions } from './flow-step';
import type { FlowLayout } from './layout';
import { MiniMap } from './mini-map';
import type { Workflow } from './model';
import { hasRun, isBusy } from './run';
import { SampleCard } from './sample-card';
import { otherSampleOf, sampleOf, type SampleId } from './samples';
import type { BuilderState } from './session';
import { ToolBar, type HistoryEcho } from './tool-bar';
import type { Viewport } from './use-viewport';

type CanvasPanelProps = StepActions & {
  state: BuilderState;
  /** The flow as the canvas shows it: the same object while only the settings of a step change. */
  shownFlow: Workflow;
  layout: FlowLayout;
  viewport: Viewport;
  pressed: string | null;
  echo: HistoryEcho;
  /** False on a page too narrow for it: the mini map only shows from 1024px of the template. */
  hasMiniMap: boolean;
  onRename: (id: string, name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUndoNotice: () => void;
  onUndoKey: () => void;
  onRedoKey: () => void;
  onRun: (sampleId: SampleId) => void;
  onClearRun: () => void;
  onOpenPalette: () => void;
  onOpenInspector: () => void;
};

/**
 * The canvas and what floats over it: the two buttons that open the sheets on a narrow page, the
 * sample email of a run at the top, the tool bar and the mini map at the bottom. What floats lets
 * a drag through to the canvas everywhere but on itself.
 */
export function CanvasPanel({
  state,
  shownFlow,
  layout,
  viewport,
  pressed,
  echo,
  hasMiniMap,
  onSelect,
  onRemove,
  onDuplicate,
  onInsert,
  onDecide,
  onRename,
  onUndo,
  onRedo,
  onUndoNotice,
  onUndoKey,
  onRedoKey,
  onRun,
  onClearRun,
  onOpenPalette,
  onOpenInspector,
}: CanvasPanelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const cardPresence = risePresenceOf(shouldReduceMotion);
  const { run, selectedId } = state;
  const sample = sampleOf(run.sampleId);
  const isRunning = isBusy(run);
  const editCount = state.past.length + state.future.length;

  return (
    <main className='bg-background @3xl/app:hairline-ring @3xl/app:ring-border @container/canvas relative flex min-w-0 flex-1 overflow-hidden @3xl/app:rounded-xl @3xl/app:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Canvas
        workflow={shownFlow}
        layout={layout}
        viewport={viewport}
        run={run}
        selectedId={selectedId}
        arrivedId={state.arrivedId}
        hasEdits={editCount > 0}
        pressed={pressed}
        onSelect={onSelect}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onRename={onRename}
        onInsert={onInsert}
        onDecide={onDecide}
        onUndo={onUndoKey}
        onRedo={onRedoKey}
      />
      <div className='pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-2'>
        <div
          data-canvas-overlay='top'
          className='flex w-full items-center justify-between gap-2 @5xl/app:hidden'
        >
          <Button
            type='button'
            variant='outline'
            size='sm'
            data-sheet-open='palette'
            aria-haspopup='dialog'
            onClick={onOpenPalette}
            className='pointer-events-auto'
          >
            <PlusIcon />
            Add step
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-haspopup='dialog'
            onClick={onOpenInspector}
            className='pointer-events-auto @3xl/app:hidden'
          >
            <SlidersIcon />
            Step setup
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {hasRun(run) && (
            <motion.div
              key='sample'
              className='w-full max-w-[19rem]'
              {...cardPresence}
            >
              <SampleCard
                sample={sample}
                other={otherSampleOf(sample.id)}
                isRunning={isRunning}
                pressed={pressed}
                onRun={onRun}
                onClear={onClearRun}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className='pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3'>
        <ToolBar
          viewport={viewport}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          echo={echo}
          notice={state.notice}
          lastRun={state.lastRun}
          hasRunStarted={hasRun(run)}
          onUndo={onUndo}
          onRedo={onRedo}
          onUndoNotice={onUndoNotice}
        />
        {hasMiniMap && (
          <MiniMap
            layout={layout}
            viewport={viewport}
            run={run}
            selectedId={selectedId}
            className='hidden shrink-0 @5xl/app:block'
          />
        )}
      </div>
    </main>
  );
}
