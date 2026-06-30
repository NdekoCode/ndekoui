'use client';

import type { Icon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

export type SegmentOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: Icon;
};

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

type ChoiceSegmentsProps<Value extends string> = {
  value: Value;
  options: SegmentOption<Value>[];
  onValueChange: (value: Value) => void;
  /** Names the group for screen readers when no visible label points at it. */
  label: string;
  className?: string;
};

/** One choice out of a few on a segmented track: a raised thumb travels to the picked segment. */
export function ChoiceSegments<Value extends string>({
  value,
  options,
  onValueChange,
  label,
  className,
}: ChoiceSegmentsProps<Value>) {
  const pressedValues = [value];

  function changeValue(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <ToggleGroup
      aria-label={label}
      value={pressedValues}
      onValueChange={changeValue}
      travel
      size='sm'
      indicatorClassName={THUMB}
      className={cn('bg-foreground/[0.05] w-full rounded-lg p-0.5', className)}
    >
      {options.map((option) => {
        const OptionGlyph = option.icon;

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className='flex-1 rounded-md'
          >
            {OptionGlyph && <OptionGlyph />}
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
