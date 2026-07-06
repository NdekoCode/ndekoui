'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { CellMark } from './cell-mark';
import {
  actionVariantOf,
  formatPrice,
  type RowPresence,
  visibleRowsOf,
} from './comparison';
import { type Group, GROUPS, type Plan, PLANS, type Row } from './data';
import { DifferencesSwitch } from './differences-switch';

const ROW_FADE = fadePresence();

/** The featured plan keeps one quiet band of tint from its header to its last row. */
const FEATURED_BAND = 'bg-primary/[0.03] dark:bg-primary/[0.05]';

/**
 * The line under the header is drawn by each cell, so it stays with the header while it sticks.
 * The one-pixel height lets the content fill the cell, so the featured band reaches its top.
 */
const HEAD_CELL =
  'bg-background sticky top-0 z-10 h-px p-0 text-left align-bottom font-normal shadow-[inset_0_calc(var(--hairline)*-1)_0_var(--border)]';

function bandOf(plan: Plan) {
  if (plan.isFeatured) {
    return FEATURED_BAND;
  }
  return undefined;
}

function PlanHead({ plan }: { plan: Plan }) {
  const price = formatPrice(plan.price);

  return (
    <th scope='col' className={HEAD_CELL}>
      <div
        className={cn(
          'relative isolate flex h-full flex-col gap-3 rounded-t-xl p-4',
          bandOf(plan)
        )}
      >
        {plan.isFeatured && <Wash />}
        <span className='text-sm font-medium'>{plan.name}</span>
        <span className='flex flex-wrap items-baseline gap-x-1.5'>
          <span className='text-2xl font-semibold tabular-nums'>{price}</span>
          <span className='text-muted-foreground text-xs'>
            {plan.priceNote}
          </span>
        </span>
        <Button
          size='sm'
          variant={actionVariantOf(plan)}
          nativeButton={false}
          render={<a href='#' />}
          className='self-start'
        >
          {plan.action}
        </Button>
      </div>
    </th>
  );
}

type GroupHeadProps = {
  group: Group;
  presence: RowPresence;
};

function GroupHead({ group, presence }: GroupHeadProps) {
  return (
    <motion.tr {...ROW_FADE}>
      <th scope='rowgroup' className='p-0 text-left font-medium'>
        <motion.div {...presence} className='overflow-hidden'>
          <div className='pt-7 pb-2 text-sm'>{group.title}</div>
        </motion.div>
      </th>
      {PLANS.map((plan) => (
        <td key={plan.id} className={cn('p-0', bandOf(plan))} />
      ))}
    </motion.tr>
  );
}

type FeatureRowProps = {
  row: Row;
  presence: RowPresence;
};

/** Every cell folds its own height, so the row closes from its tallest cell down to nothing. */
function FeatureRow({ row, presence }: FeatureRowProps) {
  return (
    <motion.tr {...ROW_FADE} className='hairline-b border-border'>
      <th scope='row' className='p-0 text-left font-normal'>
        <motion.div {...presence} className='overflow-hidden'>
          <div className='py-3 pe-4 text-pretty'>{row.feature}</div>
        </motion.div>
      </th>
      {PLANS.map((plan) => (
        <td key={plan.id} className={cn('p-0', bandOf(plan))}>
          <motion.div {...presence} className='overflow-hidden'>
            <div className='px-4 py-3'>
              <CellMark cell={row.cells[plan.id]} />
            </div>
          </motion.div>
        </td>
      ))}
    </motion.tr>
  );
}

type ComparisonTableProps = {
  isOnlyDifferences: boolean;
  onOnlyDifferencesChange: (isOn: boolean) => void;
};

/** The plans side by side under a header that sticks, with the rows every plan shares folding away on demand. */
export function ComparisonTable({
  isOnlyDifferences,
  onOnlyDifferencesChange,
}: ComparisonTableProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  return (
    <table className='w-full table-fixed text-[13px]'>
      <caption className='sr-only'>
        The plans of Larchwork compared feature by feature
      </caption>
      <colgroup>
        <col className='w-[34%]' />
        {PLANS.map((plan) => (
          <col key={plan.id} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th scope='col' className={HEAD_CELL}>
            <div className='flex h-full flex-col justify-end gap-3 py-4 pe-4'>
              <span className='text-sm font-medium'>Features</span>
              <DifferencesSwitch
                isOn={isOnlyDifferences}
                onChange={onOnlyDifferencesChange}
              />
            </div>
          </th>
          {PLANS.map((plan) => (
            <PlanHead key={plan.id} plan={plan} />
          ))}
        </tr>
      </thead>
      {GROUPS.map((group) => {
        const rows = visibleRowsOf(group, isOnlyDifferences);
        const hasRows = rows.length > 0;
        return (
          <tbody key={group.id}>
            <AnimatePresence initial={false}>
              {hasRows && (
                <GroupHead key='title' group={group} presence={presence} />
              )}
              {rows.map((row) => (
                <FeatureRow key={row.id} row={row} presence={presence} />
              ))}
            </AnimatePresence>
          </tbody>
        );
      })}
    </table>
  );
}
