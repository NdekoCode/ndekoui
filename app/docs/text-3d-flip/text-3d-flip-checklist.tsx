'use client';

import { useState } from 'react';
import { Text3DFlip } from '@/components/core/text-3d-flip';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

const TASKS = [
  { id: 'brief', label: 'Draft the launch brief' },
  { id: 'pricing', label: 'Review the pricing copy' },
  { id: 'notes', label: 'Send the release notes' },
];

function nextDoneIdsOf(current: string[], id: string, isChecked: boolean) {
  if (isChecked) {
    return [...current, id];
  }
  return current.filter((doneId) => doneId !== id);
}

export function Text3DFlipChecklist() {
  const [doneIds, setDoneIds] = useState<string[]>(['pricing']);

  const toggle = (id: string, isChecked: boolean) => {
    setDoneIds((current) => nextDoneIdsOf(current, id, isChecked));
  };

  return (
    <ul className='flex flex-col gap-3'>
      {TASKS.map((task) => {
        const isDone = doneIds.includes(task.id);

        return (
          <li key={task.id}>
            <label className='flex cursor-pointer items-center gap-2.5 text-[13px]'>
              <Checkbox
                checked={isDone}
                onCheckedChange={(isChecked) => toggle(task.id, isChecked)}
              />
              <Text3DFlip
                flipped={isDone}
                direction='down'
                staggerFrom='random'
                stagger={0.012}
                duration={0.4}
                textClassName='text-foreground'
                backClassName='text-muted-foreground'
              >
                {task.label}
              </Text3DFlip>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
