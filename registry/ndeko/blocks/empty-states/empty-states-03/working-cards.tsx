'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { DashboardCard } from './dashboard-card';
import { OPEN_TASKS, TEAM, type OpenTask, type Person } from './data';
import { personOf } from './people';

function withDone(tasks: OpenTask[], taskId: string, isDone: boolean) {
  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }
    return { ...task, isDone };
  });
}

export function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar
      className={cn('size-6 text-[10px]', className)}
      seed={person.name}
    />
  );
}

export function OpenTasksCard() {
  const [tasks, setTasks] = useState<OpenTask[]>(OPEN_TASKS);
  const openCount = tasks.filter((task) => !task.isDone).length;

  function toggle(taskId: string, isDone: boolean) {
    setTasks((current) => withDone(current, taskId, isDone));
  }

  return (
    <DashboardCard
      title='Your open tasks'
      meta={
        <span className='inline-flex items-center gap-1 tabular-nums'>
          <MotionNumber value={openCount} /> open
        </span>
      }
    >
      <ul className='-mx-1.5 flex flex-col'>
        {tasks.map((task) => (
          <li key={task.id}>
            <label className='hover:bg-foreground/[0.03] flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-1.5'>
              <Checkbox
                checked={task.isDone}
                onCheckedChange={(checked) => toggle(task.id, checked)}
              />
              <span className='text-muted-foreground w-16 shrink-0 text-xs tabular-nums'>
                {task.key}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[13px]',
                  task.isDone && 'text-muted-foreground line-through'
                )}
              >
                {task.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export function TeamCard() {
  return (
    <DashboardCard title='Team' meta='Working on now'>
      <ul className='flex flex-col gap-3'>
        {TEAM.map((member) => {
          const person = personOf(member.personId);
          return (
            <li key={member.personId} className='flex items-center gap-2.5'>
              <PersonAvatar person={person} />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-[13px]'>{person.name}</p>
                <p className='text-muted-foreground truncate text-xs'>
                  {member.focus ?? 'No task in progress'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
