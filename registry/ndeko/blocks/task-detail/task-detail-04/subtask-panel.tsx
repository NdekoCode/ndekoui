'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { Subtask } from './data';
import { heightPresenceOf } from './motion-parts';
import { PersonAvatar, StrikeTitle } from './work-glyphs';
import { keyOf, personOf } from './work-model';

function SubtaskRow({
  subtask,
  onToggle,
}: {
  subtask: Subtask;
  onToggle: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <label className='hover:bg-foreground/[0.03] flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2'>
        <Checkbox checked={subtask.isDone} onCheckedChange={onToggle} />
        <span className='text-muted-foreground hidden w-16 shrink-0 text-xs tabular-nums sm:inline'>
          {keyOf(subtask.number)}
        </span>
        <StrikeTitle
          title={subtask.title}
          isDone={subtask.isDone}
          className='flex-1'
        />
        {subtask.assigneeId && (
          <PersonAvatar
            person={personOf(subtask.assigneeId)}
            className='size-5 text-[9px]'
          />
        )}
      </label>
    </motion.li>
  );
}

type SubtaskPanelProps = {
  subtasks: Subtask[];
  onToggle: (subtaskId: string) => void;
  onAdd: (title: string) => void;
};

export function SubtaskPanel({ subtasks, onToggle, onAdd }: SubtaskPanelProps) {
  const [title, setTitle] = useState('');
  const trimmed = title.trim();
  const canAdd = trimmed.length > 0;

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) {
      return;
    }
    onAdd(trimmed);
    setTitle('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setTitle('');
    }
  }

  return (
    <div className='flex flex-col gap-1'>
      <ul>
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              onToggle={() => onToggle(subtask.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={add}
        className='hairline-border border-foreground/20 focus-within:border-foreground/35 flex h-9 items-center gap-3 rounded-lg border-dashed ps-2 pe-1.5 transition-colors'
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
    </div>
  );
}
