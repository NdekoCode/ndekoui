'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { nodeIdOf, nodeOf, NODES, type NodeId, type Params } from './data';
import {
  nodeAt,
  wirePathOf,
  type GraphLayout,
  type Orientation,
  type Point,
} from './layout';
import { NodeCard, type Aim } from './node-card';
import { refusalOf, signatureOf, sourceOf } from './pipeline';
import type { GraphAction, NodeRun, Refused, Wire, Wiring } from './session';
import { usePanZoom } from './use-pan-zoom';
import {
  HeldLayer,
  typeColorOf,
  WireLayer,
  type HeldWire,
  type RefusedWire,
} from './wires';
import { ZoomControl } from './zoom-control';

type Wired = {
  kind: 'wire';
  pointerId: number;
  from: NodeId;
  aim: NodeId | null;
};

/** What the pointers on the canvas are doing: moving the view, or holding a wire out of a port. */
type Gesture = { kind: 'pan' } | Wired;

/** A wire lands on a node from this far around it. */
const AIM_REACH = 12;

const FRAME = [
  'absolute inset-0 cursor-grab overflow-hidden rounded-xl outline-none select-none active:cursor-grabbing',
  'group-focus-within/canvas:touch-none',
].join(' ');

/** A held wire only lives while something holds it: a pointer, or the demonstration. */
function heldWiringOf(isHeld: boolean, wiring: Wiring | null) {
  if (isHeld) {
    return wiring;
  }
  return null;
}

function aimOf(held: Wiring | null, wires: Wire[], id: NodeId): Aim {
  if (!held) {
    return 'idle';
  }
  if (held.from === id) {
    return 'source';
  }
  const canTake = refusalOf(wires, held.from, id) === null;
  const isUnder = held.to === id;
  if (isUnder && canTake) {
    return 'aimed';
  }
  if (isUnder) {
    return 'refusing';
  }
  if (canTake) {
    return 'open';
  }
  return 'closed';
}

/** The demonstration has no pointer, so its wire is drawn from its port to the node it aims at. */
function demoWireOf(
  held: Wiring | null,
  layout: GraphLayout<Wire>,
  orientation: Orientation
): HeldWire | null {
  if (!held || held.to === null) {
    return null;
  }
  const from = layout.places[held.from].output;
  const to = layout.places[held.to].input;
  if (!to) {
    return null;
  }
  return {
    path: wirePathOf(from, to, orientation),
    type: nodeOf(held.from).output,
  };
}

function refusedWireOf(
  refused: Refused | null,
  layout: GraphLayout<Wire>,
  orientation: Orientation
): RefusedWire | null {
  if (!refused) {
    return null;
  }
  const from = layout.places[refused.from].output;
  const target = layout.places[refused.to];
  const end = target.input ?? target.output;
  return { id: refused.id, path: wirePathOf(from, end, orientation), end };
}

function boxOf(layout: GraphLayout<Wire>, id: NodeId | null) {
  if (id === null) {
    return null;
  }
  return layout.places[id].box;
}

function inputOf(layout: GraphLayout<Wire>, id: NodeId | null) {
  if (id === null) {
    return null;
  }
  return layout.places[id].input;
}

/** A wire is never over the node it leaves. */
function otherThan(from: NodeId, found: NodeId | null) {
  if (found === from) {
    return null;
  }
  return found;
}

function clientPointOf(event: React.PointerEvent<HTMLDivElement>): Point {
  return { x: event.clientX, y: event.clientY };
}

/**
 * The canvas owns the wheel and the touch gestures while it holds the focus. Some browsers do not
 * give the focus to what is pressed, so the frame takes it first.
 */
function engage(frame: HTMLDivElement) {
  if (!frame.contains(document.activeElement)) {
    frame.focus({ preventScroll: true });
  }
}

export type CanvasProps = {
  /** False until the editor knows how wide it is, and so which way the pipeline reads. */
  isLaidOut: boolean;
  label: string;
  /** What Fit brings into view, for its accessible name. */
  subject: string;
  hintId: string;
  layout: GraphLayout<Wire>;
  orientation: Orientation;
  wires: Wire[];
  params: Params;
  runs: Record<NodeId, NodeRun>;
  /** The node a run is on, which the view follows. */
  runningId: NodeId | null;
  wiring: Wiring | null;
  refused: Refused | null;
  isDemonstrating: boolean;
  pressed: string | null;
  onAction: (action: GraphAction) => void;
  onRun: () => void;
};

