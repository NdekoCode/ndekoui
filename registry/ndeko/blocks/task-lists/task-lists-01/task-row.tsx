'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import type { PriorityId, StatusId, Task } from './data';
import { heightPresenceOf } from './motion-parts';
import { AssigneePicker, PriorityPicker, StatusPicker } from './property-menus';
import {
  IssueTypeGem,
  LabelChips,
  LivePill,
  SubTaskCountTag,
} from './task-glyphs';
import {
  DUE_CELL,
  ID_CELL,
  LABELS_CELL,
  PRIORITY_CELL,
  ROW_CLASS,
  TASK_GRID,
  TRACKED_ROW,
} from './task-grid';
import { dueLabelOf, isOverdue, taskKeyOf, trackerOf } from './task-model';

export type TaskRowHandlers = {
  onStatusChange: (taskId: string, status: StatusId) => void;
  onPriorityChange: (taskId: string, priority: PriorityId) => void;
  onAssigneesChange: (taskId: string, assigneeIds: string[]) => void;
};

type TaskRowProps = TaskRowHandlers & {
  task: Task;
};

function dueToneOf(task: Task) {
  if (isOverdue(task)) {
    return 'text-destructive-ink';
  }
  return 'text-muted-foreground';
}

function DueDate({ task }: { task: Task }) {
  if (!task.due) {
    return null;
  }
  return (
    <span className={cn('text-xs tabular-nums', dueToneOf(task))}>
      {dueLabelOf(task.due)}
      {isOverdue(task) && <span className='sr-only'>, overdue</span>}
    </span>
  );
}

export function TaskRow({
  task,
  onStatusChange,
  onPriorityChange,
  onAssigneesChange,
}: TaskRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const isDone = task.status === 'done';
  const tracker = trackerOf(task);
  const isTracked = Boolean(tracker);

  return (
    <motion.div
      role='row'
      {...presence}
      className={cn(TASK_GRID, ROW_CLASS, isTracked && TRACKED_ROW)}
    >
      <div role='cell' className={PRIORITY_CELL}>
        <PriorityPicker
          priority={task.priority}
          onChange={(priority) => onPriorityChange(task.id, priority)}
        />
      </div>
      <div
        role='cell'
        className={cn(ID_CELL, 'text-muted-foreground text-xs tabular-nums')}
      >
        {taskKeyOf(task)}
      </div>
      <div role='cell' className='flex'>
        <StatusPicker
          status={task.status}
          onChange={(status) => onStatusChange(task.id, status)}
        />
      </div>
      <div role='cell' className='flex min-w-0 items-center gap-2'>
        <IssueTypeGem type={task.type} />
        <span
          className={cn(
            'truncate text-[13px]',
            isDone && 'text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        {task.subTasks && <SubTaskCountTag count={task.subTasks} />}
        {tracker && <LivePill personName={tracker.name} />}
      </div>
      <div role='cell' className={LABELS_CELL}>
        <LabelChips labelIds={task.labelIds} />
      </div>
      <div role='cell' className='flex justify-end @2xl:justify-start'>
        <AssigneePicker
          assigneeIds={task.assigneeIds}
          onChange={(assigneeIds) => onAssigneesChange(task.id, assigneeIds)}
        />
      </div>
      <div role='cell' className={DUE_CELL}>
        <DueDate task={task} />
      </div>
    </motion.div>
  );
}
