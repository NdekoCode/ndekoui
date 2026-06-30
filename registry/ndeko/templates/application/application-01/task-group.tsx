'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { ChevronDownIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import type { StatusId, Task } from './data';
import { DraftRow } from './draft-row';
import { fadePresence, heightPresenceOf } from './motion-parts';
import { StatusGlyph } from './task-glyphs';
import { BAND_FILL, COUNT_CHIP, TASK_GRID } from './task-grid';
import { countLabel, statusOf } from './task-model';
import { TaskRow, type TaskRowHandlers } from './task-row';

type TaskGroupProps = TaskRowHandlers & {
  status: StatusId;
  tasks: Task[];
  openTaskId: string | null;
  isCollapsed: boolean;
  isDrafting: boolean;
  onToggleCollapsed: (status: StatusId) => void;
  onStartDraft: (status: StatusId) => void;
  onCreate: (status: StatusId, title: string) => void;
  onCancelDraft: () => void;
};

function foldLabelOf(name: string, isCollapsed: boolean) {
  if (isCollapsed) {
    return `Show ${name}`;
  }
  return `Fold ${name}`;
}

export function TaskGroup({
  status,
  tasks,
  openTaskId,
  isCollapsed,
  isDrafting,
  onToggleCollapsed,
  onStartDraft,
  onCreate,
  onCancelDraft,
  ...rowHandlers
}: TaskGroupProps) {
  const shouldReduceMotion = useReducedMotion();
  const bodyPresence = heightPresenceOf(shouldReduceMotion);
  const meta = statusOf(status);
  const isOpen = !isCollapsed;

  return (
    <motion.section role='rowgroup' aria-label={meta.name} {...fadePresence()}>
      <div
        role='row'
        className={cn(TASK_GRID, BAND_FILL, 'sticky top-9 z-10 h-9')}
      >
        <div role='cell' className='col-[1/-2] flex min-w-0 items-center gap-2'>
          <button
            type='button'
            aria-expanded={isOpen}
            aria-label={foldLabelOf(meta.name, isCollapsed)}
            onClick={() => onToggleCollapsed(status)}
            className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 -ml-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
          >
            <ChevronDownIcon
              className={cn(
                'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
                isCollapsed && '-rotate-90'
              )}
            />
          </button>
          <StatusGlyph status={status} />
          <span className='truncate text-[13px] font-medium'>{meta.name}</span>
          <span className={COUNT_CHIP}>
            <span aria-hidden='true'>
              <MotionNumber value={tasks.length} />
            </span>
            <span className='sr-only'>
              {countLabel(tasks.length, 'task', 'tasks')}
            </span>
          </span>
        </div>
        <div role='cell' className='flex justify-end'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Add a task to ${meta.name}`}
            onClick={() => onStartDraft(status)}
            className='text-muted-foreground'
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key='body' {...bodyPresence} className='overflow-hidden'>
            <AnimatePresence initial={false}>
              {isDrafting && (
                <DraftRow
                  key='draft'
                  status={status}
                  onCreate={(title) => onCreate(status, title)}
                  onCancel={onCancelDraft}
                />
              )}
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isOpen={task.id === openTaskId}
                  {...rowHandlers}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
