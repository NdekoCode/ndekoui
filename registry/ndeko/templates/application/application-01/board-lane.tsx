'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import {
  CARD_SURFACE,
  TRACKED_CARD,
  TaskCardBody,
  formatDuration,
} from './card-parts';
import type { BoardCard, LaneId, LaneMeta } from './board-model';

const SORT_TRANSITION = {
  duration: 220,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

const ENTER_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const CARD_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: ENTER_IN,
    transitionEnd: { overflow: 'visible' },
  },
};

const CARD_FADE: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: ENTER_IN },
};

function sortTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return null;
  }
  return SORT_TRANSITION;
}

function cardVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return CARD_FADE;
  }
  return CARD_PRESENCE;
}

function initialOf(isNew: boolean) {
  if (isNew) {
    return 'hidden';
  }
  return false;
}

function taskCountLabel(count: number) {
  if (count === 1) {
    return '1 task';
  }
  return `${count} tasks`;
}

function cardLabelOf(task: BoardCard) {
  const worked = formatDuration(task.workedMinutes);
  return `${task.number} ${task.title}, ${worked} worked`;
}

function LaneCount({ value }: { value: number }) {
  const label = taskCountLabel(value);

  return (
    <span className='bg-foreground/[0.06] text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-xs tabular-nums'>
      <span aria-hidden='true' className='inline-flex'>
        <MotionNumber value={value} />
      </span>
      <span className='sr-only'>{` ${label}`}</span>
    </span>
  );
}

export function LaneTile({ lane }: { lane: LaneMeta }) {
  const LaneGlyph = lane.icon;
  const tileStyle = { '--chip': lane.color } as React.CSSProperties;

  return (
    <span
      style={tileStyle}
      className='chip-3d flex size-5 shrink-0 items-center justify-center rounded-md'
    >
      <LaneGlyph className='size-3' strokeWidth={2.25} />
    </span>
  );
}

function SortableTaskCard({
  task,
  isNew,
}: {
  task: BoardCard;
  isNew: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const cardVariants = cardVariantsOf(shouldReduceMotion);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    transition: sortTransitionOf(shouldReduceMotion),
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <motion.li
      variants={cardVariants}
      initial={initialOf(isNew)}
      animate='shown'
    >
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        aria-label={cardLabelOf(task)}
        className={cn(
          CARD_SURFACE,
          task.isTracked && TRACKED_CARD,
          'focus-visible:ring-ring/25 cursor-grab touch-manipulation outline-none focus-visible:ring-[3px] active:cursor-grabbing',
          '[contain-intrinsic-size:auto_9rem] [content-visibility:auto]',
          isDragging && 'opacity-40'
        )}
      >
        <TaskCardBody task={task} />
      </div>
    </motion.li>
  );
}

function LaneComposer({
  laneLabel,
  onCreate,
  onClose,
}: {
  laneLabel: string;
  onCreate: (title: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  function changeTitle(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }
    onCreate(trimmed);
    setTitle('');
  }

  return (
    <form
      ref={formRef}
      onSubmit={create}
      className={cn(CARD_SURFACE, 'flex flex-col gap-2 p-2')}
    >
      <Input
        autoFocus
        value={title}
        placeholder='Task title'
        aria-label={`Title of the new task in ${laneLabel}`}
        onChange={changeTitle}
        onKeyDown={handleKeyDown}
      />
      <div className='flex items-center justify-end gap-1'>
        <Button type='button' variant='ghost' size='sm' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit' size='sm'>
          Add task
        </Button>
      </div>
    </form>
  );
}

type BoardLaneProps = {
  lane: LaneMeta;
  taskIds: string[];
  tasks: Record<string, BoardCard>;
  newTaskIds: ReadonlySet<string>;
  isTarget: boolean;
  isComposerOpen: boolean;
  emptyLine: string;
  menu?: React.ReactNode;
  onOpenComposer: (laneId: LaneId) => void;
  onCloseComposer: () => void;
  onCreateTask: (laneId: LaneId, title: string) => void;
};

/** A tinted lane whose body scrolls on its own. It takes drops anywhere, even when empty. */
export const BoardLane = memo(function BoardLane({
  lane,
  taskIds,
  tasks,
  newTaskIds,
  isTarget,
  isComposerOpen,
  emptyLine,
  menu,
  onOpenComposer,
  onCloseComposer,
  onCreateTask,
}: BoardLaneProps) {
  const { setNodeRef } = useDroppable({ id: lane.id });
  const shownIds = taskIds.filter((taskId) => Boolean(tasks[taskId]));
  const isEmpty = shownIds.length === 0;

  function openComposer() {
    onOpenComposer(lane.id);
  }

  function createTask(title: string) {
    onCreateTask(lane.id, title);
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={lane.label}
      className={cn(
        'flex max-h-full w-72 shrink-0 snap-start flex-col rounded-xl transition-colors duration-150',
        isTarget && 'bg-primary/[0.06]',
        !isTarget && 'bg-foreground/[0.03]'
      )}
    >
      <header className='flex h-11 shrink-0 items-center gap-2 pr-1.5 pl-3'>
        <LaneTile lane={lane} />
        <h2 className='min-w-0 truncate text-[13px] font-semibold'>
          {lane.label}
        </h2>
        <LaneCount value={shownIds.length} />
        <div className='ml-auto flex items-center'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Add a task to ${lane.label}`}
            onClick={openComposer}
            className='text-muted-foreground'
          >
            <PlusIcon />
          </Button>
          {menu}
        </div>
      </header>
      <div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pt-0.5 pb-2'>
        <SortableContext
          items={shownIds}
          strategy={verticalListSortingStrategy}
        >
          <ul className='flex flex-col gap-2'>
            {shownIds.map((taskId) => (
              <SortableTaskCard
                key={taskId}
                task={tasks[taskId]}
                isNew={newTaskIds.has(taskId)}
              />
            ))}
          </ul>
        </SortableContext>
        {isEmpty && (
          <div
            className={cn(
              'hairline-border text-muted-foreground flex h-20 items-center justify-center rounded-lg border-dashed px-3 text-center text-xs transition-colors duration-150',
              isTarget && 'border-primary/40',
              !isTarget && 'border-foreground/20'
            )}
          >
            {emptyLine}
          </div>
        )}
        {isComposerOpen && (
          <LaneComposer
            laneLabel={lane.label}
            onCreate={createTask}
            onClose={onCloseComposer}
          />
        )}
        {!isComposerOpen && (
          <button
            type='button'
            onClick={openComposer}
            className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 flex h-8 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]'
          >
            <PlusIcon className='size-4' />
            Create task
          </button>
        )}
      </div>
    </section>
  );
});
