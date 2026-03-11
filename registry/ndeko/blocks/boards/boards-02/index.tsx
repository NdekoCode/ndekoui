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
import {
  AnimatePresence,
  motion,
  type Transition,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EllipsisIcon, EyeOffIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  activeFilterCountOf,
  matchesFilters,
  type Filters,
} from './board-filters';
import { BoardLane, type LaneMeta } from './board-lane';
import {
  detectBoardCollision,
  hiddenLaneOf,
  laneOf,
  moveAcrossLanes,
  moveToLaneEnd,
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
import { FilterMenu } from './filter-menu';
import { FilterPill } from './filter-pill';
import { HiddenColumns } from './hidden-columns';

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

const LANE_TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const LANE_EXIT = { opacity: 0, transition: { duration: 0.12 } };

const INITIAL_FILTERS: Filters = {
  priorities: ['urgent', 'high'],
  assigneeIds: [],
  labels: [],
};

const INITIAL_HIDDEN_LANES: LaneId[] = ['backlog'];

const NO_MATCH_LINE = 'No task here matches the filters';

const DROP_LINE = 'Drop a task here or create one';

function dropAnimationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return DROP_ANIMATION;
}

function laneTravelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LANE_TRAVEL;
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

function overLaneOf(columns: Columns, overId: string) {
  const hiddenLane = hiddenLaneOf(columns, overId);
  if (hiddenLane) {
    return hiddenLane;
  }
  return targetLaneOf(columns, overId);
}

/** A task created while filters are on takes the filtered values, so it stays in sight. */
function draftTaskOf(
  taskNumber: number,
  title: string,
  filters: Filters
): Task {
  const priority = filters.priorities[0] ?? 'medium';
  const assigneeIds = filters.assigneeIds.slice(0, 1);
  const labels = filters.labels.slice(0, 1);
  return {
    id: `task-${taskNumber}`,
    number: `${TASK_PREFIX}-${taskNumber}`,
    title,
    type: 'task',
    priority,
    size: null,
    labels,
    assigneeIds,
    estimateMinutes: 0,
    workedMinutes: 0,
    isTracked: false,
  };
}

