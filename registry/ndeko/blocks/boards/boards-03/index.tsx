'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { LayoutGroup } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import {
  boardCollision,
  boardKeyboardCoordinates,
  targetOf,
  type DropTarget,
} from './board-dnd';
import { BoardColumns, ColumnHeaders, Swimlanes } from './board-grid';
import { BOARD_NAME, COLUMNS, type Card, type ColumnId } from './data';
import {
  cardsIn,
  columnOf,
  INITIAL,
  laneNameOf,
  LOOP_AFTER_MS,
  placementOf,
  reducer,
  RESTING,
  SCRIPT,
  type View,
} from './session';
import { OverlayCard } from './task-card';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const MOUSE = { activationConstraint: { distance: 4 } };

const TOUCH = { activationConstraint: { delay: 180, tolerance: 6 } };

const KEYBOARD = { coordinateGetter: boardKeyboardCoordinates };

const INSTRUCTIONS = {
  draggable:
    'To pick up a card, press Space or Enter. The arrow keys move it to another column, or to another lane when the cards are grouped by person. Space or Enter drops it, Escape puts it back.',
};

const VIEWS: Segment<View>[] = [
  { value: 'board', label: 'Board' },
  { value: 'lanes', label: 'By person' },
];

function cardsWordOf(count: number) {
  if (count === 1) {
    return '1 card';
  }
  return `${count} cards`;
}

function limitsLineOf() {
  const limited = COLUMNS.filter((column) => column.limit !== null);
  const parts = limited.map((column) => `${column.name} ${column.limit}`);
  const list = parts.join(', ');
  return `Limits: ${list}`;
}

const LIMITS_LINE = limitsLineOf();

/** The drop glides the card to its new place; reduced motion puts it there at once. */
function dropAnimationOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return null;
  }
  return undefined;
}

/** On the board the headers cap their columns; above the lanes they stand apart. */
function bodyGapOf(view: View) {
  if (view === 'board') {
    return 'gap-0';
  }
  return 'gap-3';
}

function placeLineOf(target: DropTarget) {
  const column = columnOf(target.column).name;
  if (target.lane === undefined) {
    return column;
  }
  const lane = laneNameOf(target.lane);
  return `${column}, lane of ${lane}`;
}

/** Would one more card take the column past its limit? Said while the card hovers there. */
function limitHintOf(cards: Card[], cardId: string, column: ColumnId) {
  const target = columnOf(column);
  if (target.limit === null) {
    return '';
  }
  const inColumn = cardsIn(cards, column);
  const others = inColumn.filter((card) => card.id !== cardId);
  const countAfter = others.length + 1;
  if (countAfter <= target.limit) {
    return '';
  }
  return `, past its limit of ${target.limit}`;
}

export default function Boards03() {
  const { ref, isInView, isAutoplaying, state, act, isFinished, restart } =
    useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const groupId = useId();
  const dndId = useId();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE),
    useSensor(TouchSensor, TOUCH),
    useSensor(KeyboardSensor, KEYBOARD)
  );
  const placement = placementOf(state);
  const draggedCard = state.cards.find((card) => card.id === draggedId);
  const isBoard = state.view === 'board';
  const isLanes = state.view === 'lanes';
  const meta = `${cardsWordOf(state.cards.length)} · ${LIMITS_LINE}`;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function titleOf(id: UniqueIdentifier) {
    const card = state.cards.find((candidate) => candidate.id === id);
    return card?.title ?? 'The card';
  }

  function currentPlaceOf(id: UniqueIdentifier) {
    const card = state.cards.find((candidate) => candidate.id === id);
    if (!card) {
      return 'its column';
    }
    return columnOf(card.column).name;
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${titleOf(active.id)}, in ${currentPlaceOf(active.id)}`;
    },
    onDragOver({ active, over }) {
      const target = targetOf(over?.id);
      const title = titleOf(active.id);
      if (!target) {
        return `${title} is not over a column`;
      }
      const hint = limitHintOf(state.cards, String(active.id), target.column);
      return `${title} is over ${placeLineOf(target)}${hint}`;
    },
    onDragEnd({ active, over }) {
      const target = targetOf(over?.id);
      const title = titleOf(active.id);
      if (!target) {
        return `${title} went back to ${currentPlaceOf(active.id)}`;
      }
      return `${title} dropped in ${placeLineOf(target)}`;
    },
    onDragCancel({ active }) {
      return `Moving ${titleOf(active.id)} was cancelled. It is back in ${currentPlaceOf(active.id)}`;
    },
  };

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function startDrag({ active }: DragStartEvent) {
    setDraggedId(String(active.id));
  }

  function endDrag({ active, over }: DragEndEvent) {
    setDraggedId(null);
    const target = targetOf(over?.id);
    if (!target) {
      return;
    }
    act({
      type: 'moved',
      id: String(active.id),
      column: target.column,
      lane: target.lane,
      isDrop: true,
    });
  }

  function cancelDrag() {
    setDraggedId(null);
  }

  function changeView(view: View) {
    act({ type: 'viewChanged', view });
  }

  function openComposer(column: ColumnId) {
    act({ type: 'composerOpened', column });
    focusLater(`[data-composer="${column}"]`);
  }

  function closeComposer() {
    const column = state.composerColumn;
    act({ type: 'composerClosed' });
    if (column) {
      focusLater(`[data-add="${column}"]`);
    }
  }

  function typeComposer(value: string) {
    act({ type: 'composerTyped', value });
  }

  function addCard() {
    act({ type: 'cardAdded' });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-6'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 basis-56 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>
                {BOARD_NAME}
              </h1>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {meta}
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
            <Segments
              value={state.view}
              segments={VIEWS}
              label='Arrange the cards'
              onValueChange={changeView}
            />
          </header>

          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={boardCollision}
            accessibility={{
              announcements,
              screenReaderInstructions: INSTRUCTIONS,
            }}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            onDragCancel={cancelDrag}
          >
            <div className='relative -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 @3xl:mx-0 @3xl:px-0'>
              <div
                className={cn(
                  'flex min-w-[44rem] flex-col',
                  bodyGapOf(state.view)
                )}
              >
                <ColumnHeaders cards={state.cards} view={state.view} />
                <LayoutGroup id={groupId}>
                  {isBoard && (
                    <BoardColumns
                      state={state}
                      placement={placement}
                      travel={travel}
                      onOpenComposer={openComposer}
                      onCloseComposer={closeComposer}
                      onTypeComposer={typeComposer}
                      onAddCard={addCard}
                    />
                  )}
                  {isLanes && (
                    <Swimlanes
                      state={state}
                      placement={placement}
                      travel={travel}
                    />
                  )}
                </LayoutGroup>
              </div>
            </div>
            <DragOverlay dropAnimation={dropAnimationOf(shouldReduceMotion)}>
              {draggedCard && <OverlayCard card={draggedCard} />}
            </DragOverlay>
          </DndContext>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