export function Canvas({
  isLaidOut,
  label,
  subject,
  hintId,
  layout,
  orientation,
  wires,
  params,
  runs,
  runningId,
  wiring,
  refused,
  isDemonstrating,
  pressed,
  onAction,
  onRun,
}: CanvasProps) {
  const { frameRef, planeRef, view, isMeasured } = usePanZoom();
  const isReady = isMeasured && isLaidOut;
  const [isPointerWiring, setIsPointerWiring] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const isLocked = runningId !== null;
  const held = heldWiringOf(isDemonstrating || isPointerWiring, wiring);
  const demoWiring = heldWiringOf(!isPointerWiring, held);
  const demoWire = demoWireOf(demoWiring, layout, orientation);
  const refusedWire = refusedWireOf(refused, layout, orientation);
  const followedId = runningId ?? demoWiring?.to ?? refused?.to ?? null;
  const pinnedBox = boxOf(layout, followedId);

  useLayoutEffect(() => {
    view.setScene(layout.bounds, 0);
  }, [view, layout.bounds]);

  useLayoutEffect(() => {
    view.pin(pinnedBox);
  }, [view, pinnedBox]);

  useLayoutEffect(() => {
    if (isReady) {
      view.settle();
    }
  }, [view, isReady, orientation]);

  /** The wire ends on the pointer, or on the port of the node it is over. */
  function drawLive(active: Wired, client: Point) {
    const point = view.toPlane(client);
    const from = layout.places[active.from].output;
    const found = nodeAt(layout.places, point, AIM_REACH);
    const aim = otherThan(active.from, found);
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

  function startWire(event: React.PointerEvent<HTMLDivElement>, from: NodeId) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const active: Wired = {
      kind: 'wire',
      pointerId: event.pointerId,
      from,
      aim: null,
    };
    gesture.current = active;
    const live = liveRef.current;
    if (live) {
      live.style.stroke = typeColorOf(nodeOf(from).output);
    }
    setIsPointerWiring(true);
    onAction({ type: 'wireStarted', from });
    drawLive(active, clientPointOf(event));
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind: 'pan' };
    view.grab(event.pointerId, clientPointOf(event));
  }

  /** A press in the menu of a port reaches this handler through React, yet it is not on the canvas. */
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
      if (active.kind === 'pan') {
        startPan(event);
      }
      return;
    }
    const port = target.closest<HTMLElement>('[data-port]');
    const from = nodeIdOf(port?.dataset.port);
    if (from !== null && !isLocked) {
      startWire(event, from);
      return;
    }
    startPan(event);
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
    if (event.pointerId === active.pointerId) {
      drawLive(active, clientPointOf(event));
    }
  }

  function endWire(action: GraphAction) {
    clearLive();
    setIsPointerWiring(false);
    onAction(action);
  }

  function finishGesture(
    event: React.PointerEvent<HTMLDivElement>,
    wireAction: GraphAction
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
    gesture.current = null;
    endWire(wireAction);
  }

  function endGesture(event: React.PointerEvent<HTMLDivElement>) {
    finishGesture(event, { type: 'wireDropped' });
  }

  function cancelGesture(event: React.PointerEvent<HTMLDivElement>) {
    finishGesture(event, { type: 'wireCancelled' });
  }

  function cancelOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    const active = gesture.current;
    const isWiring = active?.kind === 'wire';
    if (event.key !== 'Escape' || !isWiring) {
      return;
    }
    const frame = event.currentTarget;
    if (frame.hasPointerCapture(active.pointerId)) {
      frame.releasePointerCapture(active.pointerId);
    }
    gesture.current = null;
    endWire({ type: 'wireCancelled' });
  }

  /** A node that takes the focus from the keyboard is brought into view. A pressed one is already under the pointer. */
  function revealNode(id: NodeId) {
    const isPointerDown = gesture.current !== null;
    if (!isPointerDown) {
      view.reveal(layout.places[id].box);
    }
  }

  return (
    <>
      <div
        ref={frameRef}
        role='group'
        aria-label={label}
        aria-describedby={hintId}
        tabIndex={-1}
        onPointerDown={startGesture}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={cancelGesture}
        onLostPointerCapture={cancelGesture}
        onKeyDown={cancelOnEscape}
        className={FRAME}
      >
        <div
          ref={planeRef}
          className={cn(
            'absolute top-0 left-0 origin-top-left',
            !isReady && 'invisible'
          )}
        >
          <WireLayer layout={layout} />
          {NODES.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              place={layout.places[node.id]}
              run={runs[node.id]}
              params={params}
              wires={wires}
              sourceId={sourceOf(wires, node.id)}
              signature={signatureOf(wires, params, node.id)}
              aim={aimOf(held, wires, node.id)}
              isOutputHeld={
                held?.from === node.id || pressed === `out-${node.id}`
              }
              isLocked={isLocked}
              isRetryPressed={pressed === 'retry'}
              onAction={onAction}
              onRun={onRun}
              onReveal={revealNode}
            />
          ))}
          <HeldLayer demo={demoWire} refused={refusedWire} liveRef={liveRef} />
          {refused && refusedWire && (
            <RefusalNote
              key={refused.id}
              at={refusedWire.end}
              reason={refused.reason}
            />
          )}
        </div>
      </div>
      <ZoomControl view={view} subject={subject} />
    </>
  );
}

type RefusalNoteProps = {
  at: Point;
  reason: string;
};

/**
 * Why the wire was refused, said where it was let go. It is drawn inside the canvas, hanging from
 * a point without width, so it never leaves the block nor widens the page.
 */
function RefusalNote({ at, reason }: RefusalNoteProps) {
  const noteStyle = { transform: `translate(${at.x}px, ${at.y - 14}px)` };

  return (
    <div style={noteStyle} className='absolute top-0 left-0 z-10 w-0'>
      <p className='surface-raised text-destructive-ink w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-lg px-2 py-1 text-xs leading-snug font-medium text-balance transition-opacity duration-150 starting:opacity-0'>
        {reason}
      </p>
    </div>
  );
}
