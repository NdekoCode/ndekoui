'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

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
  GUTTER_CELL,
  ID_CELL,
  LABELS_CELL,
  PRIORITY_CELL,
  ROW_CLASS,
  SELECTED_ROW,
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
  isSelected: boolean;
  onSelect: (taskId: string, isSelected: boolean, isRange: boolean) => void;
};

function isRangeEvent(event: Event) {
  const isPointer = event instanceof MouseEvent;
  const isKey = event instanceof KeyboardEvent;
  if (isPointer || isKey) {
    return event.shiftKey;
  }
  return false;
}

function keepTextUnselected(event: React.MouseEvent) {
  if (event.shiftKey) {
    event.preventDefault();
  }
}

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
  isSelected,
  onSelect,
  onStatusChange,
  onPriorityChange,
  onAssigneesChange,
}: TaskRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const isDone = task.status === 'done';
  const tracker = trackerOf(task);
  const isTracked = Boolean(tracker);

  return (
    <motion.div
      role='row'
      {...presence}
      className={cn(
        TASK_GRID,
        ROW_CLASS,
        isSelected && SELECTED_ROW,
        isTracked && TRACKED_ROW
      )}
    >
      <div role='cell' className={GUTTER_CELL}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked, details) =>
            onSelect(task.id, checked, isRangeEvent(details.event))
          }
          onMouseDown={keepTextUnselected}
          aria-label={`Select ${taskKeyOf(task)}`}
        />
      </div>
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
