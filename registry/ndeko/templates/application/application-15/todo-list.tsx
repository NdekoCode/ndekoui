'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { taskOf } from './data';

function doneClassOf(isDone: boolean) {
  if (isDone) {
    return 'text-muted-foreground line-through decoration-foreground/30';
  }
  return undefined;
}

type TaskRowProps = {
  id: string;
  isDone: boolean;
  isPressed: boolean;
  onToggle: (id: string) => void;
};

function TaskRow({ id, isDone, isPressed, onToggle }: TaskRowProps) {
  const task = taskOf(id);

  function toggle() {
    onToggle(id);
  }

  return (
    <label
      className={cn(
        'hover:bg-foreground/[0.04] flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 transition-[background-color,scale] duration-150',
        pressedQuietOf(isPressed)
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={toggle}
        aria-label={task.title}
        className='mt-0.5'
      />
      <span className='flex min-w-0 flex-1 flex-col leading-snug'>
        <span
          className={cn(
            'text-[13px] transition-colors duration-200',
            doneClassOf(isDone)
          )}
        >
          {task.title}
        </span>
        <span className='text-muted-foreground text-xs'>{task.due}</span>
      </span>
    </label>
  );
}

type TodoListProps = {
  taskIds: string[];
  doneTaskIds: string[];
  openCount: number;
  pressed: string | null;
  onToggle: (id: string) => void;
};

export function TodoList({
  taskIds,
  doneTaskIds,
  openCount,
  pressed,
  onToggle,
}: TodoListProps) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <section
      data-section='tasks'
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex scroll-mt-4 flex-col gap-2 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-baseline gap-2'>
        <h2 id={titleId} className='text-sm font-medium'>
          To do
        </h2>
        <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
          <MotionNumber value={openCount} />
          <span>left</span>
        </p>
      </header>
      <ul className='-mx-2 flex flex-col'>
        <AnimatePresence initial={false}>
          {taskIds.map((id) => (
            <motion.li key={id} className='overflow-hidden' {...rowPresence}>
              <TaskRow
                id={id}
                isDone={doneTaskIds.includes(id)}
                isPressed={pressed === `task-${id}`}
                onToggle={onToggle}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
