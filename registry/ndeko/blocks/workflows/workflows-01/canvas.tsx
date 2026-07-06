'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { OUTPUT_IDS, type OutputId, type Step } from './data';
import {
  canConnect,
  neighbourOf,
  problemsOfStep,
  stepOf,
  type Graph,
  type Problem,
} from './graph';
import {
  draggedCellOf,
  GRID,
  moveOfKey,
  nudgedCellOf,
  stepAt,
  wirePathOf,
  type CanvasLayout,
  type Cell,
  type Orientation,
  type Point,
} from './layout';
import type { BuilderAction, Wire, Wiring } from './session';
import { StepCard, type Aim } from './step-card';
import { usePanZoom } from './use-pan-zoom';
import { HeldLayer, WireLayer } from './wires';
import { ZoomControl } from './zoom-control';

type Press = {
  kind: 'press';
  pointerId: number;
  stepId: string;
  origin: Cell;
  startX: number;
  startY: number;
  isTouch: boolean;
};

type Moving = {
  kind: 'move';
  pointerId: number;
  stepId: string;
  origin: Cell;
  startX: number;
  startY: number;
  cell: Cell;
};

type Wired = {
  kind: 'wire';
  pointerId: number;
  from: string;
  output: OutputId;
  aim: string | null;
};

/** What the pointers on the canvas are doing. A press has not yet chosen between a click, a move and a pan. */
type Gesture = { kind: 'pan' } | Press | Moving | Wired;

const MOUSE_SLOP = 4;

const TOUCH_SLOP = 8;

/** A finger held still this long on a step lifts it. A finger that moves first pans the canvas. */
const HOLD_MS = 220;

/** A wire lands on a step from this far around its card. */
const AIM_REACH = 14;

const FRAME = [
  'absolute inset-0 cursor-grab overflow-hidden rounded-xl outline-none select-none active:cursor-grabbing',
  'group-focus-within/canvas:touch-none',
].join(' ');

const GRID_LINES = [
  'pointer-events-none absolute inset-0 transition-opacity duration-200',
  '[--line:color-mix(in_oklab,var(--foreground)_8%,transparent)]',
  'bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)]',
].join(' ');

function outputOf(value: string | undefined) {
  const output = OUTPUT_IDS.find((candidate) => candidate === value);
  return output ?? null;
}

function slopOf(isTouch: boolean) {
  if (isTouch) {
    return TOUCH_SLOP;
  }
  return MOUSE_SLOP;
}

