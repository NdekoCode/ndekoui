'use client';

import { useEffect, useRef } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import type { MonthGroup } from './groups';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

type MonthNavProps = {
  groups: MonthGroup[];
  activeId: string | null;
  pressed: string | null;
  onJump: (monthId: string) => void;
};

/** The strip keeps the active month in view by moving itself, never the page. */
function centerActive(strip: HTMLElement) {
  const active = strip.querySelector<HTMLElement>('[data-pressed]');
  if (!active) {
    return;
  }
  const middle = active.offsetLeft + active.offsetWidth / 2;
  const left = middle - strip.clientWidth / 2;
  strip.scrollTo({ left, behavior: 'smooth' });
}

export function MonthNav({ groups, activeId, pressed, onJump }: MonthNavProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const pressedValues = [activeId ?? ''];

  useEffect(() => {
    const strip = stripRef.current;
    if (strip) {
      centerActive(strip);
    }
  }, [activeId]);

  function changeMonth(nextValues: unknown[]) {
    const [next] = nextValues;
    const group = groups.find((candidate) => candidate.id === next);
    if (group) {
      onJump(group.id);
    }
  }

  return (
    <nav aria-label='Jump to a month' className='min-w-0'>
      <div
        ref={stripRef}
        className='relative -mx-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:px-0'
      >
        <ToggleGroup
          aria-label='Months'
          value={pressedValues}
          onValueChange={changeMonth}
          travel
          size='sm'
          indicatorClassName={THUMB}
          className='bg-foreground/[0.05] rounded-lg p-0.5'
        >
          {groups.map((group) => (
            <ToggleGroupItem
              key={group.id}
              value={group.id}
              className={cn(
                'h-7 rounded-md px-2.5 text-xs',
                pressedQuietOf(pressed === `month-${group.id}`)
              )}
            >
              {group.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </nav>
  );
}
