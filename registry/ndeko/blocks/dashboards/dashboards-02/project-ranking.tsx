'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { DurationFigure } from './duration-figure';
import type { OtherProjects, RankedProject } from './figures';

const ROW_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const ROW_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const MOVE_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.77, 0, 0.175, 1],
};

const INSTANT: Transition = { duration: 0 };

const ROW_VARIANTS: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: ROW_OUT,
  },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: ROW_IN,
    transitionEnd: { overflow: 'visible' },
  },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: ROW_OUT },
  shown: { opacity: 1, transition: ROW_IN },
};

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_VARIANTS;
}

function moveTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MOVE_TRANSITION;
}

function meterToneOf(rank: number) {
  if (rank === 0) {
    return 'bg-primary';
  }
  return 'bg-foreground/25';
}

function otherLabelOf(count: number) {
  if (count === 1) {
    return '1 other project';
  }
  return `${count} other projects`;
}

function percentAmountOf(share: number) {
  const percent = share * 100;
  return Math.round(percent);
}

type ShareMeterProps = {
  share: number;
  tone: string;
  transition: Transition;
};

/** A thin meter whose fill slides into place, so its rounded end never stretches. */
function ShareMeter({ share, tone, transition }: ShareMeterProps) {
  const hiddenShare = 1 - share;
  const hiddenPercent = hiddenShare * 100;
  const offset = `-${hiddenPercent}%`;

  return (
    <span className='bg-foreground/[0.06] relative block h-1 overflow-hidden rounded-full'>
      <motion.span
        initial={false}
        animate={{ x: offset }}
        transition={transition}
        className={cn('absolute inset-0 rounded-full', tone)}
      />
    </span>
  );
}

type RankRowProps = {
  label: string;
  minutes: number;
  share: number;
  tone: string;
  transition: Transition;
  isMuted?: boolean;
};

function RankRow({
  label,
  minutes,
  share,
  tone,
  transition,
  isMuted,
}: RankRowProps) {
  const shareAmount = percentAmountOf(share);

  return (
    <div className='grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1.5 py-2'>
      <MotionNumber
        value={shareAmount}
        suffix='%'
        className='text-muted-foreground text-xs'
      />
      <span
        className={cn(
          'truncate text-[13px] font-medium',
          isMuted && 'text-muted-foreground font-normal'
        )}
      >
        {label}
      </span>
      <DurationFigure minutes={minutes} className='text-[13px]' />
      <span className='col-start-2 col-end-4'>
        <ShareMeter share={share} tone={tone} transition={transition} />
      </span>
    </div>
  );
}

type ProjectRankingProps = {
  rows: RankedProject[];
  other: OtherProjects | null;
  emptyLine: string;
};

/** Shares read as text first: percentage, name, a thin meter, the time. Rows travel when the ranking changes. */
export function ProjectRanking({
  rows,
  other,
  emptyLine,
}: ProjectRankingProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const moveTransition = moveTransitionOf(shouldReduceMotion);
  const isEmpty = rows.length === 0;
  const rowTransition = { layout: moveTransition };

  return (
    <div className='flex flex-col'>
      {isEmpty && (
        <p className='text-muted-foreground py-6 text-center text-[13px] text-balance'>
          {emptyLine}
        </p>
      )}
      <ol className='flex flex-col'>
        <AnimatePresence initial={false}>
          {rows.map((row, rank) => (
            <motion.li
              key={row.id}
              layout='position'
              variants={rowVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
              transition={rowTransition}
            >
              <RankRow
                label={row.name}
                minutes={row.minutes}
                share={row.share}
                tone={meterToneOf(rank)}
                transition={moveTransition}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <AnimatePresence initial={false}>
        {other && (
          <motion.div
            key='other'
            layout='position'
            variants={rowVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            transition={rowTransition}
          >
            <RankRow
              label={otherLabelOf(other.count)}
              minutes={other.minutes}
              share={other.share}
              tone='bg-foreground/15'
              transition={moveTransition}
              isMuted
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
