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
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { LayoutGridIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';

import { DragOverlayCard, PersonAvatar } from './board-card';
import { BoardLane } from './board-lane';
import {
  detectBoardCollision,
  laneOf,
  moveAcrossLanes,
  reorderInLane,
  targetLaneOf,
} from './board-moves';
import {
  BOARD,
  type BoardCard,
  CARDS,
  COLUMNS,
  type Columns,
  LANES,
  type LaneId,
  PEOPLE,
} from './data';

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
    'To pick up a card, press Space or Enter. Use the arrow keys to move it between lanes and cards, Space or Enter to drop it, Escape to cancel.',
};

const BOARD_LABEL = `${BOARD.title}, ${BOARD.week}`;

function dropAnimationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return DROP_ANIMATION;
}

function laneTitleOf(laneId: LaneId | null) {
  const lane = LANES.find((candidate) => candidate.id === laneId);
  if (lane) {
    return lane.title;
  }
  return 'the board';
}

function cardTitleOf(cardId: UniqueIdentifier) {
  const card = CARDS[String(cardId)];
  return card.title;
}

function BoardHeader() {
  return (
    <div className='flex items-center gap-2.5 px-5 pt-4 pb-2'>
      <span className='gem-plate flex size-6 shrink-0 items-center justify-center rounded-md [--gem:var(--primary)]'>
        <LayoutGridIcon className='size-3.5' />
      </span>
      <p className='truncate text-sm font-medium'>{BOARD.title}</p>
      <Badge
        variant='secondary'
        className='text-muted-foreground hidden sm:inline-flex'
      >
        {BOARD.week}
      </Badge>
      <div className='ms-auto flex shrink-0 -space-x-1.5'>
        {PEOPLE.map((person) => (
          <PersonAvatar
            key={person.name}
            person={person}
            className='ring-card size-6 text-[10px] ring-2'
          />
        ))}
      </div>
    </div>
  );
}

export function BoardStage() {
  const [columns, setColumns] = useState<Columns>(COLUMNS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targetLaneId, setTargetLaneId] = useState<LaneId | null>(null);
  const columnsRef = useRef(columns);
  const snapshotRef = useRef<Columns | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const movedLaneRef = useRef(false);
  const dragX = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
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

  let activeCard: BoardCard | null = null;
  if (activeId) {
    activeCard = CARDS[activeId];
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
      return `Picked up ${cardTitleOf(active.id)} in ${laneTitleOf(lane)}`;
    },
    onDragOver({ active, over }) {
      if (!over) {
        return `${cardTitleOf(active.id)} is no longer over a lane`;
      }
      const lane = targetLaneOf(columnsRef.current, String(over.id));
      return `${cardTitleOf(active.id)} is over ${laneTitleOf(lane)}`;
    },
    onDragEnd({ active }) {
      const lane = laneOf(columnsRef.current, String(active.id));
      return `${cardTitleOf(active.id)} dropped in ${laneTitleOf(lane)}`;
    },
    onDragCancel({ active }) {
      return `Moving ${cardTitleOf(active.id)} was cancelled`;
    },
  };

  function handleDragStart({ active }: DragStartEvent) {
    const cardId = String(active.id);
    snapshotRef.current = columns;
    dragX.set(0);
    setActiveId(cardId);
    setTargetLaneId(laneOf(columns, cardId));
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
    const activeCardId = String(active.id);
    const overId = String(over.id);
    setColumns((previous) => reorderInLane(previous, activeCardId, overId));
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

  return (
    <section
      aria-label={BOARD_LABEL}
      className='bg-card hairline-ring ring-border overflow-hidden rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]'
    >
      <BoardHeader />
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
        <div className='relative overflow-x-auto overscroll-x-contain max-md:snap-x max-md:snap-proximity max-md:scroll-px-2'>
          <div className='grid h-[34rem] min-w-[42rem] grid-cols-3 grid-rows-[minmax(0,1fr)] gap-2 p-2 sm:h-[38rem]'>
            {LANES.map((lane) => (
              <BoardLane
                key={lane.id}
                lane={lane}
                cardIds={columns[lane.id]}
                isTarget={targetLaneId === lane.id}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={dropAnimationOf(shouldReduceMotion)}>
          {activeCard && <DragOverlayCard card={activeCard} dragX={dragX} />}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
