'use client';

import { LayoutGroup, motion, type Transition } from 'motion/react';
import { useId, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  COHORT_ROWS,
  WEEK_AVERAGES,
  WEEKS,
  cellKeyOf,
  cellTextOf,
  formatCount,
  movedSelection,
  percentOf,
  sameSelection,
  shadeOf,
  weekLabelOf,
  type Cohort,
  type CohortCell,
  type Selection,
} from './cohort-model';
import type { DisplayMode } from './data';

const RING_TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const STICKY_HEADER =
  'bg-card dark:bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))] sticky start-0 z-10';

function ringTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return RING_TRAVEL;
}

function tabIndexOf(isSelected: boolean) {
  if (isSelected) {
    return 0;
  }
  return -1;
}

function cellLabelOf(cohort: Cohort, cell: CohortCell) {
  const week = weekLabelOf(cell.week);
  const percent = percentOf(cell.rate);
  const customers = formatCount(cell.retained);
  return `${cohort.label} cohort, ${week}: ${percent}% still subscribed, ${customers} customers`;
}

type CohortTableProps = {
  mode: DisplayMode;
  selection: Selection;
  onSelect: (selection: Selection) => void;
};

export function CohortTable({ mode, selection, onSelect }: CohortTableProps) {
  const layoutGroupId = useId();
  const tableRef = useRef<HTMLTableElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const ringTransition = ringTransitionOf(shouldReduceMotion);

  function focusCell(next: Selection) {
    const key = cellKeyOf(next);
    const table = tableRef.current;
    const button = table?.querySelector<HTMLButtonElement>(
      `[data-cell="${key}"]`
    );
    button?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const next = movedSelection(selection, event.key);
    if (!next) {
      return;
    }
    event.preventDefault();
    if (sameSelection(next, selection)) {
      return;
    }
    onSelect(next);
    window.requestAnimationFrame(() => focusCell(next));
  }

  return (
    <motion.div layoutScroll className='-mx-1 overflow-x-auto px-1 pb-1'>
      <LayoutGroup id={layoutGroupId}>
        <table
          ref={tableRef}
          className='w-full min-w-[640px] border-separate border-spacing-1 text-xs tabular-nums'
        >
          <caption className='sr-only'>
            Share of each weekly sign-up cohort still subscribed, week by week.
            Use the arrow keys to move between weeks and cohorts.
          </caption>
          <thead>
            <tr className='text-muted-foreground'>
              <th
                scope='col'
                className={cn(STICKY_HEADER, 'h-8 pe-2 text-start font-normal')}
              >
                Cohort
              </th>
              <th scope='col' className='h-8 pe-2 text-end font-normal'>
                Customers
              </th>
              {WEEKS.map((week) => (
                <th key={week} scope='col' className='h-8 font-normal'>
                  {`W${week}`}
                  <span className='sr-only'>, {weekLabelOf(week)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COHORT_ROWS.map((cohort, cohortIndex) => (
              <tr key={cohort.id}>
                <th
                  scope='row'
                  className={cn(STICKY_HEADER, 'pe-2 text-start font-medium')}
                >
                  {cohort.label}
                </th>
                <td className='text-muted-foreground pe-2 text-end'>
                  {formatCount(cohort.size)}
                </td>
                {WEEKS.map((week) => {
                  const cell = cohort.cells[week];
                  if (!cell) {
                    return (
                      <td key={week}>
                        <span
                          aria-hidden='true'
                          className='hairline-border border-foreground/15 block h-9 rounded-md border-dashed'
                        />
                        <span className='sr-only'>Not yet</span>
                      </td>
                    );
                  }
                  const here: Selection = { cohortIndex, week };
                  const isSelected = sameSelection(here, selection);
                  const shade = shadeOf(cell.rate);

                  return (
                    <td key={week}>
                      <button
                        type='button'
                        data-cell={cellKeyOf(here)}
                        tabIndex={tabIndexOf(isSelected)}
                        aria-pressed={isSelected}
                        aria-label={cellLabelOf(cohort, cell)}
                        onClick={() => onSelect(here)}
                        onKeyDown={handleKeyDown}
                        style={{ backgroundColor: shade }}
                        className='focus-visible:ring-ring/30 relative flex h-9 w-full min-w-12 cursor-pointer items-center justify-center rounded-md font-medium outline-none focus-visible:ring-[3px]'
                      >
                        {isSelected && (
                          <motion.span
                            layoutId='cohort-selection'
                            transition={ringTransition}
                            aria-hidden='true'
                            className='ring-foreground ring-offset-card pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-1'
                          />
                        )}
                        <span className='relative'>
                          {cellTextOf(mode, cell.rate, cell.retained)}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='text-muted-foreground'>
              <th
                scope='row'
                className={cn(STICKY_HEADER, 'h-9 pe-2 text-start font-normal')}
              >
                Average
              </th>
              <td />
              {WEEK_AVERAGES.map((average) => (
                <td key={average.week} className='h-9 text-center'>
                  {cellTextOf(mode, average.rate, average.customers)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </LayoutGroup>
    </motion.div>
  );
}