function LaneMenu({
  lane,
  onHide,
}: {
  lane: LaneMeta;
  onHide: (laneId: LaneId) => void;
}) {
  function hideLane() {
    onHide(lane.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for the ${lane.label} column`}
            className='text-muted-foreground'
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuItem onClick={hideLane}>
          <EyeOffIcon />
          Hide column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function filteredColumnsOf(
  columns: Columns,
  tasks: Record<string, Task>,
  filters: Filters
): Columns {
  const entries = LANES.map((lane) => {
    const visibleIds = columns[lane.id].filter((taskId) =>
      matchesFilters(tasks[taskId], filters)
    );
    return [lane.id, visibleIds];
  });
  return Object.fromEntries(entries) as Columns;
}

function menusOf(onHide: (laneId: LaneId) => void) {
  const entries = LANES.map((lane) => [
    lane.id,
    <LaneMenu key={lane.id} lane={lane} onHide={onHide} />,
  ]);
  return Object.fromEntries(entries) as Record<LaneId, React.ReactNode>;
}

export default function Boards02() {
  const [columns, setColumns] = useState<Columns>(COLUMNS);
  const [tasks, setTasks] = useState<Record<string, Task>>(TASKS);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [hiddenLaneIds, setHiddenLaneIds] =
    useState<LaneId[]>(INITIAL_HIDDEN_LANES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targetLaneId, setTargetLaneId] = useState<LaneId | null>(null);
  const [composerLaneId, setComposerLaneId] = useState<LaneId | null>(null);
  const [newTaskIds, setNewTaskIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const columnsRef = useRef(columns);
  const filtersRef = useRef(filters);
  const snapshotRef = useRef<Columns | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const movedLaneRef = useRef(false);
  const nextNumberRef = useRef(highestNumberOf(TASKS) + 1);
  const dragX = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const laneTravel = laneTravelOf(shouldReduceMotion);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const visibleLanes = LANES.filter((lane) => !hiddenLaneIds.includes(lane.id));
  const hiddenLanes = LANES.filter((lane) => hiddenLaneIds.includes(lane.id));
  const hasHiddenLanes = hiddenLanes.length > 0;
  const allTaskIds = Object.values(columns).flat();
  const allTasks = allTaskIds.map((taskId) => tasks[taskId]);
  const boardTaskIds = visibleLanes.flatMap((lane) => columns[lane.id]);
  const boardTasks = boardTaskIds.map((taskId) => tasks[taskId]);
  const matchingTasks = boardTasks.filter((task) =>
    matchesFilters(task, filters)
  );
  const hasFilters = activeFilterCountOf(filters) > 0;
  let hiddenByFilters = 0;
  if (hasFilters) {
    hiddenByFilters = boardTasks.length - matchingTasks.length;
  }
  const taskCountText = countLabel(allTasks.length, 'task', 'tasks');
  const shownText = `${matchingTasks.length} shown`;
  let metaText = taskCountText;
  if (hasFilters) {
    metaText = `${taskCountText} · ${shownText}`;
  }
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

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const visibleColumns = useMemo(
    () => filteredColumnsOf(columns, tasks, filters),
    [columns, tasks, filters]
  );

  function emptyLineOf(laneId: LaneId) {
    const hasTasks = columns[laneId].length > 0;
    if (hasTasks) {
      return NO_MATCH_LINE;
    }
    return DROP_LINE;
  }

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
      const lane = overLaneOf(columnsRef.current, String(over.id));
      return `${tasks[String(active.id)].number} is over ${laneLabelOf(lane)}`;
    },
    onDragEnd({ active, over }) {
      let lane = laneOf(columnsRef.current, String(active.id));
      if (over) {
        lane = overLaneOf(columnsRef.current, String(over.id));
      }
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
    const overId = String(over.id);
    const hiddenLane = hiddenLaneOf(columnsRef.current, overId);
    if (hiddenLane) {
      setTargetLaneId(hiddenLane);
      return;
    }
    const overLane = targetLaneOf(columnsRef.current, overId);
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
    const hiddenLane = hiddenLaneOf(columnsRef.current, overId);
    if (hiddenLane) {
      setColumns((previous) =>
        moveToLaneEnd(previous, activeTaskId, hiddenLane)
      );
      return;
    }
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
    const task = draftTaskOf(taskNumber, title, filtersRef.current);
    setTasks((previous) => ({ ...previous, [task.id]: task }));
    setColumns((previous) => ({
      ...previous,
      [laneId]: [...previous[laneId], task.id],
    }));
    setNewTaskIds((previous) => new Set(previous).add(task.id));
  }, []);

  const hideLane = useCallback((laneId: LaneId) => {
    setHiddenLaneIds((previous) => [...previous, laneId]);
    setComposerLaneId(null);
  }, []);

  const laneMenus = useMemo(() => menusOf(hideLane), [hideLane]);

  function showLane(laneId: LaneId) {
    setHiddenLaneIds((previous) => previous.filter((id) => id !== laneId));
  }

  function clearFilters() {
    setFilters({ priorities: [], assigneeIds: [], labels: [] });
  }

  function openDefaultComposer() {
    const todoLane = visibleLanes.find((lane) => lane.id === 'todo');
    const firstLane = todoLane ?? visibleLanes[0];
    if (firstLane) {
      setComposerLaneId(firstLane.id);
    }
  }

  function hiddenCountOf(laneId: LaneId) {
    return columns[laneId].length;
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
        <div className='ml-auto flex items-center gap-2'>
          <FilterMenu
            tasks={allTasks}
            filters={filters}
            onChange={setFilters}
          />
          <Button onClick={openDefaultComposer}>
            <PlusIcon />
            Create task
          </Button>
        </div>
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
        <div className='relative flex min-h-0 flex-1 flex-col'>
          <div className='min-h-0 flex-1 overflow-x-auto overscroll-x-contain max-md:snap-x max-md:snap-proximity max-md:scroll-px-4'>
            <div className='flex h-full w-max items-start gap-3 px-4 py-3 md:px-6'>
              <AnimatePresence mode='popLayout' initial={false}>
                {visibleLanes.map((lane) => (
                  <motion.div
                    key={lane.id}
                    layout='position'
                    transition={laneTravel}
                    exit={LANE_EXIT}
                    className='flex max-h-full'
                  >
                    <BoardLane
                      lane={lane}
                      taskIds={visibleColumns[lane.id]}
                      tasks={tasks}
                      newTaskIds={newTaskIds}
                      isTarget={targetLaneId === lane.id}
                      isComposerOpen={composerLaneId === lane.id}
                      emptyLine={emptyLineOf(lane.id)}
                      menu={laneMenus[lane.id]}
                      onOpenComposer={openComposer}
                      onCloseComposer={closeComposer}
                      onCreateTask={createTask}
                    />
                  </motion.div>
                ))}
                {hasHiddenLanes && (
                  <motion.div
                    key='hidden-columns'
                    layout='position'
                    transition={laneTravel}
                    exit={LANE_EXIT}
                    className='flex'
                  >
                    <HiddenColumns
                      lanes={hiddenLanes}
                      countOf={hiddenCountOf}
                      targetLaneId={targetLaneId}
                      onShow={showLane}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <FilterPill hiddenCount={hiddenByFilters} onClear={clearFilters} />
        </div>
        <DragOverlay dropAnimation={dropAnimationOf(shouldReduceMotion)}>
          {activeTask && <OverlayCard task={activeTask} dragX={dragX} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
