'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion, type Transition } from 'motion/react';
import { memo } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { Card } from './data';
import { columnOf, personOf } from './session';

export const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.04]';

const ARRIVAL = { opacity: 0, y: 4 };

const ARRIVAL_FADE = { opacity: 0 };

const SHOWN = { opacity: 1, y: 0 };

const LIFT: Transition = { type: 'spring', bounce: 0, duration: 0.25 };

const INSTANT: Transition = { duration: 0 };

function firstNameOf(name: string) {
  const [first] = name.split(' ');
  return first;
}

function holderOf(card: Card) {
  const person = personOf(card.assignee);
  if (person) {
    return person.name;
  }
  return 'Unassigned';
}

export function cardLabelOf(card: Card) {
  const column = columnOf(card.column).name;
  const holder = holderOf(card);
  return `${card.number} ${card.title}, ${holder}, in ${column}`;
}

/** A card added here arrives once; every other card is already there, whatever the view. */
function arrivalOf(isFresh: boolean, shouldReduceMotion: boolean) {
  if (!isFresh) {
    return false;
  }
  if (shouldReduceMotion) {
    return ARRIVAL_FADE;
  }
  return ARRIVAL;
}

type CardBodyProps = {
  card: Card;
};

/** The content of a card. Memoised, so a drag re-renders only the thin wrapper around it. */
export const CardBody = memo(function CardBody({ card }: CardBodyProps) {
  const person = personOf(card.assignee);
  const holder = holderOf(card);
  const firstName = firstNameOf(holder);

  return (
    <div className='flex flex-col gap-2 p-2.5'>
      <p className='line-clamp-2 text-[13px] leading-snug font-medium text-pretty'>
        {card.title}
      </p>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground font-mono text-[11px] tabular-nums'>
          {card.number}
        </span>
        <span className='ms-auto flex min-w-0 items-center gap-1.5'>
          {person && <Avatar seed={person.name} className='size-5' />}
          {!person && (
            <span
              aria-hidden='true'
              className='border-foreground/25 size-5 shrink-0 rounded-full border border-dashed'
            />
          )}
          <span className='text-muted-foreground truncate text-xs'>
            {firstName}
          </span>
        </span>
      </div>
    </div>
  );
});

type TaskCardProps = {
  card: Card;
  /** Where every card sits: the card measures itself again only when it changes. */
  placement: string;
  travel: Transition;
  isFresh: boolean;
};

/**
 * A card keeps its layout id across columns, lanes and views, so it glides to its new place. A
 * card a person dropped takes a new one: it is already where it was let go.
 */
export function TaskCard({ card, placement, travel, isFresh }: TaskCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <motion.div
      layout='position'
      layoutId={`${card.id}:${card.drops}`}
      layoutDependency={placement}
      transition={{ layout: travel }}
      initial={arrivalOf(isFresh, shouldReduceMotion)}
      animate={SHOWN}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-label={cardLabelOf(card)}
        className={cn(
          CARD_SURFACE,
          'focus-visible:ring-ring/25 cursor-grab touch-manipulation outline-none select-none focus-visible:ring-[3px] active:cursor-grabbing',
          isDragging && 'opacity-40'
        )}
      >
        <CardBody card={card} />
      </div>
    </motion.div>
  );
}

/** The card under the pointer: lifted on a raised surface while it travels. */
export function OverlayCard({ card }: { card: Card }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const lift = liftOf(shouldReduceMotion);

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: lift.scale }}
      transition={lift.transition}
      className='surface-raised cursor-grabbing rounded-lg'
    >
      <CardBody card={card} />
    </motion.div>
  );
}

function liftOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { scale: 1, transition: INSTANT };
  }
  return { scale: 1.02, transition: LIFT };
}
