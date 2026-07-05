'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Chip } from '@/registry/ndeko/ui/chip';

import { HEALTH_META, type Lead } from './data';
import { percentAmountOf, type Totals, type WorkstreamRow } from './figures';

const TABLE_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_2.75rem_2.75rem_3.5rem_minmax(5.5rem,1fr)_6rem]';

const WIDE_CELL = 'hidden sm:flex';

const FIGURE_CELL = 'hidden justify-end text-[13px] sm:flex';

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

function firstNameOf(lead: Lead) {
  const [firstName] = lead.name.split(' ');
  return firstName;
}

type FigureProps = {
  value: number;
  isQuiet?: boolean;
};

function Figure({ value, isQuiet }: FigureProps) {
  return (
    <MotionNumber
      value={value}
      className={cn(isQuiet && 'text-muted-foreground')}
    />
  );
}

type ProgressCellProps = {
  share: number;
  transition: Transition;
};

function ProgressCell({ share, transition }: ProgressCellProps) {
  const hiddenShare = 1 - share;
  const hiddenPercent = hiddenShare * 100;
  const offset = `-${hiddenPercent}%`;
  const shareAmount = percentAmountOf(share);

  return (
    <div role='cell' className={cn(WIDE_CELL, 'items-center gap-2')}>
      <span className='bg-foreground/[0.08] relative block h-1 min-w-0 flex-1 overflow-hidden rounded-full'>
        <motion.span
          initial={false}
          animate={{ x: offset }}
          transition={transition}
          className='bg-primary absolute inset-0 rounded-full'
        />
      </span>
      <MotionNumber
        value={shareAmount}
        suffix='%'
        className='text-muted-foreground w-9 justify-end text-xs'
      />
    </div>
  );
}

function LeadCell({ lead }: { lead: Lead }) {
  return (
    <div role='cell' className={cn(WIDE_CELL, 'min-w-0 items-center gap-2')}>
      <Avatar className='size-6 text-[10px]'>
        {lead.avatar && <AvatarImage src={lead.avatar} alt='' />}
        <AvatarFallback>{lead.initials}</AvatarFallback>
      </Avatar>
      <span className='truncate text-[13px]'>{firstNameOf(lead)}</span>
    </div>
  );
}

function HealthChip({ row }: { row: WorkstreamRow }) {
  const meta = HEALTH_META[row.health];

  return (
    <Chip color={meta.color}>
      <span aria-hidden='true' className='size-1.5 rounded-full bg-(--chip)' />
      {meta.label}
    </Chip>
  );
}

type WorkstreamTableProps = {
  rows: WorkstreamRow[];
  totals: Totals | null;
  emptyState?: React.ReactNode;
};

/** One grid for the header, the rows and the totals, so the figures line up. Rows enter and leave in place. */
export function WorkstreamTable({
  rows,
  totals,
  emptyState,
}: WorkstreamTableProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const transition = moveTransitionOf(shouldReduceMotion);

  return (
    <div role='table' aria-label='Workstreams' className='flex flex-col'>
      <div role='rowgroup'>
        <div
          role='row'
          className={cn(
            TABLE_GRID,
            'hairline-b border-border text-muted-foreground h-9 text-xs font-medium'
          )}
        >
          <span role='columnheader'>Workstream</span>
          <span role='columnheader' className={WIDE_CELL}>
            Lead
          </span>
          <span role='columnheader' className={FIGURE_CELL}>
            Done
          </span>
          <span role='columnheader' className={FIGURE_CELL}>
            Open
          </span>
          <span role='columnheader' className={FIGURE_CELL}>
            Blocked
          </span>
          <span role='columnheader' className={WIDE_CELL}>
            Progress
          </span>
          <span
            role='columnheader'
            className='flex justify-end sm:justify-start'
          >
            Health
          </span>
        </div>
      </div>
      <div role='rowgroup' className='hairline-divide-y divide-border'>
        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const isBlockFree = row.blocked === 0;
            const leadFirstName = firstNameOf(row.lead);
            const phoneLine = `${row.done} of ${row.planned} done · ${leadFirstName}`;

            return (
              <motion.div
                key={row.id}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <div role='row' className={cn(TABLE_GRID, 'min-h-12 py-2.5')}>
                  <div role='cell' className='flex min-w-0 flex-col gap-0.5'>
                    <span className='truncate text-[13px] font-medium'>
                      {row.name}
                    </span>
                    <span className='text-muted-foreground text-xs tabular-nums sm:hidden'>
                      {phoneLine}
                    </span>
                  </div>
                  <LeadCell lead={row.lead} />
                  <div role='cell' className={FIGURE_CELL}>
                    <Figure value={row.done} />
                  </div>
                  <div role='cell' className={FIGURE_CELL}>
                    <Figure value={row.open} />
                  </div>
                  <div role='cell' className={FIGURE_CELL}>
                    <Figure value={row.blocked} isQuiet={isBlockFree} />
                  </div>
                  <ProgressCell share={row.share} transition={transition} />
                  <div
                    role='cell'
                    className='flex justify-end sm:justify-start'
                  >
                    <HealthChip row={row} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {emptyState}
      {totals && (
        <div role='rowgroup'>
          <div
            role='row'
            className={cn(
              TABLE_GRID,
              'hairline-t border-border min-h-11 py-2.5 font-medium'
            )}
          >
            <span role='rowheader' className='text-[13px]'>
              All workstreams
            </span>
            <span role='cell' className={WIDE_CELL} />
            <div role='cell' className={FIGURE_CELL}>
              <Figure value={totals.done} />
            </div>
            <div role='cell' className={FIGURE_CELL}>
              <Figure value={totals.open} />
            </div>
            <div role='cell' className={FIGURE_CELL}>
              <Figure value={totals.blocked} />
            </div>
            <ProgressCell share={totals.share} transition={transition} />
            <span
              role='cell'
              className='text-muted-foreground flex justify-end text-xs tabular-nums sm:justify-start'
            >
              {`${totals.done} of ${totals.planned}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
