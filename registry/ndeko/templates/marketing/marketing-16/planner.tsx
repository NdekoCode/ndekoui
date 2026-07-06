'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';
import { Slider } from '@/registry/ndeko/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import {
  BUDGET_RANGE,
  DEFAULT_BUDGET,
  DIVISIONS,
  PLANNER_ANCHOR,
  PLANNER_SECTION,
  type Division,
} from './data';
import {
  budgetTextOf,
  compactOf,
  reachOf,
  shareOf,
  totalReachOf,
} from './planner-model';
import { BUDGET_PATH } from './planner-path';
import { Reveal } from './reveal';

const ALL_IDS = DIVISIONS.map((division) => division.id);

const CHIP =
  'h-7 rounded-full px-3 text-xs data-pressed:text-primary-ink data-pressed:ring-primary/50';

function firstOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function barToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'opacity-100';
  }
  return 'opacity-30';
}

type BarRowProps = {
  division: Division;
  budget: number;
  isSelected: boolean;
};

function BarRow({ division, budget, isSelected }: BarRowProps) {
  const share = shareOf(budget, division, BUDGET_RANGE.max);
  const reach = reachOf(budget, division);
  const fillStyle = { transform: `scaleX(${share})` };

  return (
    <li
      className={cn(
        'flex flex-col gap-1.5 transition-opacity duration-300',
        barToneOf(isSelected)
      )}
    >
      <div className='flex items-baseline justify-between gap-3 text-[13px]'>
        <span className='font-medium'>{division.name}</span>
        <span className='text-muted-foreground tabular-nums'>
          {compactOf(reach)}
        </span>
      </div>
      <div className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'>
        <div
          style={fillStyle}
          className='bg-primary h-full origin-left rounded-full transition-transform duration-300 ease-(--ease-out-strong)'
        />
      </div>
    </li>
  );
}

export function Planner() {
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [selectedIds, setSelectedIds] = useState<string[]>(ALL_IDS);
  const tourSteps = BUDGET_PATH.map((step) => ({
    after: step.after,
    run: () => setBudget(step.value),
  }));
  const { ref } = useAutoplay(tourSteps, {
    loopAfter: 1800,
    onReset: () => setBudget(DEFAULT_BUDGET),
  });
  const reach = totalReachOf(budget, selectedIds);
  const hasSelection = selectedIds.length > 0;

  function changeBudget(value: number | readonly number[]) {
    setBudget(firstOf(value));
  }

  function changeDivisions(values: unknown[]) {
    const ids = values.filter((value) => typeof value === 'string');
    setSelectedIds(ids);
  }

  return (
    <section
      id={PLANNER_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-10'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
            {PLANNER_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {PLANNER_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='grid gap-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @4xl:gap-16'
          >
            <div className='flex flex-col gap-8'>
              <div className='flex flex-col gap-2'>
                <p className='text-muted-foreground text-xs'>
                  {PLANNER_SECTION.budgetLabel}
                </p>
                <p className='text-4xl font-semibold tabular-nums @2xl:text-5xl'>
                  {budgetTextOf(budget)}
                </p>
              </div>
              <Slider
                value={[budget]}
                onValueChange={changeBudget}
                min={BUDGET_RANGE.min}
                max={BUDGET_RANGE.max}
                step={BUDGET_RANGE.step}
                thumbLabels={[PLANNER_SECTION.budgetLabel]}
              />
              <ToggleGroup
                aria-label='Divisions in the campaign'
                multiple
                value={selectedIds}
                onValueChange={changeDivisions}
                variant='outline'
                className='flex-wrap gap-1.5'
              >
                {DIVISIONS.map((division) => (
                  <ToggleGroupItem
                    key={division.id}
                    value={division.id}
                    className={CHIP}
                  >
                    {division.short}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-xs'>
                  {PLANNER_SECTION.reachLabel}
                </p>
                <p className='text-5xl font-semibold tabular-nums @2xl:text-6xl'>
                  {compactOf(reach)}
                </p>
                {!hasSelection && (
                  <p className='text-muted-foreground text-xs'>
                    Choose at least one division
                  </p>
                )}
              </div>
            </div>
            <div className='flex flex-col justify-between gap-8'>
              <ul className='flex flex-col gap-4'>
                {DIVISIONS.map((division) => (
                  <BarRow
                    key={division.id}
                    division={division}
                    budget={budget}
                    isSelected={selectedIds.includes(division.id)}
                  />
                ))}
              </ul>
              <div className='flex flex-col items-start gap-3'>
                <p className='text-muted-foreground text-xs'>
                  {PLANNER_SECTION.note}
                </p>
                <Button size='lg' nativeButton={false} render={<a href='#' />}>
                  {PLANNER_SECTION.action}
                  <ArrowRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
