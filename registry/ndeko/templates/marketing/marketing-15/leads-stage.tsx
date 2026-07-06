'use client';

import { AnimatePresence, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments } from '@/registry/ndeko/ui/segments';

import { LEADS, LEADS_SECTION, STAGE_FILTERS, type StageFilter } from './data';
import { LEAD_GRID, LeadRow } from './lead-row';
import {
  ariaSortOf,
  visibleLeadsOf,
  type LeadsView,
  type SortKey,
} from './leads';
import { SESSION, sortPressKeyOf } from './leads-session';

const SLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.35 };

const INSTANT: Transition = { duration: 0 };

function slideOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SLIDE;
}

function arrowOf(view: LeadsView, key: SortKey) {
  if (view.sortKey !== key) {
    return 'opacity-0';
  }
  if (view.direction === 'asc') {
    return 'opacity-100';
  }
  return 'rotate-180 opacity-100';
}

function toneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

type SortHeaderProps = {
  label: string;
  sortKey: SortKey;
  view: LeadsView;
  isPressed: boolean;
  onSort: (key: SortKey) => void;
};

function SortHeader({
  label,
  sortKey,
  view,
  isPressed,
  onSort,
}: SortHeaderProps) {
  const sortState = ariaSortOf(view, sortKey);
  const isActive = sortState !== 'none';

  function sort() {
    onSort(sortKey);
  }

  return (
    <div role='columnheader' aria-sort={sortState} className='flex justify-end'>
      <button
        type='button'
        onClick={sort}
        className={cn(
          'hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-[color,background-color,scale] duration-150 outline-none focus-visible:ring-[3px]',
          toneOf(isActive),
          pressedQuietOf(isPressed)
        )}
      >
        {label}
        <ArrowUpIcon
          className={cn(
            'size-3 transition-[rotate,opacity] duration-200 ease-(--ease-out-strong)',
            arrowOf(view, sortKey)
          )}
        />
      </button>
    </div>
  );
}

export function LeadsStage() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const leads = visibleLeadsOf(state);
  const orderKey = leads.map((lead) => lead.id).join(',');
  const transition = slideOf(shouldReduceMotion);
  const announcement = `${leads.length} of ${LEADS.length} leads shown`;
  const message = spokenUnless(isAutoplaying, announcement);
  useKeptHeight(ref);

  function filter(stage: StageFilter) {
    act({ type: 'filtered', stage });
  }

  function sort(key: SortKey) {
    act({ type: 'sorted', key });
  }

  return (
    <div
      ref={ref}
      className='bg-foreground/[0.03] @container/leads min-h-[40rem] rounded-2xl p-2 @3xl/leads:p-3'
    >
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex flex-wrap items-center gap-3 p-1'>
          <Segments
            value={state.stage}
            segments={STAGE_FILTERS}
            onValueChange={filter}
            label='Stage of the leads'
          />
          <p className='text-muted-foreground ms-auto text-xs tabular-nums'>
            <MotionNumber value={leads.length} /> of {LEADS.length} leads
          </p>
        </div>
        <div role='table' aria-label='Leads'>
          <div
            role='row'
            className={cn('text-muted-foreground h-9 text-xs', LEAD_GRID)}
          >
            <span role='columnheader'>Lead</span>
            <span role='columnheader' className='hidden @xl/leads:block'>
              Stage
            </span>
            <SortHeader
              label='Value'
              sortKey='value'
              view={state}
              isPressed={pressed === sortPressKeyOf('value')}
              onSort={sort}
            />
            <span role='columnheader' className='hidden @xl/leads:block'>
              Owner
            </span>
            <SortHeader
              label='Touched'
              sortKey='touch'
              view={state}
              isPressed={pressed === sortPressKeyOf('touch')}
              onSort={sort}
            />
          </div>
          <div role='rowgroup'>
            <AnimatePresence initial={false}>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  orderKey={orderKey}
                  transition={transition}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
        {leads.length === 0 && (
          <p className='text-muted-foreground p-3 text-[13px]'>
            No leads in this stage yet
          </p>
        )}
        <p className='text-muted-foreground px-3 pb-1 text-xs'>
          {LEADS_SECTION.note}
        </p>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
