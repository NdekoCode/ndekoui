'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

type Task = {
  id: string;
  title: string;
  project: string;
  due?: string;
};

const TASKS: Task[] = [
  {
    id: 'onboarding',
    title: 'Review the onboarding copy',
    project: 'Design',
    due: '10:00',
  },
  {
    id: 'invoice',
    title: 'Send the October invoice to Halden Studio',
    project: 'Finance',
  },
  {
    id: 'export',
    title: 'Fix the date format in exports',
    project: 'Web app',
    due: '13:30',
  },
  {
    id: 'review',
    title: 'Prepare the sprint review',
    project: 'Team',
    due: '15:30',
  },
  {
    id: 'venue',
    title: 'Confirm the venue with Amara Osei',
    project: 'Offsite',
  },
];

const INITIALLY_DONE = ['onboarding'];

function metaOf(task: Task) {
  if (task.due) {
    return `${task.project} · ${task.due}`;
  }
  return task.project;
}

function progressOffsetOf(doneCount: number) {
  const share = doneCount / TASKS.length;
  const hiddenShare = 1 - share;
  return `translateX(-${hiddenShare * 100}%)`;
}

export function TaskScreen() {
  const [doneIds, setDoneIds] = useState<string[]>(INITIALLY_DONE);
  const doneCount = doneIds.length;
  const progressOffset = progressOffsetOf(doneCount);

  function setTaskDone(taskId: string, isDone: boolean) {
    setDoneIds((current) => {
      const others = current.filter((id) => id !== taskId);
      if (isDone) {
        return [...others, taskId];
      }
      return others;
    });
  }

  return (
    <div className='flex flex-1 flex-col gap-5 px-4 pt-3 pb-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <span className='text-muted-foreground text-xs'>
            Thursday 5 November
          </span>
          <p className='text-2xl font-semibold'>Today</p>
        </div>
        <Avatar>
          <AvatarImage src='/avatars/avatar-05.svg' alt='' />
          <AvatarFallback>LM</AvatarFallback>
        </Avatar>
      </div>
      <div className='flex flex-col gap-2'>
        <span className='text-muted-foreground text-xs'>
          <MotionNumber value={doneCount} /> of {TASKS.length} done
        </span>
        <div
          aria-hidden='true'
          className='bg-foreground/10 h-1 overflow-hidden rounded-full'
        >
          <div
            className='bg-primary h-full rounded-full transition-transform duration-300 ease-(--ease-out-strong)'
            style={{ transform: progressOffset }}
          />
        </div>
      </div>
      <ul className='flex flex-col'>
        {TASKS.map((task) => {
          const isDone = doneIds.includes(task.id);
          const meta = metaOf(task);

          return (
            <li key={task.id}>
              <label className='flex cursor-pointer items-start gap-3 py-2.5'>
                <Checkbox
                  className='mt-0.5'
                  checked={isDone}
                  onCheckedChange={(checked) => setTaskDone(task.id, checked)}
                />
                <span className='flex min-w-0 flex-col gap-0.5'>
                  <span
                    className={cn(
                      'text-sm transition-colors duration-150',
                      isDone && 'text-muted-foreground line-through'
                    )}
                  >
                    {task.title}
                  </span>
                  <span className='text-muted-foreground text-xs'>{meta}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
