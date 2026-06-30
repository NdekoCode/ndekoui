'use client';

import { useId, useRef, useState } from 'react';

import { confetti } from '@/components/core/confetti';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const STEPS = [
  'Invite your team',
  'Connect a calendar',
  'Create a first project',
];

function remainingLabelOf(remaining: number) {
  if (remaining === 0) {
    return 'All set';
  }
  if (remaining === 1) {
    return '1 step left';
  }
  return `${remaining} steps left`;
}

export function ConfettiChecklist() {
  const [done, setDone] = useState<string[]>([STEPS[0]]);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const remaining = STEPS.length - done.length;
  const remainingLabel = remainingLabelOf(remaining);

  function toggle(step: string, isChecked: boolean) {
    const others = done.filter((item) => item !== step);
    if (!isChecked) {
      setDone(others);
      return;
    }
    const next = [...others, step];
    setDone(next);
    const isComplete = next.length === STEPS.length;
    if (!isComplete) {
      return;
    }
    const origin = listRef.current ?? undefined;
    void confetti({ origin, particleCount: 80, spread: 80 });
  }

  return (
    <div className='bg-card hairline-ring ring-border w-full max-w-xs rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-baseline justify-between'>
        <h3 className='text-sm font-medium'>Set up your workspace</h3>
        <span
          aria-live='polite'
          className='text-muted-foreground text-xs tabular-nums'
        >
          {remainingLabel}
        </span>
      </div>
      <ul ref={listRef} className='mt-3 flex flex-col gap-2.5'>
        {STEPS.map((step, index) => {
          const isChecked = done.includes(step);
          const id = `${baseId}-${index}`;

          return (
            <li key={step} className='flex items-center gap-2'>
              <Checkbox
                id={id}
                checked={isChecked}
                onCheckedChange={(checked) => toggle(step, checked)}
              />
              <Label htmlFor={id} className='text-[13px] font-normal'>
                {step}
              </Label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
