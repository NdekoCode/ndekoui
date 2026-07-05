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
import { useMotionValue } from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
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
  LANES,
  cardsOf,
  columnsOf,
  type BoardCard,
  type Columns,
  type LaneId,
} from './board-model';
import { TEAM_NAME, type Task } from './data';
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

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

type BoardPageProps = {
  tasks: Task[];
  onColumnsChange: (columns: Columns) => void;
  onCreateTask: (laneId: LaneId, title: string) => string;
};

export function BoardPage({
  tasks: sharedTasks,
  onColumnsChange,
  onCreateTask,
}: BoardPageProps) {
  const [columns, setColumns] = useState<Columns>(() => columnsOf(sharedTasks));
  const tasks = useMemo(() => cardsOf(sharedTasks), [sharedTasks]);
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
  const dragX = useMotionValue(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const dndContextId = useId();
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
  let activeTask: BoardCard | null = null;
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
    const currentColumns = columnsRef.current;
    if (!over) {
      onColumnsChange(currentColumns);
      return;
    }
    const activeTaskId = String(active.id);
    const overId = String(over.id);
    const nextColumns = reorderInLane(currentColumns, activeTaskId, overId);
    setColumns(nextColumns);
    onColumnsChange(nextColumns);
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

  const createTask = useCallback(
    (laneId: LaneId, title: string) => {
      const taskId = onCreateTask(laneId, title);
      setColumns((previous) => ({
        ...previous,
        [laneId]: [...previous[laneId], taskId],
      }));
      setNewTaskIds((previous) => new Set(previous).add(taskId));
    },
    [onCreateTask]
  );

  function openDefaultComposer() {
    setComposerLaneId(DEFAULT_COMPOSER_LANE);
  }

  return (
    <div className='flex min-h-0 w-full flex-1 flex-col'>
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
        id={dndContextId}
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