function gridToneOf(isShown: boolean) {
  if (isShown) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

/** A held wire only lives while something holds it: a pointer, or the demonstration. */
function heldWiringOf(isHeld: boolean, wiring: Wiring | null) {
  if (isHeld) {
    return wiring;
  }
  return null;
}

function aimOf(held: Wiring | null, graph: Graph, stepId: string): Aim {
  if (!held) {
    return 'idle';
  }
  if (held.from === stepId) {
    return 'source';
  }
  if (held.to === stepId) {
    return 'aimed';
  }
  if (canConnect(graph, held.from, stepId)) {
    return 'open';
  }
  return 'closed';
}

/** The output a wire leaves: the one being held, or the one the demonstration is pressing. */
function heldOutputOf(
  stepId: string,
  held: Wiring | null,
  pressed: string | null
) {
  if (held?.from === stepId) {
    return held.output;
  }
  const output = OUTPUT_IDS.find(
    (candidate) => pressed === `port-${stepId}-${candidate}`
  );
  return output ?? null;
}

/** The demonstration has no pointer, so its wire is drawn from its port to the step it aims at. */
function demoPathOf(
  held: Wiring | null,
  layout: CanvasLayout<Wire>,
  orientation: Orientation
) {
  if (!held || held.to === null) {
    return null;
  }
  const from = layout.places[held.from]?.outputs[held.output];
  const to = layout.places[held.to]?.input;
  if (!from || !to) {
    return null;
  }
  return wirePathOf(from, to, orientation);
}

function boxOf(layout: CanvasLayout<Wire>, id: string | null) {
  if (id === null) {
    return null;
  }
  return layout.places[id]?.box ?? null;
}

function inputOf(layout: CanvasLayout<Wire>, id: string | null) {
  if (id === null) {
    return null;
  }
  return layout.places[id]?.input ?? null;
}

function heldIdOf(isHeld: boolean, id: string | null) {
  if (isHeld) {
    return id;
  }
  return null;
}

function clientPointOf(event: React.PointerEvent<HTMLDivElement>): Point {
  return { x: event.clientX, y: event.clientY };
}

/**
 * The canvas owns the wheel and the touch gestures while it holds the focus. Some browsers do not
 * give the focus to a pressed button, so the frame takes it first.
 */
function engage(frame: HTMLDivElement) {
  if (!frame.contains(document.activeElement)) {
    frame.focus({ preventScroll: true });
  }
}

export type CanvasProps = {
  /** False until the builder knows how wide it is, and so which way the flow reads. */
  isLaidOut: boolean;
  label: string;
  /** What Fit brings into view, for its accessible name. */
  subject: string;
  hintId: string;
  inspectorId: string;
  steps: Step[];
  graph: Graph;
  problems: Problem[];
  layout: CanvasLayout<Wire>;
  orientation: Orientation;
  selectedId: string | null;
  isInspectorOpen: boolean;
  /** The share of the frame a sheet covers from the bottom. */
  covered: number;
  wiring: Wiring | null;
  isDemonstrating: boolean;
  pressed: string | null;
  onAction: (action: BuilderAction) => void;
  onOpen: (id: string, isFromKeyboard: boolean) => void;
  onRemove: (id: string) => void;
};

export function Canvas({
  isLaidOut,
  label,
  subject,
  hintId,
  inspectorId,
  steps,
  graph,
  problems,
  layout,
  orientation,
  selectedId,
  isInspectorOpen,
  covered,
  wiring,
  isDemonstrating,
  pressed,
  onAction,
  onOpen,
  onRemove,
}: CanvasProps) {
  const { frameRef, planeRef, view, isMeasured } = usePanZoom();
  const isReady = isMeasured && isLaidOut;
  const [movingId, setMovingId] = useState<string | null>(null);
  const [isPointerWiring, setIsPointerWiring] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const didDrag = useRef(false);
  const liveRef = useRef<SVGPathElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMoving = movingId !== null;
  const held = heldWiringOf(isDemonstrating || isPointerWiring, wiring);
  const demoWiring = heldWiringOf(!isPointerWiring, held);
  const demoPath = demoPathOf(demoWiring, layout, orientation);
  const isPinned = isInspectorOpen && !isMoving;
  const pinnedId = heldIdOf(isPinned, selectedId);
  const pinnedBox = boxOf(layout, pinnedId);

  useLayoutEffect(() => {
    view.setScene(layout.bounds, covered);
  }, [view, layout.bounds, covered]);

  useLayoutEffect(() => {
    view.pin(pinnedBox);
  }, [view, pinnedBox]);

  useLayoutEffect(() => {
    if (isReady) {
      view.settle();
    }
  }, [view, isReady, orientation, covered]);

  useEffect(() => {
    return () => clearTimeout(hold.current);
  }, []);

  useEffect(() => {
    if (!isMoving) {
      return;
    }
    function syncGrid() {
      const grid = gridRef.current;
      if (!grid) {
        return;
      }
      const zoom = view.zoom();
      const origin = view.origin();
      const cell = GRID[orientation];
      grid.style.backgroundSize = `${cell.x * zoom}px ${cell.y * zoom}px`;
      grid.style.backgroundPosition = `${origin.x}px ${origin.y}px`;
    }
    syncGrid();
    return view.subscribe(syncGrid);
  }, [view, isMoving, orientation]);

  function planePointOf(event: React.PointerEvent<HTMLDivElement>) {
    return view.toPlane(clientPointOf(event));
  }

  function aimAt(point: Point, from: string) {
    const id = stepAt(layout.places, point, AIM_REACH);
    if (id === null || !canConnect(graph, from, id)) {
      return null;
    }
    return id;
  }

  /** The wire ends on the pointer, or on the port of the step it would land on. */
  function drawLive(active: Wired, point: Point) {
    const from = layout.places[active.from]?.outputs[active.output];
    if (!from) {
      return;
    }
    const aim = aimAt(point, active.from);
    const end = inputOf(layout, aim) ?? point;
    liveRef.current?.setAttribute('d', wirePathOf(from, end, orientation));
    if (aim !== active.aim) {
      active.aim = aim;
      onAction({ type: 'wireAimed', to: aim });
    }
  }

  function clearLive() {
    liveRef.current?.removeAttribute('d');
  }

  function startWire(
    event: React.PointerEvent<HTMLDivElement>,
    from: string,
    output: OutputId
  ) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const active: Wired = {
      kind: 'wire',
      pointerId: event.pointerId,
      from,
      output,
      aim: null,
    };
    gesture.current = active;
    setIsPointerWiring(true);
    onAction({ type: 'wireStarted', from, output });
    drawLive(active, planePointOf(event));
  }

  function lift(press: Press) {
    clearTimeout(hold.current);
    frameRef.current?.setPointerCapture(press.pointerId);
    gesture.current = { ...press, kind: 'move', cell: press.origin };
    didDrag.current = true;
    setMovingId(press.stepId);
  }

  function liftIfStillPressed(pointerId: number) {
    const active = gesture.current;
    const isSamePress =
      active?.kind === 'press' && active.pointerId === pointerId;
    if (isSamePress) {
      lift(active);
    }
  }

  function startPress(event: React.PointerEvent<HTMLDivElement>, step: Step) {
    const isTouch = event.pointerType === 'touch';
    const pointerId = event.pointerId;
    gesture.current = {
      kind: 'press',
      pointerId,
      stepId: step.id,
      origin: { level: step.level, lane: step.lane },
      startX: event.clientX,
      startY: event.clientY,
      isTouch,
    };
    if (isTouch) {
      hold.current = setTimeout(() => liftIfStillPressed(pointerId), HOLD_MS);
    }
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    clearTimeout(hold.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind: 'pan' };
    view.grab(event.pointerId, clientPointOf(event));
  }

  /** A second finger turns a pan into a pinch, even when the first one came down on a step. */
  function joinGesture(
    event: React.PointerEvent<HTMLDivElement>,
    active: Gesture
  ) {
    const isTouchPress = active.kind === 'press' && active.isTouch;
    if (isTouchPress) {
      view.grab(active.pointerId, { x: active.startX, y: active.startY });
      event.currentTarget.setPointerCapture(active.pointerId);
      startPan(event);
      return;
    }
    if (active.kind === 'pan') {
      startPan(event);
    }
  }

  /** A press in the menu of a step reaches this handler through React, yet it is not on the canvas. */
  function startGesture(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target;
    const frame = event.currentTarget;
    const isMainButton = event.button === 0;
    const isOnCanvas = target instanceof Element && frame.contains(target);
    if (!isMainButton || !isOnCanvas) {
      return;
    }
    if (target.closest('[data-canvas-control]')) {
      return;
    }
    engage(frame);
    const active = gesture.current;
    if (active) {
      joinGesture(event, active);
      return;
    }
    didDrag.current = false;
    const card = target.closest<HTMLElement>('[data-step]');
    const step = stepOf(steps, card?.dataset.step ?? null);
    const port = target.closest<HTMLElement>('[data-port]');
    const output = outputOf(port?.dataset.port);
    if (step && output) {
      startWire(event, step.id, output);
      return;
    }
    if (step) {
      startPress(event, step);
      return;
    }
    startPan(event);
  }

  function movePress(event: React.PointerEvent<HTMLDivElement>, press: Press) {
    const dx = event.clientX - press.startX;
    const dy = event.clientY - press.startY;
    const distance = Math.hypot(dx, dy);
    if (distance < slopOf(press.isTouch)) {
      return;
    }
    if (press.isTouch) {
      startPan(event);
      return;
    }
    lift(press);
  }

  function moveStep(event: React.PointerEvent<HTMLDivElement>, move: Moving) {
    const zoom = view.zoom();
    const dx = (event.clientX - move.startX) / zoom;
    const dy = (event.clientY - move.startY) / zoom;
    const cell = draggedCellOf(orientation, move.origin, dx, dy);
    const isSameCell =
      cell.level === move.cell.level && cell.lane === move.cell.lane;
    if (isSameCell) {
      return;
    }
    move.cell = cell;
    onAction({ type: 'moved', id: move.stepId, cell });
  }

  function moveGesture(event: React.PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active) {
      return;
    }
    if (active.kind === 'pan') {
      view.drag(event.pointerId, clientPointOf(event));
      return;
    }
    if (event.pointerId !== active.pointerId) {
      return;
    }
    if (active.kind === 'wire') {
      drawLive(active, planePointOf(event));
      return;
    }
    if (active.kind === 'press') {
      movePress(event, active);
      return;
    }
    moveStep(event, active);
  }

  function endWire(action: BuilderAction) {
    clearLive();
    setIsPointerWiring(false);
    onAction(action);
  }

  function finishGesture(
    event: React.PointerEvent<HTMLDivElement>,
    wireAction: BuilderAction
  ) {
    const active = gesture.current;
    if (!active) {
      return;
    }
    if (active.kind === 'pan') {
      view.release(event.pointerId);
      if (!view.isHeld()) {
        gesture.current = null;
      }
      return;
    }
    if (event.pointerId !== active.pointerId) {
      return;
    }
    clearTimeout(hold.current);
    gesture.current = null;
    if (active.kind === 'wire') {
      endWire(wireAction);
      return;
    }
    if (active.kind === 'move') {
      setMovingId(null);
    }
  }

  function endGesture(event: React.PointerEvent<HTMLDivElement>) {
    finishGesture(event, { type: 'wireDropped' });
  }

  function cancelGesture(event: React.PointerEvent<HTMLDivElement>) {
    finishGesture(event, { type: 'wireCancelled' });
  }

  function cancelWire() {
    const active = gesture.current;
    if (active?.kind !== 'wire') {
      return;
    }
    const frame = frameRef.current;
    if (frame?.hasPointerCapture(active.pointerId)) {
      frame.releasePointerCapture(active.pointerId);
    }
    gesture.current = null;
    endWire({ type: 'wireCancelled' });
  }

  function focusStep(id: string) {
    const selector = `[data-step-button="${id}"]`;
    const button = frameRef.current?.querySelector<HTMLElement>(selector);
    button?.focus();
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      cancelWire();
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest<HTMLElement>('[data-step-button]');
    const step = stepOf(steps, button?.dataset.stepButton ?? null);
    if (!step) {
      return;
    }
    const isRemoval = event.key === 'Delete' || event.key === 'Backspace';
    if (isRemoval) {
      event.preventDefault();
      onRemove(step.id);
      return;
    }
    if (event.altKey) {
      const origin = { level: step.level, lane: step.lane };
      const cell = nudgedCellOf(orientation, origin, event.key);
      if (cell) {
        event.preventDefault();
        onAction({ type: 'moved', id: step.id, cell });
      }
      return;
    }
    const move = moveOfKey(orientation, event.key);
    if (!move) {
      return;
    }
    event.preventDefault();
    const nextId = neighbourOf(graph, step.id, move);
    if (nextId !== null) {
      onAction({ type: 'selected', id: nextId });
      focusStep(nextId);
    }
  }

  /** The click that ends a move belongs to the move. A click made with a key never does. */
  function openStep(id: string, isFromKeyboard: boolean) {
    const endsMove = didDrag.current && !isFromKeyboard;
    didDrag.current = false;
    if (endsMove) {
      return;
    }
    onOpen(id, isFromKeyboard);
  }

  /** A step that takes the focus from the keyboard is brought into view. A pressed one is already under the pointer. */
  function revealStep(id: string) {
    const box = boxOf(layout, id);
    const isPointerDown = gesture.current !== null;
    if (box && !isPointerDown) {
      view.reveal(box);
    }
  }

  return (
    <>
      <div
        ref={frameRef}
        role='group'
        aria-label={label}
        aria-describedby={hintId}
        data-canvas-frame
        tabIndex={-1}
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={cancelGesture}
        onLostPointerCapture={cancelGesture}
        onKeyDown={handleKeys}
        className={FRAME}
      >
        <div
          ref={gridRef}
          aria-hidden='true'
          className={cn(GRID_LINES, gridToneOf(isMoving))}
        />
        <div
          ref={planeRef}
          className={cn(
            'absolute top-0 left-0 origin-top-left',
            !isReady && 'invisible'
          )}
        >
          <WireLayer layout={layout} selectedId={selectedId} />
          {steps.map((step) => {
            const place = layout.places[step.id];
            if (!place) {
              return null;
            }
            const isSelected = step.id === selectedId;
            return (
              <StepCard
                key={step.id}
                step={step}
                place={place}
                graph={graph}
                problems={problemsOfStep(problems, step.id)}
                aim={aimOf(held, graph, step.id)}
                isSelected={isSelected}
                isOpen={isSelected && isInspectorOpen}
                isLifted={step.id === movingId}
                heldOutput={heldOutputOf(step.id, held, pressed)}
                inspectorId={inspectorId}
                onOpen={openStep}
                onReveal={revealStep}
                onAction={onAction}
                onRemove={onRemove}
              />
            );
          })}
          <HeldLayer demoPath={demoPath} liveRef={liveRef} />
        </div>
      </div>
      <ZoomControl view={view} subject={subject} />
    </>
  );
}
