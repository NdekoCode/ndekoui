'use client';

import { useState } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { RollingCount } from './_parts/motion-parts';
import { personOf } from './_parts/people';
import {
  doneCountOf,
  isDone,
  SUBTASKS,
  withToggled,
  type Subtask,
} from './_parts/subtask-data';
import {
  PersonAvatar,
  ProgressRing,
  StrikeTitle,
} from './_parts/subtask-parts';

const FIRST_SUBTASKS = SUBTASKS.slice(0, 5);

function ChecklistRow({
  subtask,
  onToggle,
}: {
  subtask: Subtask;
  onToggle: () => void;
}) {
  const isChecked = isDone(subtask);

  return (
    <li>
      <label className='hover:bg-foreground/[0.03] flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2'>
        <Checkbox checked={isChecked} onCheckedChange={onToggle} />
        <StrikeTitle title={subtask.title} isDone={isChecked} />
        {subtask.assigneeId && (
          <PersonAvatar
            person={personOf(subtask.assigneeId)}
            className='ms-auto'
          />
        )}
      </label>
    </li>
  );
}

export default function Subtask01() {
  const [subtasks, setSubtasks] = useState(FIRST_SUBTASKS);
  const doneCount = doneCountOf(subtasks);
  const total = subtasks.length;

  return (
    <section aria-label='Sub-tasks' className='w-full max-w-md'>
      <header className='flex items-center justify-between gap-3 px-2'>
        <h3 className='text-sm font-medium'>Sub-tasks</h3>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
          <ProgressRing done={doneCount} total={total} />
          <span aria-hidden='true' className='flex tabular-nums'>
            <RollingCount value={doneCount} />/{total}
          </span>
          <span className='sr-only' aria-live='polite'>
            {doneCount} of {total} done
          </span>
        </span>
      </header>
      <ul className='mt-2 flex flex-col'>
        {subtasks.map((subtask) => (
          <ChecklistRow
            key={subtask.id}
            subtask={subtask}
            onToggle={() =>
              setSubtasks((current) => withToggled(current, subtask.id))
            }
          />
        ))}
      </ul>
    </section>
  );
}
