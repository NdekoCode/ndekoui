'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { heightPresenceOf, RollingCount } from './_parts/motion-parts';
import {
  isDone,
  SUBTASKS,
  withToggled,
  type Subtask,
} from './_parts/subtask-data';
import { StrikeTitle } from './_parts/subtask-parts';

const FIRST_SUBTASKS = SUBTASKS.slice(0, 3);

const FIRST_FREE_NUMBER = 230;

function nextNumberOf(subtasks: Subtask[]) {
  const numbers = subtasks.map((subtask) => subtask.number);
  return Math.max(FIRST_FREE_NUMBER, ...numbers) + 1;
}

function EditableRow({
  subtask,
  onToggle,
  onRemove,
}: {
  subtask: Subtask;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isChecked = isDone(subtask);

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='group/row hover:bg-foreground/[0.03] flex h-9 items-center gap-3 rounded-lg ps-2 pe-1'>
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggle}
          aria-label={`Done: ${subtask.title}`}
        />
        <StrikeTitle
          title={subtask.title}
          isDone={isChecked}
          className='flex-1'
        />
        <button
          type='button'
          onClick={onRemove}
          aria-label={`Remove ${subtask.title}`}
          className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-0 transition-opacity outline-none group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:ring-[3px] pointer-coarse:opacity-100'
        >
          <XIcon className='size-3.5' />
        </button>
      </div>
    </motion.li>
  );
}

export default function Subtask02() {
  const [subtasks, setSubtasks] = useState(FIRST_SUBTASKS);
  const [title, setTitle] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const trimmed = title.trim();
  const canAdd = trimmed.length > 0;

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) {
      return;
    }
    const subtask: Subtask = {
      id: `new-${nextNumberOf(subtasks)}`,
      number: nextNumberOf(subtasks),
      title: trimmed,
      status: 'todo',
    };
    setSubtasks((current) => [...current, subtask]);
    setTitle('');
    setAnnouncement(`Added ${trimmed}`);
  }

  function remove(subtask: Subtask) {
    setSubtasks((current) => current.filter((item) => item.id !== subtask.id));
    setAnnouncement(`Removed ${subtask.title}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setTitle('');
    }
  }

  return (
    <section aria-label='Sub-tasks' className='w-full max-w-md'>
      <header className='flex items-center justify-between gap-3 px-2'>
        <h3 className='text-sm font-medium'>Sub-tasks</h3>
        <span className='text-muted-foreground text-xs'>
          <RollingCount value={subtasks.length} /> in this task
        </span>
      </header>
      <ul className='mt-2'>
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <EditableRow
              key={subtask.id}
              subtask={subtask}
              onToggle={() =>
                setSubtasks((current) => withToggled(current, subtask.id))
              }
              onRemove={() => remove(subtask)}
            />
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={add}
        className='hairline-border border-foreground/20 focus-within:border-foreground/35 mt-1 flex h-9 items-center gap-3 rounded-lg border-dashed ps-2 pe-1.5 transition-colors'
      >
        <PlusIcon className='text-muted-foreground size-4 shrink-0' />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label='New sub-task title'
          placeholder='Add a sub-task'
          className='placeholder:text-muted-foreground/75 h-8 min-w-0 flex-1 bg-transparent text-base outline-none md:text-[13px]'
        />
        <Kbd
          aria-hidden='true'
          className={cn(
            'transition-opacity duration-150',
            !canAdd && 'opacity-0'
          )}
        >
          Enter
        </Kbd>
        <button type='submit' className='sr-only'>
          Add sub-task
        </button>
      </form>
      <p aria-live='polite' className='sr-only'>
        {announcement}
      </p>
    </section>
  );
}
