'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { heightPresenceOf, RollingCount } from './_parts/motion-parts';
import { personOf } from './_parts/people';
import {
  doneCountOf,
  isDone,
  SUBTASKS,
  withToggled,
} from './_parts/subtask-data';
import {
  PersonAvatar,
  SegmentMeter,
  StrikeTitle,
} from './_parts/subtask-parts';

export default function Subtask06() {
  const shouldReduceMotion = useReducedMotion();
  const [subtasks, setSubtasks] = useState(SUBTASKS);
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const doneCount = doneCountOf(subtasks);
  const total = subtasks.length;
  const states = subtasks.map(isDone);

  return (
    <section
      aria-label='Sub-tasks'
      className='bg-foreground/[0.025] w-full max-w-md rounded-xl p-1'
    >
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((current) => !current)}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex w-full cursor-pointer flex-col gap-2 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-[3px]'
      >
        <span className='flex w-full items-center gap-2'>
          <span className='text-[13px] font-medium'>Sub-tasks</span>
          <span className='text-muted-foreground text-xs'>
            <RollingCount value={doneCount} /> of {total} done
          </span>
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground ms-auto size-4 transition-transform duration-200 ease-(--ease-out-strong)',
              isOpen && 'rotate-180'
            )}
          />
        </span>
        <SegmentMeter states={states} className='w-full' />
      </button>
      <div id={listId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              {...heightPresenceOf(shouldReduceMotion)}
              className='overflow-hidden'
            >
              {subtasks.map((subtask) => {
                const isChecked = isDone(subtask);
                return (
                  <li key={subtask.id}>
                    <label className='hover:bg-foreground/[0.03] flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3'>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                          setSubtasks((current) =>
                            withToggled(current, subtask.id)
                          )
                        }
                      />
                      <StrikeTitle title={subtask.title} isDone={isChecked} />
                      {subtask.assigneeId && (
                        <PersonAvatar
                          person={personOf(subtask.assigneeId)}
                          className='ms-auto'
                        />
                      )}
                    </label>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
