'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

import type { Lane, LaneId } from './data';
import type { Task } from './session';
import { cardClassOf, TaskCardBody } from './task-card';

const LANE_DOT: Record<LaneId, string> = {
  running: 'bg-info',
  review: 'bg-warning',
  done: 'bg-success',
};

function tasksWordOf(count: number) {
  if (count === 1) {
    return 'task';
  }
  return 'tasks';
}

/** The ring shows the target at every width; the tray only exists side by side. */
function laneToneOf(isTarget: boolean) {
  if (isTarget) {
    return 'ring-primary/25 ring-2 @3xl:bg-primary/[0.06]';
  }
  return 'ring-0 ring-transparent @3xl:bg-foreground/[0.03]';
}

function slotToneOf(isTarget: boolean) {
  if (isTarget) {
    return 'border-primary/40';
  }
  return 'border-foreground/20';
}

type DraggableCardProps = {
  task: Task;
  placement: string;
  travel: Transition;
  pressed: string | null;
  onApprove: (id: string) => void;
  onSendBack: (id: string, note: string) => void;
  onMove: (id: string, to: LaneId) => void;
};

/**
 * A card that changes lane keeps its layout id, so it travels to its new place. A card a person
 * dropped takes a new one: it is already where it was let go.
 */
function DraggableCard({
  task,
  placement,
  travel,
  pressed,
  onApprove,
  onSendBack,
  onMove,
}: DraggableCardProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: task.id });

  return (
    <motion.li
      layout='position'
      layoutId={`${task.id}:${task.drops}`}
      layoutDependency={placement}
      transition={{ layout: travel }}
      className='relative'
    >
      <div
        ref={setNodeRef}
        {...listeners}
        className={cn(
          'cursor-grab touch-manipulation select-none active:cursor-grabbing',
          cardClassOf(isDragging)
        )}
      >
        <TaskCardBody
          task={task}
          pressed={pressed}
          onApprove={onApprove}
          onSendBack={onSendBack}
          onMove={onMove}
        />
      </div>
    </motion.li>
  );
}

export type BoardLaneProps = {
  lane: Lane;
  tasks: Task[];
  /** Where every task sits: the cards and the lane header measure again when it changes. */
  placement: string;
  pressed: string | null;
  onApprove: (id: string) => void;
  onSendBack: (id: string, note: string) => void;
  onMove: (id: string, to: LaneId) => void;
};

/** A lane takes a drop anywhere, even when it is empty. On a phone the lanes stack and lose their tray. */
export function BoardLane({
  lane,
  tasks,
  placement,
  pressed,
  onApprove,
  onSendBack,
  onMove,
}: BoardLaneProps) {
  const shouldReduceMotion = useReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const { setNodeRef, isOver } = useDroppable({ id: lane.id });
  const count = tasks.length;
  const isEmpty = count === 0;

  return (
    <section
      ref={setNodeRef}
      aria-label={lane.label}
      className={cn(
        'flex flex-col gap-2 rounded-xl transition-[background-color,box-shadow] duration-150 @3xl:p-2',
        laneToneOf(isOver)
      )}
    >
      <motion.header
        layout='position'
        layoutDependency={placement}
        transition={{ layout: travel }}
        className='flex h-8 items-center gap-2 @3xl:px-1'
      >
        <span
          aria-hidden='true'
          className={cn('size-2 shrink-0 rounded-full', LANE_DOT[lane.id])}
        />
        <h2 className='text-[13px] font-medium'>{lane.label}</h2>
        <LayoutGroup inherit={false}>
          <span className='bg-foreground/[0.06] text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-xs'>
            <MotionNumber value={count} />
            <span className='sr-only'> {tasksWordOf(count)}</span>
          </span>
        </LayoutGroup>
      </motion.header>
      <ul className='flex flex-col gap-2'>
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            placement={placement}
            travel={travel}
            pressed={pressed}
            onApprove={onApprove}
            onSendBack={onSendBack}
            onMove={onMove}
          />
        ))}
      </ul>
      {isEmpty && (
        <p
          className={cn(
            'hairline-border text-muted-foreground flex min-h-16 items-center justify-center rounded-lg border-dashed px-3 py-2 text-center text-xs transition-colors duration-150',
            slotToneOf(isOver)
          )}
        >
          {lane.emptyLine}
        </p>
      )}
    </section>
  );
}
