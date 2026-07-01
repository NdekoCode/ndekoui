'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { LayoutGridIcon, ZapIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Switch } from '@/registry/ndeko/ui/switch';

import {
  BOARD,
  type BoardCard,
  LANES,
  MOVING_CARD,
  PEOPLE,
  type Person,
  RULE,
} from './data';

const MOVE_INTERVAL_MS = 2800;

const DONE_LANE_INDEX = LANES.length - 1;

const CARD_SPRING: Transition = { type: 'spring', bounce: 0.12, duration: 0.7 };

const INSTANT: Transition = { duration: 0 };

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function nextLaneIndexOf(index: number) {
  const next = index + 1;
  return next % LANES.length;
}

function cardTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return CARD_SPRING;
}

function initialsOf(name: string) {
  const words = name.split(' ');
  const letters = words.map((word) => word.charAt(0));
  return letters.join('');
}

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function laneCountOf(cardCount: number, holdsMovingCard: boolean) {
  if (holdsMovingCard) {
    return cardCount + 1;
  }
  return cardCount;
}

function ruleStatusOf(hasRuleRun: boolean) {
  if (hasRuleRun) {
    return RULE.done;
  }
  return RULE.waiting;
}

function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage src={person.image} alt={person.name} />
      <AvatarFallback className='text-[10px]'>
        {initialsOf(person.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function BoardCardView({
  card,
  isMoving = false,
}: {
  card: BoardCard;
  isMoving?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-card dark:bg-foreground/[0.05] flex flex-col gap-2 rounded-lg p-2 shadow-[0_1px_2px_rgb(0_0_0/0.06)] sm:p-2.5',
        isMoving &&
          'hairline-ring ring-primary/45 shadow-[0_10px_24px_-10px_rgb(0_0_0/0.22)]'
      )}
    >
      <p className='line-clamp-2 text-xs leading-snug font-medium sm:text-[13px]'>
        {card.title}
      </p>
      <div className='flex items-center justify-between gap-1'>
        <Badge variant='secondary' className='text-muted-foreground'>
          {card.label}
        </Badge>
        <PersonAvatar
          person={card.owner}
          className='hidden size-5 sm:inline-flex'
        />
      </div>
    </div>
  );
}

function BoardHeader() {
  return (
    <div className='flex items-center gap-2.5 px-3 pt-3 sm:px-4 sm:pt-4'>
      <span className='gem-plate flex size-6 items-center justify-center rounded-md [--gem:var(--primary)]'>
        <LayoutGridIcon className='size-3.5' />
      </span>
      <p className='text-sm font-medium'>{BOARD.title}</p>
      <Badge
        variant='secondary'
        className='text-muted-foreground hidden sm:inline-flex'
      >
        {BOARD.week}
      </Badge>
      <div className='ms-auto flex -space-x-1.5'>
        {PEOPLE.map((person) => (
          <PersonAvatar
            key={person.name}
            person={person}
            className='ring-card size-6 ring-2'
          />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ hasRuleRun }: { hasRuleRun: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const status = ruleStatusOf(hasRuleRun);
  const swapVariants = swapVariantsOf(shouldReduceMotion);

  return (
    <div className='surface-raised motion-safe:animate-float absolute right-4 -bottom-6 hidden w-64 items-center gap-3 rounded-xl p-3 sm:flex lg:right-8'>
      <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
        <ZapIcon />
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='truncate text-[13px] font-medium'>{RULE.trigger}</p>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.p
            key={status}
            className='text-muted-foreground truncate text-xs'
            variants={swapVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {status}
          </motion.p>
        </AnimatePresence>
      </div>
      <Switch defaultChecked aria-label='Rule is on' />
    </div>
  );
}

export function BoardStage() {
  const [movingLaneIndex, setMovingLaneIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const cardTransition = cardTransitionOf(shouldReduceMotion);
  const hasRuleRun = movingLaneIndex === DONE_LANE_INDEX;

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }
    const interval = window.setInterval(() => {
      setMovingLaneIndex(nextLaneIndexOf);
    }, MOVE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div
      inert
      aria-hidden='true'
      className='bg-foreground/[0.025] relative rounded-2xl p-3 pb-10 sm:p-6 sm:pb-12'
    >
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-3 rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)] sm:gap-4'>
        <BoardHeader />
        <LayoutGroup id='heroes-02-board'>
          <div className='grid grid-cols-3 gap-2 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4'>
            {LANES.map((lane, index) => {
              const holdsMovingCard = index === movingLaneIndex;
              const count = laneCountOf(lane.cards.length, holdsMovingCard);

              return (
                <div
                  key={lane.id}
                  className='bg-foreground/[0.03] flex min-w-0 flex-col gap-2 rounded-lg p-1.5 sm:p-2'
                >
                  <div className='flex items-center justify-between gap-1 px-1 pt-0.5'>
                    <span className='truncate text-xs font-medium'>
                      {lane.title}
                    </span>
                    <Kbd>{count}</Kbd>
                  </div>
                  {holdsMovingCard && (
                    <motion.div
                      layoutId='heroes-02-moving-card'
                      transition={cardTransition}
                      className='relative z-10'
                    >
                      <BoardCardView card={MOVING_CARD} isMoving />
                    </motion.div>
                  )}
                  {lane.cards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout='position'
                      transition={cardTransition}
                    >
                      <BoardCardView card={card} />
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
      <RuleCard hasRuleRun={hasRuleRun} />
    </div>
  );
}
