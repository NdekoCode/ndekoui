'use client';

import {
  motion,
  type MotionValue,
  type Transition,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { memo } from 'react';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';

import { type BoardCard, DAY_NAMES, type Person } from './data';

export const CARD_SURFACE =
  'bg-card dark:bg-foreground/[0.05] rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.06)]';

const VELOCITY_RANGE = [-1400, 0, 1400];

const TILT_RANGE = [-5, 0, 5];

const TILT_SPRING = { stiffness: 380, damping: 26, mass: 0.6 };

const LIFT: Transition = { type: 'spring', bounce: 0, duration: 0.25 };

const INSTANT: Transition = { duration: 0 };

function initialsOf(name: string) {
  const words = name.split(' ');
  const letters = words.map((word) => word.charAt(0));
  return letters.join('');
}

function liftOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LIFT;
}

function liftScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 1.02;
}

export function cardLabelOf(card: BoardCard) {
  const dueDay = DAY_NAMES[card.due];
  return `${card.title}, ${card.label}, due ${dueDay}, owned by ${card.owner.name}`;
}

export function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage src={person.image} alt={person.name} />
      <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Memoised, so a drag re-renders only the thin sortable wrapper around it. */
export const BoardCardBody = memo(function BoardCardBody({
  card,
}: {
  card: BoardCard;
}) {
  return (
    <div className='flex flex-col gap-2.5 p-3'>
      <p className='line-clamp-2 text-[13px] leading-snug font-medium text-balance'>
        {card.title}
      </p>
      <div className='flex items-center gap-2'>
        <Badge variant='secondary' className='text-muted-foreground'>
          {card.label}
        </Badge>
        <span className='text-muted-foreground ms-auto flex items-center gap-1 text-xs tabular-nums'>
          <CalendarIcon className='size-3.5' />
          {card.due}
        </span>
        <PersonAvatar person={card.owner} className='size-5 text-[9px]' />
      </div>
    </div>
  );
});

type DragOverlayCardProps = {
  card: BoardCard;
  dragX: MotionValue<number>;
};

export function DragOverlayCard({ card, dragX }: DragOverlayCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const velocity = useVelocity(dragX);
  const tiltTarget = useTransform(velocity, VELOCITY_RANGE, TILT_RANGE, {
    clamp: true,
  });
  const tilt = useSpring(tiltTarget, TILT_SPRING);
  const noTilt = useTransform(tilt, () => 0);
  let rotate = tilt;
  if (shouldReduceMotion) {
    rotate = noTilt;
  }

  return (
    <motion.div
      style={{ rotate }}
      initial={{ scale: 1 }}
      animate={{ scale: liftScaleOf(shouldReduceMotion) }}
      transition={liftOf(shouldReduceMotion)}
      className='surface-raised cursor-grabbing rounded-lg'
    >
      <BoardCardBody card={card} />
    </motion.div>
  );
}
