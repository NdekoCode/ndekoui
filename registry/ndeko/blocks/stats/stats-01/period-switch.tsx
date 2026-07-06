'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { PERIODS, type PeriodId } from './data';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

type PeriodSwitchProps = {
  value: PeriodId;
  pressed: PeriodId | null;
  onValueChange: (period: PeriodId) => void;
};

export function PeriodSwitch({
  value,
  pressed,
  onValueChange,
}: PeriodSwitchProps) {
  const pressedValues = [value];

  /** Pressing the period already shown would leave nothing pressed: it stays. */
  function change(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const period = PERIODS.find((candidate) => candidate.id === nextValue);
    if (period) {
      onValueChange(period.id);
    }
  }

  return (
    <ToggleGroup
      aria-label='Period of the figures'
      value={pressedValues}
      onValueChange={change}
      travel
      size='sm'
      indicatorClassName={THUMB}
      className='bg-foreground/[0.05] rounded-lg p-0.5'
    >
      {PERIODS.map((period) => (
        <ToggleGroupItem
          key={period.id}
          value={period.id}
          className={cn(
            'h-7 rounded-md px-2.5 text-xs',
            pressedQuietOf(pressed === period.id)
          )}
        >
          {period.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
