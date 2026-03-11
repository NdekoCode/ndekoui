'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMotionValue, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { BoardLane } from './board-lane';
import {
  detectBoardCollision,
  laneOf,
  moveAcrossLanes,
  reorderInLane,
  targetLaneOf,
} from './board-moves';
import {
  COLUMNS,
  LANES,
  TASKS,
  TASK_PREFIX,
  TEAM_NAME,
  type Columns,
  type LaneId,
  type Task,
} from './data';
import { OverlayCard } from './drag-overlay-card';

const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
};

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'To pick up a task, press Space or Enter. Use the arrow keys to move it between lanes and cards, Space or Enter to drop it, Escape to cancel.',
};

const DEFAULT_COMPOSER_LANE: LaneId = 'todo';

function dropAnimationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return DROP_ANIMATION;
}

function laneLabelOf(laneId: LaneId | null) {
  const lane = LANES.find((candidate) => candidate.id === laneId);
  if (lane) {
    return lane.label;
  }
  return 'the board';
}

function highestNumberOf(tasks: Record<string, Task>) {
  const numbers = Object.values(tasks).map((task) => {
    const digits = task.number.replace(/\D/g, '');
    return Number(digits);
  });
  return Math.max(0, ...numbers);
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

export default function Boards01() {
  const [columns, setColumns] = useState<Columns>(COLUMNS);
  const [tasks, setTasks] = useState<Record<string, Task>>(TASKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targetLaneId, setTargetLaneId] = useState<LaneId | null>(null);
  const [composerLaneId, setComposerLaneId] = useState<LaneId | null>(null);
  const [newTaskIds, setNewTaskIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const columnsRef = useRef(columns);
  const snapshotRef = useRef<Columns | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const movedLaneRef = useRef(false);
  const nextNumberRef = useRef(highestNumberOf(TASKS) + 1);
  const dragX = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allTaskIds = Object.values(columns).flat();
  const trackedCount = allTaskIds.filter(
    (taskId) => tasks[taskId].isTracked
  ).length;
  const taskCountText = countLabel(allTaskIds.length, 'task', 'tasks');
  const timerText = countLabel(trackedCount, 'timer running', 'timers running');
  const metaText = `${taskCountText} · ${timerText}`;
  let activeTask: Task | null = null;
  if (activeId) {
    activeTask = tasks[activeId];
  }

  useEffect(() => {
    columnsRef.current = columns;
    const frame = requestAnimationFrame(() => {
      movedLaneRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [columns]);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const hits = detectBoardCollision(args, columnsRef.current);
    if (hits.length > 0) {
      lastOverIdRef.current = hits[0].id;
      return hits;
    }
    if (movedLaneRef.current) {
      lastOverIdRef.current = args.active.id;
    }
    const lastOverId = lastOverIdRef.current;
    if (lastOverId) {
      return [{ id: lastOverId }];
    }
    return [];
  }, []);

  const announcements: Announcements = {
    onDragStart({ active }) {
      const lane = laneOf(columnsRef.current, String(active.id));
      return `Picked up ${tasks[String(active.id)].number} in ${laneLabelOf(lane)}`;
    },
    onDragOver({ active, over }) {
      if (!over) {
        return `${tasks[String(active.id)].number} is no longer over a lane`;
      }
      const lane = targetLaneOf(columnsRef.current, String(over.id));
      return `${tasks[String(active.id)].number} is over ${laneLabelOf(lane)}`;
    },
    onDragEnd({ active }) {
      const lane = laneOf(columnsRef.current, String(active.id));
      return `${tasks[String(active.id)].number} dropped in ${laneLabelOf(lane)}`;
    },
    onDragCancel({ active }) {
      return `Moving ${tasks[String(active.id)].number} was cancelled`;
    },
  };

  function handleDragStart({ active }: DragStartEvent) {
    const taskId = String(active.id);
    snapshotRef.current = columns;
    dragX.set(0);
    setActiveId(taskId);
    setTargetLaneId(laneOf(columns, taskId));
    setComposerLaneId(null);
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    dragX.set(delta.x);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) {
      return;
    }
    const overLane = targetLaneOf(columnsRef.current, String(over.id));
    setTargetLaneId(overLane);
    const fromLane = laneOf(columnsRef.current, String(active.id));
    const isOtherLane = fromLane !== overLane;
    if (!isOtherLane) {
      return;
    }
    movedLaneRef.current = true;
    setColumns((previous) => moveAcrossLanes(previous, active, over));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setTargetLaneId(null);
    snapshotRef.current = null;
    if (!over) {
      return;
    }
    const activeTaskId = String(active.id);
    const overId = String(over.id);
    setColumns((previous) => reorderInLane(previous, activeTaskId, overId));
  }

  function handleDragCancel() {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      setColumns(snapshot);
    }
    snapshotRef.current = null;
    setActiveId(null);
    setTargetLaneId(null);
  }

  const openComposer = useCallback((laneId: LaneId) => {
    setComposerLaneId(laneId);
  }, []);

  const closeComposer = useCallback(() => {
    setComposerLaneId(null);
  }, []);

  const createTask = useCallback((laneId: LaneId, title: string) => {
    const taskNumber = nextNumberRef.current;
    nextNumberRef.current = taskNumber + 1;
    const task: Task = {
      id: `task-${taskNumber}`,
      number: `${TASK_PREFIX}-${taskNumber}`,
      title,
      type: 'task',
      priority: 'medium',
      size: null,
      labels: [],
      assigneeIds: [],
      estimateMinutes: 0,
      workedMinutes: 0,
      isTracked: false,
    };
    setTasks((previous) => ({ ...previous, [task.id]: task }));
    setColumns((previous) => ({
      ...previous,
      [laneId]: [...previous[laneId], task.id],
    }));
    setNewTaskIds((previous) => new Set(previous).add(task.id));
  }, []);

  function openDefaultComposer() {
    setComposerLaneId(DEFAULT_COMPOSER_LANE);
  }

  return (
    <div className='bg-background text-foreground flex h-dvh min-h-0 w-full flex-col'>
      <div className='hairline-b border-border flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h1 className='truncate text-lg font-semibold'>{`${TEAM_NAME} board`}</h1>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {metaText}
          </span>
        </div>
        <Button onClick={openDefaultComposer} className='ml-auto'>
          <PlusIcon />
          Create task
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={MEASURING}
        accessibility={{
          announcements,
          screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
        }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className='min-h-0 flex-1 overflow-x-auto overscroll-x-contain max-md:snap-x max-md:snap-proximity max-md:scroll-px-4'>
          <div className='flex h-full w-max items-start gap-3 px-4 py-3 md:px-6'>
            {LANES.map((lane) => (
              <BoardLane
                key={lane.id}
                lane={lane}
                taskIds={columns[lane.id]}
                tasks={tasks}
                newTaskIds={newTaskIds}
                isTarget={targetLaneId === lane.id}
                isComposerOpen={composerLaneId === lane.id}
                emptyLine='Drop a task here or create one'
                onOpenComposer={openComposer}
                onCloseComposer={closeComposer}
                onCreateTask={createTask}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={dropAnimationOf(shouldReduceMotion)}>
          {activeTask && <OverlayCard task={activeTask} dragX={dragX} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
