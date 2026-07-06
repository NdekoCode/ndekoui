'use client';

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ARROW_OFFSET, GRID_CELL } from './canvas-frame';
import { EdgeLayer } from './edges';
import { outputLabelsOf, placementOf, walkOf } from './flow';
import { FlowStep, type StepActions } from './flow-step';
import { InsertButton } from './insert-button';
import { boxOf, type Box, type FlowLayout, type InsertPoint } from './layout';
import type { Workflow } from './model';
import { liveIdOf, type Run } from './run';
import { sampleOf } from './samples';
import { useFocusLater } from './use-focus-later';
import type { Viewport } from './use-viewport';
import { MAX_ZOOM, MIN_ZOOM } from './viewport';

/** The dots are drawn once on a layer large enough for the smallest zoom, then only moved. */
const GRID_SPARE_PX = GRID_CELL * MAX_ZOOM * 2;

const GRID_SIZE = `calc((100% + ${GRID_SPARE_PX}px) / ${MIN_ZOOM})`;

const GRID_STYLE = {
  width: GRID_SIZE,
  height: GRID_SIZE,
  backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
};

/**
 * The frame clips its plane without being a scroll container. A step that takes the focus outside
 * a frame that hides its overflow would scroll it, and the plane would no longer sit where the view
 * says. The plane stays hidden until the frame has been measured, so it never shows at the wrong place.
 */
const FRAME =
  'focus-visible:ring-ring/25 relative min-h-0 min-w-0 flex-1 cursor-grab touch-none self-stretch overflow-clip outline-none select-none focus-visible:ring-[3px] focus-visible:ring-inset active:cursor-grabbing [&:not([data-ready])_[data-plane]]:invisible';

type HistoryKey = 'undo' | 'redo';

function historyKeyOf(event: React.KeyboardEvent): HistoryKey | null {
  const hasModifier = event.ctrlKey || event.metaKey;
  if (!hasModifier) {
    return null;
  }
  const key = event.key.toLowerCase();
  if (key === 'y') {
    return 'redo';
  }
  if (key !== 'z') {
    return null;
  }
  if (event.shiftKey) {
    return 'redo';
  }
  return 'undo';
}

/** A step that waits shows its card beside it: the two have to be in view together. */
function boxWithCard(box: Box, viewport: Viewport): Box {
  const frame = viewport.frameRef.current;
  const card = frame?.querySelector<HTMLElement>('[data-approval-card]');
  if (!frame || !card) {
    return box;
  }
  const view = viewport.store.get();
  const bounds = frame.getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();
  const right = (cardBox.right - bounds.left - view.x) / view.zoom;
  const bottom = (cardBox.bottom - bounds.top - view.y) / view.zoom;
  const width = Math.max(box.width, right - box.x);
  const height = Math.max(box.height, bottom - box.y);
  return { ...box, width, height };
}

