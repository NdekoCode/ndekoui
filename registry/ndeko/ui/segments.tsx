'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

export type Segment<Value extends string> = {
  value: Value;
  label: string;
};

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

type SegmentsProps<Value extends string> = {
  value: Value;
  segments: readonly Segment<Value>[];
  onValueChange: (value: Value) => void;
  label: string;
  className?: string;
  itemClassName?: string;
};

export function Segments<Value extends string>({
  value,
  segments,
  onValueChange,
  label,
  className,
  itemClassName,
}: SegmentsProps<Value>) {
  const pressedValues = [value];

  function changeValue(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const segment = segments.find((candidate) => candidate.value === nextValue);
    if (segment) {
      onValueChange(segment.value);
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
      className={cn('bg-foreground/[0.05] rounded-lg p-0.5', className)}
    >
      {segments.map((segment) => (
        <ToggleGroupItem
          key={segment.value}
          value={segment.value}
          className={cn('h-6 flex-1 rounded-md px-2.5 text-xs', itemClassName)}
        >
          {segment.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
