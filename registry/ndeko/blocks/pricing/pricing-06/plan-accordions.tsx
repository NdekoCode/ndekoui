'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { CellMark } from './cell-mark';
import {
  actionVariantOf,
  formatPrice,
  type RowPresence,
  visibleRowsOf,
} from './comparison';
import { type Group, GROUPS, type Plan, type PlanId, PLANS } from './data';

function isPlanId(value: unknown): value is PlanId {
  return PLANS.some((plan) => plan.id === value);
}

type PlanGroupProps = {
  group: Group;
  plan: Plan;
  isOnlyDifferences: boolean;
  presence: RowPresence;
};

function PlanGroup({
  group,
  plan,
  isOnlyDifferences,
  presence,
}: PlanGroupProps) {
  const rows = visibleRowsOf(group, isOnlyDifferences);
  const hasRows = rows.length > 0;

  return (
    <>
      <AnimatePresence initial={false}>
        {hasRows && (
          <motion.h4
            key='title'
            {...presence}
            className='text-foreground overflow-hidden text-[13px] font-medium'
          >
            <span className='block pt-3 pb-1'>{group.title}</span>
          </motion.h4>
        )}
      </AnimatePresence>
      <ul className='text-foreground flex flex-col'>
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.li key={row.id} {...presence} className='overflow-hidden'>
              <div className='flex items-center justify-between gap-3 py-1.5'>
                <span className='min-w-0 text-pretty'>{row.feature}</span>
                <span className='shrink-0 text-end'>
                  <CellMark cell={row.cells[plan.id]} />
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}

type PlanAccordionsProps = {
  isOnlyDifferences: boolean;
  openPlans: PlanId[];
  onOpenPlansChange: (openPlans: PlanId[]) => void;
};

/** On a narrow page each plan opens on its own, with the same rows folding away on demand. */
export function PlanAccordions({
  isOnlyDifferences,
  openPlans,
  onOpenPlansChange,
}: PlanAccordionsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  function changeOpenPlans(value: unknown[]) {
    const ids = value.filter(isPlanId);
    onOpenPlansChange(ids);
  }

  return (
    <Accordion
      value={openPlans}
      onValueChange={changeOpenPlans}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      {PLANS.map((plan) => {
        const price = formatPrice(plan.price);
        return (
          <AccordionItem
            key={plan.id}
            value={plan.id}
            className='relative isolate px-4'
          >
            {plan.isFeatured && <Wash />}
            <AccordionTrigger className='py-4'>
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='text-sm'>{plan.name}</span>
                <span className='text-muted-foreground text-xs font-normal tabular-nums'>
                  {price} {plan.priceNote}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionPanel className='pb-4 text-[13px]'>
              {GROUPS.map((group) => (
                <PlanGroup
                  key={group.id}
                  group={group}
                  plan={plan}
                  isOnlyDifferences={isOnlyDifferences}
                  presence={presence}
                />
              ))}
              <Button
                size='sm'
                variant={actionVariantOf(plan)}
                nativeButton={false}
                render={<a href='#' />}
                className='mt-4'
              >
                {plan.action}
              </Button>
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