type CanvasProps = StepActions & {
  workflow: Workflow;
  layout: FlowLayout;
  viewport: Viewport;
  run: Run;
  selectedId: string | null;
  arrivedId: string | null;
  hasEdits: boolean;
  pressed: string | null;
  onRename: (id: string, name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
};

const NO_INSERTS: InsertPoint[] = [];

/** The points where a step can be added, by the step the keyboard reaches them after. */
function insertsByStepOf(layout: FlowLayout) {
  const byStep = new Map<string | null, InsertPoint[]>();
  for (const insert of layout.inserts) {
    const held = byStep.get(insert.afterId) ?? [];
    byStep.set(insert.afterId, [...held, insert]);
  }
  return byStep;
}

/**
 * The plane of the flow in its frame. The frame is a group named after the workflow and the steps
 * are a list of buttons in the order of the flow, so the plan reads without the picture. It draws
 * again when what it shows changes, never while the settings of a step are typed.
 */
export const Canvas = memo(function Canvas({
  workflow,
  layout,
  viewport,
  run,
  selectedId,
  arrivedId,
  hasEdits,
  pressed,
  onSelect,
  onRemove,
  onDuplicate,
  onRename,
  onInsert,
  onDecide,
  onUndo,
  onRedo,
}: CanvasProps) {
  const hintId = useId();
  const { frameRef, planeRef, gridRef } = viewport;
  const { startPan, pan, endPan, cancelPan, panBy, reveal } = viewport;
  const { focusNode } = useFocusLater(frameRef);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const latest = useRef({ layout, viewport });
  const lastToken = useRef(run.token);
  const placedSteps = useMemo(() => walkOf(workflow), [workflow]);
  const labels = useMemo(() => outputLabelsOf(workflow), [workflow]);
  const insertsByStep = useMemo(() => insertsByStepOf(layout), [layout]);
  const total = placedSteps.length;
  const sample = sampleOf(run.sampleId);
  const liveId = liveIdOf(run);
  const looseInserts = insertsByStep.get(null) ?? NO_INSERTS;
  const planeStyle = { width: layout.width, height: layout.height };

  useEffect(() => {
    latest.current = { layout, viewport };
  });

  /** A session that starts again goes back to the opening view. A new run is followed again. */
  useEffect(() => {
    const before = lastToken.current;
    lastToken.current = run.token;
    if (before === run.token) {
      return;
    }
    const current = latest.current;
    if (run.token === 0) {
      current.viewport.goHome();
      return;
    }
    current.viewport.startFollowing();
  }, [run.token]);

  useEffect(() => {
    if (liveId === null) {
      return;
    }
    const current = latest.current;
    const box = boxOf(current.layout, liveId);
    if (box) {
      const both = boxWithCard(box, current.viewport);
      current.viewport.follow(both);
    }
  }, [liveId]);

  useEffect(() => {
    if (arrivedId === null) {
      return;
    }
    const current = latest.current;
    const box = boxOf(current.layout, arrivedId);
    if (box) {
      current.viewport.reveal(box);
    }
  }, [arrivedId]);

  const revealStep = useCallback(
    (id: string) => {
      const box = boxOf(layout, id);
      if (box) {
        reveal(box);
      }
    },
    [layout, reveal]
  );

  const settleRename = useCallback(
    (id: string, name: string | null, isFromKey: boolean) => {
      setRenamingId(null);
      if (name !== null) {
        onRename(id, name);
      }
      if (isFromKey) {
        focusNode(id);
      }
    },
    [onRename, focusNode]
  );

  function playHistoryKey(key: HistoryKey) {
    if (key === 'undo') {
      onUndo();
      return;
    }
    onRedo();
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isTyping = event.target instanceof HTMLInputElement;
    const historyKey = historyKeyOf(event);
    if (historyKey !== null && !isTyping) {
      event.preventDefault();
      playHistoryKey(historyKey);
      return;
    }
    const isOnCanvas = event.target === event.currentTarget;
    if (!isOnCanvas) {
      return;
    }
    const offset = ARROW_OFFSET[event.key];
    if (offset) {
      event.preventDefault();
      panBy(offset.x, offset.y);
      return;
    }
    const isRemoveKey = event.key === 'Delete' || event.key === 'Backspace';
    if (isRemoveKey && selectedId !== null) {
      event.preventDefault();
      onRemove(selectedId);
    }
  }

  return (
    <div
      ref={frameRef}
      role='group'
      tabIndex={0}
      data-canvas-frame
      aria-label={`${workflow.name}, workflow canvas`}
      aria-describedby={hintId}
      onKeyDown={handleKeys}
      onPointerDown={startPan}
      onPointerMove={pan}
      onPointerUp={endPan}
      onPointerCancel={cancelPan}
      className={FRAME}
    >
      <div
        ref={gridRef}
        aria-hidden='true'
        style={GRID_STYLE}
        className='pointer-events-none absolute top-0 left-0 origin-top-left bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--foreground)_16%,transparent)_1px,transparent_1.5px)]'
      />
      <div
        ref={planeRef}
        data-plane
        style={planeStyle}
        className='absolute top-0 left-0 origin-top-left'
      >
        <EdgeLayer
          layout={layout}
          run={run}
          labels={labels}
          arrivedId={arrivedId}
          hasEdits={hasEdits}
        />
        <ol aria-label='Steps, in the order of the flow'>
          {placedSteps.map((placed) => {
            const stepId = placed.step.id;
            const box = boxOf(layout, stepId);
            if (!box) {
              return null;
            }
            return (
              <FlowStep
                key={stepId}
                placed={placed}
                total={total}
                box={box}
                inserts={insertsByStep.get(stepId) ?? NO_INSERTS}
                workflow={workflow}
                stepRun={run.steps[stepId]}
                sample={sample}
                isSelected={selectedId === stepId}
                isArrived={arrivedId === stepId}
                isRenaming={renamingId === stepId}
                pressed={pressed}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onInsert={onInsert}
                onDecide={onDecide}
                onReveal={revealStep}
                onStartRename={setRenamingId}
                onSettleRename={settleRename}
              />
            );
          })}
        </ol>
        {looseInserts.map((insert) => (
          <InsertButton
            key={insert.id}
            x={insert.x}
            y={insert.y}
            placement={placementOf(workflow, insert.at)}
            onPick={(entry) => onInsert(insert.at, entry)}
          />
        ))}
      </div>
      {total === 0 && (
        <p className='text-muted-foreground pointer-events-none absolute inset-x-6 top-1/2 text-center text-[13px]'>
          This workflow has no step. Add one from the palette, or with the plus
          above
        </p>
      )}
      <p id={hintId} className='sr-only'>
        The arrow keys move the canvas. Tab walks the steps in the order of the
        flow, Enter opens the setup of a step, Delete removes it
      </p>
    </div>
  );
});
