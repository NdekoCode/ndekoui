'use client';

import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { dropIdOf } from './board-dnd';
import {
  COLUMNS,
  TITLE_MAX_LENGTH,
  type Card,
  type Column,
  type ColumnId,
  type LaneId,
} from './data';
import {
  cardsIn,
  cardsInCell,
  cardsOfLane,
  laneNameOf,
  lanesOf,
  overByOf,
  type BoardState,
  type View,
} from './session';
import { TaskCard } from './task-card';

const ALERT_IN = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

const ALERT_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function alertMotionOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return ALERT_FADE;
  }
  return ALERT_IN;
}

function cardsWordOf(count: number) {
  if (count === 1) {
    return '1 card';
  }
  return `${count} cards`;
}

function phraseOf(column: Column, count: number) {
  const over = overByOf(column, count);
  if (over > 0) {
    return `Over by ${over}`;
  }
  return `${count} of ${column.limit}`;
}

function spokenCountOf(column: Column, count: number) {
  const cards = cardsWordOf(count);
  const over = overByOf(column, count);
  if (over > 0) {
    return `${cards}, over its limit of ${column.limit} by ${over}`;
  }
  return `${cards}, limit ${column.limit}`;
}

/** On the board the header caps its column; above the lanes it stands alone. */
function headerShapeOf(view: View) {
  if (view === 'board') {
    return 'rounded-t-xl';
  }
  return 'rounded-xl';
}

function headerToneOf(isOver: boolean) {
  if (isOver) {
    return 'bg-warning/15';
  }
  return 'bg-foreground/[0.03]';
}

function countToneOf(isOver: boolean) {
  if (isOver) {
    return 'text-warning-foreground font-medium';
  }
  return 'text-muted-foreground';
}

type ColumnHeaderProps = {
  column: Column;
  count: number;
  view: View;
};

/** The signature of the board: past its limit, the header tints and its count rolls to Over by. */
function ColumnHeader({ column, count, view }: ColumnHeaderProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const alertMotion = alertMotionOf(shouldReduceMotion);
  const hasLimit = column.limit !== null;
  const overBy = overByOf(column, count);
  const isOver = overBy > 0;

  return (
    <div
      className={cn(
        'flex h-10 min-w-0 items-center gap-2 px-3 transition-colors duration-300 ease-(--ease-out-strong)',
        headerShapeOf(view),
        headerToneOf(isOver)
      )}
    >
      <span
        aria-hidden='true'
        className={cn('size-2 shrink-0 rounded-full', column.dot)}
      />
      <h2 className='min-w-0 truncate text-[13px] font-medium'>
        {column.name}
      </h2>
      <span
        className={cn(
          'ms-auto flex shrink-0 items-center gap-1 text-xs tabular-nums transition-colors duration-300',
          countToneOf(isOver)
        )}
      >
        <AnimatePresence initial={false}>
          {isOver && (
            <motion.span key='alert' className='flex' {...alertMotion}>
              <TriangleAlertIcon className='size-3.5' />
            </motion.span>
          )}
        </AnimatePresence>
        {hasLimit && (
          <WordRoll
            text={phraseOf(column, count)}
            value={count}
            accessibleText={spokenCountOf(column, count)}
          />
        )}
        {!hasLimit && (
          <span>
            <MotionNumber value={count} />
            <span className='sr-only'> cards</span>
          </span>
        )}
      </span>
    </div>
  );
}

function countIn(cards: Card[], column: ColumnId) {
  const inColumn = cardsIn(cards, column);
  return inColumn.length;
}

export function ColumnHeaders({ cards, view }: { cards: Card[]; view: View }) {
  return (
    <div className='grid grid-cols-4 gap-3'>
      {COLUMNS.map((column) => (
        <ColumnHeader
          key={column.id}
          column={column}
          count={countIn(cards, column.id)}
          view={view}
        />
      ))}
    </div>
  );
}

function targetToneOf(isOver: boolean) {
  if (isOver) {
    return 'bg-primary/[0.06] ring-2 ring-primary/25';
  }
  return undefined;
}

type DropAreaProps = {
  id: string;
  label: string;
  className: string;
  children: React.ReactNode;
};

/** A column or a cell takes a drop anywhere, even when it is empty. */
function DropArea({ id, label, className, children }: DropAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      role='group'
      aria-label={label}
      className={cn(
        'transition-[background-color,box-shadow] duration-150',
        className,
        targetToneOf(isOver)
      )}
    >
      {children}
    </div>
  );
}

type CardListProps = {
  cards: Card[];
  state: BoardState;
  placement: string;
  travel: Transition;
};

function CardList({ cards, state, placement, travel }: CardListProps) {
  return (
    <ul className='flex flex-col gap-2'>
      {cards.map((card) => (
        <li key={card.id}>
          <TaskCard
            card={card}
            placement={placement}
            travel={travel}
            isFresh={state.freshId === card.id}
          />
        </li>
      ))}
    </ul>
  );
}

