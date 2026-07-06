'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { CanvasPanel } from './canvas-panel';
import { capitalized } from './capitalized';
import { faceKeyOf, placementOf, structureKeyOf } from './flow';
import { Inspector } from './inspector';
import { layoutOf } from './layout';
import type { Workflow } from './model';
import { Palette } from './palette';
import { isBusy } from './run';
import { holdsForRun, LOOP_AFTER_MS, RESTING, SCRIPT } from './script';
import { hasUnsavedChanges, INITIAL, reducer } from './session';
import { TopBar } from './top-bar';
import {
  paletteTargetOf,
  useBuilderHandlers,
  type Backend,
} from './use-builder-handlers';
import { useKept } from './use-kept';
import { useRunClock } from './use-run-clock';
import { useViewport } from './use-viewport';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
  holdWhile: holdsForRun,
};

/** The width of the `@3xl` container variant: under it the inspector lives in a sheet. */
const INSPECTOR_SHEET_BELOW_REM = 48;

/** The width of the `@5xl` container variant: under it the palette lives in a sheet and the mini map is gone. */
const PALETTE_SHEET_BELOW_REM = 64;

/**
 * Nothing calls a network. A real backend plugs in here: a test run with its sample, a save, a
 * publish, the answer of a person to a step that asks first, and every change made to the flow.
 */
export type Application14Props = Backend & {
  onChange?: (workflow: Workflow) => void;
};

export default function Application14({
  onRun,
  onSave,
  onPublish,
  onApprove,
  onDeny,
  onChange,
}: Application14Props) {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const reported = useRef(state.workflow);
  const hasInspectorSheet = useIsNarrow(ref, INSPECTOR_SHEET_BELOW_REM);
  const hasPaletteSheet = useIsNarrow(ref, PALETTE_SHEET_BELOW_REM);
  const { workflow, run, selectedId } = state;
  const shownFlow = useKept(workflow, faceKeyOf(workflow));
  const structure = useKept(workflow, structureKeyOf(workflow));
  const layout = useMemo(() => layoutOf(structure), [structure]);
  const backend = { onRun, onSave, onPublish, onApprove, onDeny };
  const {
    echo,
    mintId,
    pickEntry,
    select,
    leaveInspector,
    openInspector,
    openPalette,
    closePalette,
    remove,
    duplicate,
    insert,
    renameStep,
    renameWorkflow,
    undo,
    redo,
    undoFromNotice,
    undoFromKeys,
    redoFromKeys,
    save,
    publish,
    startRun,
    runAgain,
    clearRun,
    decide,
  } = useBuilderHandlers(ref, {
    state,
    act,
    hasInspectorSheet,
    hasPaletteSheet,
    backend,
  });

  const deselect = useCallback(() => {
    act({ type: 'selected', id: null });
  }, [act]);

  const viewport = useViewport(layout, deselect, takeOver);

  const advanceRun = useCallback(
    (token: number, beat: number) => {
      act({ type: 'runAdvanced', token, beat });
    },
    [act]
  );

  useRunClock(run, workflow, isInView, advanceRun);

  /** The demonstration edits the sample flow on its own: only what a person changes is reported. */
  useEffect(() => {
    const hasChanged = reported.current !== workflow;
    reported.current = workflow;
    if (hasChanged && !isAutoplaying) {
      onChange?.(workflow);
    }
  }, [workflow, isAutoplaying, onChange]);

  const isPaletteShown = hasPaletteSheet && state.isPaletteOpen;
  const isInspectorShown = hasInspectorSheet && state.isInspectorOpen;
  const isBehindSheet = isPaletteShown || isInspectorShown;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const paletteTarget = paletteTargetOf(selectedId);
  const palettePlace = placementOf(workflow, paletteTarget);
  const placement = capitalized(palettePlace);

  const inspector = {
    workflow,
    savedWorkflow: state.savedWorkflow,
    selectedId,
    tab: state.tab,
    run,
    isActive: isInView,
    onAct: act,
    onMintId: mintId,
    onLeave: leaveInspector,
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-sidebar text-foreground @container/app min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] flex-col overflow-hidden'>
          <div inert={isBehindSheet} className='flex min-h-0 flex-1 flex-col'>
            <TopBar
              workflow={shownFlow}
              save={state.save}
              hasUnsavedChanges={hasUnsavedChanges(state)}
              isLive={state.isLive}
              isRunning={isBusy(run)}
              pressed={pressed}
              canReplay={canReplay}
              onReplay={restart}
              onRename={renameWorkflow}
              onSave={save}
              onPublish={publish}
              onRun={runAgain}
            />
            <div className='flex min-h-0 flex-1 gap-2 @3xl/app:px-2 @3xl/app:pb-2'>
              <aside
                aria-label='Steps to add'
                className='hidden w-56 shrink-0 px-1 pt-1 @5xl/app:flex'
              >
                {!hasPaletteSheet && (
                  <Palette
                    placement={placement}
                    pressed={pressed}
                    onPick={pickEntry}
                  />
                )}
              </aside>
              <CanvasPanel
                state={state}
                shownFlow={shownFlow}
                layout={layout}
                viewport={viewport}
                pressed={pressed}
                echo={echo}
                hasMiniMap={!hasPaletteSheet}
                onSelect={select}
                onRemove={remove}
                onDuplicate={duplicate}
                onInsert={insert}
                onDecide={decide}
                onRename={renameStep}
                onUndo={undo}
                onRedo={redo}
                onUndoNotice={undoFromNotice}
                onUndoKey={undoFromKeys}
                onRedoKey={redoFromKeys}
                onRun={startRun}
                onClearRun={clearRun}
                onOpenPalette={openPalette}
                onOpenInspector={openInspector}
              />
              <aside
                aria-label='Setup of the selected step'
                className='hidden w-72 shrink-0 @3xl/app:flex @6xl/app:w-80'
              >
                <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-h-0 min-w-0 flex-1 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                  {!hasInspectorSheet && (
                    <Inspector {...inspector} className='w-full' />
                  )}
                </div>
              </aside>
            </div>
          </div>

          <InlineSheet
            name='palette'
            label='Add a step'
            closeLabel='Close the palette'
            side='start'
            isOpen={isPaletteShown}
            className='@5xl/app:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closePalette}
          >
            {hasPaletteSheet && (
              <Palette
                placement={placement}
                pressed={pressed}
                onPick={pickEntry}
                className='flex-1'
              />
            )}
          </InlineSheet>
          <InlineSheet
            name='inspector'
            label='Step setup'
            closeLabel='Close the step setup'
            side='bottom'
            isOpen={isInspectorShown}
            className='@3xl/app:hidden'
            panelClassName='bg-sidebar h-[80%] gap-1 p-3'
            onClose={leaveInspector}
          >
            {hasInspectorSheet && (
              <Inspector {...inspector} className='flex-1' />
            )}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
