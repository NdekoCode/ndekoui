'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReducedMotion } from 'motion/react';
import { memo } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { BoardCardBody, CARD_SURFACE, cardLabelOf } from './board-card';
import { CARDS, type Lane } from './data';

const SORT_TRANSITION = {
  duration: 220,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

function sortTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return SORT_TRANSITION;
}

function cardCountLabel(count: number) {
  if (count === 1) {
    return '1 card';
  }
  return `${count} cards`;
}

function LaneCount({ value }: { value: number }) {
  const label = cardCountLabel(value);

  return (
    <span className='bg-foreground/[0.06] text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-xs tabular-nums'>
      <span aria-hidden='true' className='inline-flex'>
        <MotionNumber value={value} />
      </span>
      <span className='sr-only'>{` ${label}`}</span>
    </span>
  );
}

function LaneTile({ lane }: { lane: Lane }) {
  const LaneGlyph = lane.icon;
  const tileStyle = { '--chip': lane.color } as React.CSSProperties;

  return (
    <span
      style={tileStyle}
      className='chip-3d flex size-5 shrink-0 items-center justify-center rounded-md'
    >
      <LaneGlyph className='size-3' strokeWidth={2.25} />
    </span>
  );
}

function SortableCard({ cardId }: { cardId: string }) {
  const card = CARDS[cardId];
  const shouldReduceMotion = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cardId,
    transition: sortTransitionOf(shouldReduceMotion),
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <li>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        aria-label={cardLabelOf(card)}
        className={cn(
          CARD_SURFACE,
          'focus-visible:ring-ring/25 cursor-grab touch-manipulation outline-none focus-visible:ring-[3px] active:cursor-grabbing',
          isDragging && 'opacity-40'
        )}
      >
        <BoardCardBody card={card} />
      </div>
    </li>
  );
}

type BoardLaneProps = {
  lane: Lane;
  cardIds: string[];
  isTarget: boolean;
};

/** Its body scrolls on its own, so the hero keeps its height whatever lane the cards end up in. */
export const BoardLane = memo(function BoardLane({
  lane,
  cardIds,
  isTarget,
}: BoardLaneProps) {
  const { setNodeRef } = useDroppable({ id: lane.id });
  const isEmpty = cardIds.length === 0;

  return (
    <div
      ref={setNodeRef}
      role='group'
      aria-label={lane.title}
      className={cn(
        'flex min-h-0 min-w-0 snap-start flex-col rounded-[calc(var(--radius-2xl)-0.5rem)] transition-colors duration-150',
        isTarget && 'bg-primary/[0.06]',
        !isTarget && 'bg-foreground/[0.04]'
      )}
    >
      <div className='flex h-11 shrink-0 items-center gap-2 px-3'>
        <LaneTile lane={lane} />
        <span className='min-w-0 truncate text-[13px] font-semibold'>
          {lane.title}
        </span>
        <LaneCount value={cardIds.length} />
      </div>
      <div className='flex min-h-0 flex-1 [scrollbar-width:thin] flex-col overflow-y-auto px-2 pt-1 pb-2'>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <ul className='flex flex-col gap-2'>
            {cardIds.map((cardId) => (
              <SortableCard key={cardId} cardId={cardId} />
            ))}
          </ul>
        </SortableContext>
        {isEmpty && (
          <div
            className={cn(
              'hairline-border text-muted-foreground flex h-20 items-center justify-center rounded-lg border-dashed px-3 text-center text-xs transition-colors duration-150',
              isTarget && 'border-primary/40',
              !isTarget && 'border-foreground/20'
            )}
          >
            Drop a card here
          </div>
        )}
      </div>
    </div>
  );
});