type QuickAddProps = {
  column: Column;
  isOpen: boolean;
  text: string;
  onOpen: (column: ColumnId) => void;
  onClose: () => void;
  onType: (value: string) => void;
  onAdd: () => void;
};

/** Enter adds the card and keeps the field for the next one; Escape leaves. */
function QuickAdd({
  column,
  isOpen,
  text,
  onOpen,
  onClose,
  onType,
  onAdd,
}: QuickAddProps) {
  const hintId = useId();
  const fade = fadePresence();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd();
  }

  function leaveOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onClose();
  }

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      {isOpen && (
        <motion.form
          key='composer'
          noValidate
          onSubmit={submit}
          className='flex flex-col gap-1.5'
          {...fade}
        >
          <Input
            size='sm'
            data-composer={column.id}
            value={text}
            maxLength={TITLE_MAX_LENGTH}
            autoComplete='off'
            placeholder='Card title'
            aria-label={`New card in ${column.name}`}
            aria-describedby={hintId}
            onKeyDown={leaveOnEscape}
            onChange={(event) => onType(event.target.value)}
          />
          <p
            id={hintId}
            className='text-muted-foreground flex flex-wrap items-center gap-1 px-0.5 text-[11px]'
          >
            <Kbd>Enter</Kbd> adds <Kbd>Esc</Kbd> leaves
          </p>
        </motion.form>
      )}
      {!isOpen && (
        <motion.div key='add' {...fade}>
          <button
            type='button'
            data-add={column.id}
            onClick={() => onOpen(column.id)}
            className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-8 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]'
          >
            <PlusIcon className='size-4' />
            Add card
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type BoardColumnsProps = {
  state: BoardState;
  placement: string;
  travel: Transition;
  onOpenComposer: (column: ColumnId) => void;
  onCloseComposer: () => void;
  onTypeComposer: (value: string) => void;
  onAddCard: () => void;
};

export function BoardColumns({
  state,
  placement,
  travel,
  onOpenComposer,
  onCloseComposer,
  onTypeComposer,
  onAddCard,
}: BoardColumnsProps) {
  return (
    <div className='grid grid-cols-4 gap-3'>
      {COLUMNS.map((column) => {
        const cards = cardsIn(state.cards, column.id);
        const isEmpty = cards.length === 0;

        return (
          <DropArea
            key={column.id}
            id={dropIdOf(column.id)}
            label={column.name}
            className='bg-foreground/[0.03] relative flex min-h-48 flex-col gap-2 rounded-b-xl p-2'
          >
            <CardList
              cards={cards}
              state={state}
              placement={placement}
              travel={travel}
            />
            {isEmpty && (
              <p className='hairline-border border-foreground/20 text-muted-foreground flex h-16 items-center justify-center rounded-lg border-dashed px-3 text-center text-xs'>
                Drop a card here
              </p>
            )}
            <QuickAdd
              column={column}
              isOpen={state.composerColumn === column.id}
              text={state.composerText}
              onOpen={onOpenComposer}
              onClose={onCloseComposer}
              onType={onTypeComposer}
              onAdd={onAddCard}
            />
          </DropArea>
        );
      })}
    </div>
  );
}

function laneCountOf(cards: Card[], lane: LaneId) {
  const inLane = cardsOfLane(cards, lane);
  return inLane.length;
}

/** Nobody holds these cards yet: an empty dashed seat, since no one is there. */
function LaneMark({ lane }: { lane: LaneId }) {
  if (lane === 'unassigned') {
    return (
      <span
        aria-hidden='true'
        className='border-foreground/25 size-5 shrink-0 rounded-full border border-dashed'
      />
    );
  }
  return <Avatar seed={laneNameOf(lane)} className='size-5' />;
}

type SwimlanesProps = {
  state: BoardState;
  placement: string;
  travel: Transition;
};

/** One lane per person: a card dropped in another lane changes hands. */
export function Swimlanes({ state, placement, travel }: SwimlanesProps) {
  const lanes = lanesOf(state.cards);

  return (
    <div className='flex flex-col gap-4'>
      {lanes.map((lane) => {
        const laneName = laneNameOf(lane);
        const laneCount = laneCountOf(state.cards, lane);

        return (
          <section
            key={lane}
            aria-label={laneName}
            className='flex flex-col gap-2'
          >
            <h3 className='flex items-center gap-2 px-1 text-[13px] font-medium'>
              <LaneMark lane={lane} />
              {laneName}
              <span className='text-muted-foreground text-xs font-normal tabular-nums'>
                {cardsWordOf(laneCount)}
              </span>
            </h3>
            <div className='grid grid-cols-4 gap-3'>
              {COLUMNS.map((column) => (
                <DropArea
                  key={column.id}
                  id={dropIdOf(column.id, lane)}
                  label={`${column.name}, ${laneName}`}
                  className='bg-foreground/[0.03] flex min-h-16 flex-col rounded-xl p-2'
                >
                  <CardList
                    cards={cardsInCell(state.cards, column.id, lane)}
                    state={state}
                    placement={placement}
                    travel={travel}
                  />
                </DropArea>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
