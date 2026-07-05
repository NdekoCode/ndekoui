'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { LayoutGroup } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { formatCost } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { laneLabelOf, LANES, RUN_TITLE, type LaneId } from './data';
import { BoardLane } from './lane';
import {
  INITIAL,
  LOOP_AFTER_MS,
  placementOf,
  reducer,
  RESTING,
  REWORK_MS,
  REWORK_USD,
  SCRIPT,
  tasksIn,
  type BoardState,
  type LastMove,
} from './session';
import { CARD_SURFACE, TaskCardBody } from './task-card';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const MOUSE = { activationConstraint: { distance: 4 } };

const TOUCH = { activationConstraint: { delay: 180, tolerance: 6 } };

function totalCostOf(state: BoardState) {
  let total = 0;
  for (const task of state.tasks) {
    total += task.costUsd;
  }
  return total;
}

function tasksWordOf(count: number) {
  if (count === 1) {
    return '1 task';
  }
  return `${count} tasks`;
}

function moveLineOf(lastMove: LastMove | null) {
  if (!lastMove) {
    return '';
  }
  return `${lastMove.title} moved to ${laneLabelOf(lastMove.lane)}`;
}

function laneIdOf(value: unknown) {
  const lane = LANES.find((candidate) => candidate.id === value);
  return lane?.id ?? null;
}

/** The drop glides the card to its new place; reduced motion puts it there at once. */
function dropAnimationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return undefined;
}

export default function AgentOps08() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const groupId = useId();
  const dndId = useId();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE),
    useSensor(TouchSensor, TOUCH)
  );
  const placement = placementOf(state);
  const draggedTask = state.tasks.find((task) => task.id === draggedId);
  const totalCost = formatCost(totalCostOf(state));
  const meta = `${tasksWordOf(state.tasks.length)} · ${totalCost} so far`;
  const moveLine = moveLineOf(state.lastMove);
  const message = spokenUnless(isAutoplaying, moveLine);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** An agent takes a task that came back to Running, reworks it and asks again. */
  function reworkIfRunning(id: string, lane: LaneId) {
    if (lane !== 'running') {
      return;
    }
    const resubmit = () => act({ type: 'submitted', id, usd: REWORK_USD });
    schedule(resubmit, REWORK_MS);
  }

  function sendBack(id: string, note: string) {
    act({ type: 'sentBack', id, note });
    reworkIfRunning(id, 'running');
  }

  function move(id: string, to: LaneId) {
    act({ type: 'moved', id, to });
    reworkIfRunning(id, to);
    focusLater(`[data-card-menu="${id}"]`);
  }

  function startDrag({ active }: DragStartEvent) {
    setDraggedId(String(active.id));
  }

  function endDrag({ active, over }: DragEndEvent) {
    setDraggedId(null);
    const to = laneIdOf(over?.id);
    if (!to) {
      return;
    }
    const id = String(active.id);
    act({ type: 'dropped', id, to });
    reworkIfRunning(id, to);
  }

  function cancelDrag() {
    setDraggedId(null);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>
                {RUN_TITLE}
              </h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums'>
                {meta}
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the run'
            />
          </header>

          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onDragCancel={cancelDrag}
          >
            <LayoutGroup id={groupId}>
              <div className='grid grid-cols-1 gap-6 @3xl:min-h-[30rem] @3xl:grid-cols-3 @3xl:gap-3'>
                {LANES.map((lane) => (
                  <BoardLane
                    key={lane.id}
                    lane={lane}
                    tasks={tasksIn(state, lane.id)}
                    placement={placement}
                    pressed={pressed}
                    onApprove={(id) => act({ type: 'approved', id })}
                    onSendBack={sendBack}
                    onMove={move}
                  />
                ))}
              </div>
            </LayoutGroup>
            <DragOverlay dropAnimation={dropAnimationOf(shouldReduceMotion)}>
              {draggedTask && (
                <div className={cn(CARD_SURFACE, 'cursor-grabbing')}>
                  <TaskCardBody task={draggedTask} isOverlay />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
