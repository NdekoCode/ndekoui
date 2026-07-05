'use client';

import { Reorder, useDragControls, type Transition } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import { personOf } from './_parts/people';
import { keyOf, SUBTASKS, type Subtask } from './_parts/subtask-data';
import { PersonAvatar, StatusGlyph } from './_parts/subtask-parts';

const FIRST_SUBTASKS = SUBTASKS.slice(0, 5);

const ROW_TRANSITION: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const NO_TRANSITION: Transition = { duration: 0 };

const STEP_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex size-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-30';

function rowTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return NO_TRANSITION;
  }
  return ROW_TRANSITION;
}

function moved(subtasks: Subtask[], index: number, step: number) {
  const target = index + step;
  const isOutside = target < 0 || target >= subtasks.length;
  if (isOutside) {
    return subtasks;
  }
  const next = [...subtasks];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function stepOfKey(key: string) {
  if (key === 'ArrowUp') {
    return -1;
  }
  if (key === 'ArrowDown') {
    return 1;
  }
  return 0;
}

type FocusTarget = {
  id: string;
  control: 'grip' | 'up' | 'down';
};

type RowProps = {
  subtask: Subtask;
  index: number;
  total: number;
  onMove: (step: number, control: FocusTarget['control']) => void;
  registerControl: (
    control: FocusTarget['control'],
    node: HTMLButtonElement | null
  ) => void;
};

function ReorderRow({
  subtask,
  index,
  total,
  onMove,
  registerControl,
}: RowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const controls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const position = index + 1;

  function handleGripKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = stepOfKey(event.key);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    onMove(step, 'grip');
  }

  return (
    <Reorder.Item
      value={subtask}
      dragListener={false}
      dragControls={controls}
      transition={rowTransitionOf(shouldReduceMotion)}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        'group/row bg-card relative flex h-10 items-center gap-2 rounded-lg ps-1 pe-1.5',
        isDragging && 'surface-raised z-10'
      )}
    >
      <button
        type='button'
        ref={(node) => registerControl('grip', node)}
        onPointerDown={(event) => controls.start(event)}
        onKeyDown={handleGripKeyDown}
        aria-label={`Reorder ${subtask.title}, position ${position} of ${total}. Use the up and down arrow keys`}
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:cursor-grabbing'
      >
        <GripVerticalIcon className='size-4' />
      </button>
      <StatusGlyph status={subtask.status} />
      <span className='text-muted-foreground w-16 shrink-0 text-xs tabular-nums'>
        {keyOf(subtask.number)}
      </span>
      <span className='min-w-0 flex-1 truncate text-[13px]'>
        {subtask.title}
      </span>
      <span className='flex shrink-0 items-center opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100'>
        <button
          type='button'
          ref={(node) => registerControl('up', node)}
          disabled={isFirst}
          onClick={() => onMove(-1, 'up')}
          aria-label={`Move ${subtask.title} up`}
          className={STEP_BUTTON}
        >
          <ChevronUpIcon className='size-3.5' />
        </button>
        <button
          type='button'
          ref={(node) => registerControl('down', node)}
          disabled={isLast}
          onClick={() => onMove(1, 'down')}
          aria-label={`Move ${subtask.title} down`}
          className={STEP_BUTTON}
        >
          <ChevronDownIcon className='size-3.5' />
        </button>
      </span>
      {subtask.assigneeId && (
        <PersonAvatar person={personOf(subtask.assigneeId)} />
      )}
    </Reorder.Item>
  );
}

function controlKeyOf(id: string, control: FocusTarget['control']) {
  return `${id}:${control}`;
}

export default function Subtask03() {
  const [subtasks, setSubtasks] = useState(FIRST_SUBTASKS);
  const [announcement, setAnnouncement] = useState('');
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const controlNodes = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!focusTarget) {
      return;
    }
    const key = controlKeyOf(focusTarget.id, focusTarget.control);
    const node = controlNodes.current.get(key);
    const canFocus = node !== undefined && !node.disabled;
    if (canFocus) {
      node.focus();
      return;
    }
    const grip = controlNodes.current.get(controlKeyOf(focusTarget.id, 'grip'));
    grip?.focus();
  }, [focusTarget, subtasks]);

  function register(
    id: string,
    control: FocusTarget['control'],
    node: HTMLButtonElement | null
  ) {
    const key = controlKeyOf(id, control);
    if (node) {
      controlNodes.current.set(key, node);
      return;
    }
    controlNodes.current.delete(key);
  }

  function move(
    subtask: Subtask,
    step: number,
    control: FocusTarget['control']
  ) {
    const index = subtasks.findIndex((item) => item.id === subtask.id);
    const next = moved(subtasks, index, step);
    if (next === subtasks) {
      return;
    }
    const position = next.findIndex((item) => item.id === subtask.id) + 1;
    setSubtasks(next);
    setFocusTarget({ id: subtask.id, control });
    setAnnouncement(
      `${subtask.title} moved to position ${position} of ${next.length}`
    );
  }

  return (
    <section aria-label='Sub-tasks in order' className='w-full max-w-md'>
      <header className='flex items-baseline justify-between gap-3 px-2'>
        <h3 className='text-sm font-medium'>Sub-tasks</h3>
        <p className='text-muted-foreground text-xs'>
          Drag the handle or use its arrow keys
        </p>
      </header>
      <Reorder.Group
        axis='y'
        values={subtasks}
        onReorder={setSubtasks}
        className='mt-2 flex flex-col gap-0.5'
      >
        {subtasks.map((subtask, index) => (
          <ReorderRow
            key={subtask.id}
            subtask={subtask}
            index={index}
            total={subtasks.length}
            onMove={(step, control) => move(subtask, step, control)}
            registerControl={(control, node) =>
              register(subtask.id, control, node)
            }
          />
        ))}
      </Reorder.Group>
      <p aria-live='polite' className='sr-only'>
        {announcement}
      </p>
    </section>
  );
}
