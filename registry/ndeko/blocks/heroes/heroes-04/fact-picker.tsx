'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { type FactId, FACTS, HERO } from './data';

/** The picked fact sits on a card that travels from one fact to the next. */
const PICKED_CARD =
  'bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.06]';

const FACT_ITEM =
  'bg-foreground/[0.03] h-auto flex-col items-start justify-start gap-1 rounded-xl px-4 py-3.5 text-start whitespace-normal';

function isFactId(value: unknown): value is FactId {
  return FACTS.some((fact) => fact.id === value);
}

type FactPickerProps = {
  picked: FactId;
  /** The fact the demonstration is pressing, for the look of a press. */
  pressed: FactId | null;
  onPick: (fact: FactId) => void;
};

/** The facts row: three short facts, one picked at a time, each backing one part of the statement. */
export function FactPicker({ picked, pressed, onPick }: FactPickerProps) {
  const pickedValues = [picked];

  /** Pressing the picked fact again keeps it: a statement always has one fact behind it. */
  function change(values: unknown[]) {
    const [next] = values;
    if (isFactId(next)) {
      onPick(next);
    }
  }

  return (
    <ToggleGroup
      aria-label={HERO.factsLabel}
      value={pickedValues}
      onValueChange={change}
      travel
      indicatorClassName={PICKED_CARD}
      className='grid w-full items-stretch gap-2 @3xl:grid-cols-3'
    >
      {FACTS.map((fact) => (
        <ToggleGroupItem
          key={fact.id}
          value={fact.id}
          className={cn(FACT_ITEM, pressedQuietOf(pressed === fact.id))}
        >
          <span className='text-foreground text-sm font-medium'>
            {fact.title}
          </span>
          <span className='text-muted-foreground text-[13px] font-normal text-pretty'>
            {fact.detail}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
