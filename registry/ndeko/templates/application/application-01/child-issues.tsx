'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import type { ChildIssue, StatusId } from './data';
import { heightPresenceOf, Swap } from './motion-parts';
import { PersonAvatar, StatusGlyph } from './task-glyphs';
import { keyOf, personOf, statusOf } from './task-model';

const RING_RADIUS = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ADD_ROW =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hairline-border border-dashed border-foreground/20 outline-none transition-colors duration-150';

function shareOf(done: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return done / total;
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const share = shareOf(done, total);
  const offset = RING_CIRCUMFERENCE * (1 - share);

  return (
    <svg viewBox='0 0 16 16' aria-hidden='true' className='size-4 -rotate-90'>
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        className='text-foreground/10'
      />
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        stroke='var(--success)'
        strokeWidth='2'
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        className='transition-[stroke-dashoffset] duration-300 ease-(--ease-out-strong)'
      />
    </svg>
  );
}

function nextStatusOf(status: StatusId): StatusId {
  if (status === 'done') {
    return 'todo';
  }
  return 'done';
}

function toggleLabelOf(child: ChildIssue) {
  const key = keyOf(child.number);
  if (child.status === 'done') {
    return `Reopen ${key}`;
  }
  return `Mark ${key} as done`;
}

function assigneeOf(child: ChildIssue) {
  if (!child.assigneeId) {
    return undefined;
  }
  return personOf(child.assigneeId);
}

function ChildRow({
  child,
  onToggle,
}: {
  child: ChildIssue;
  onToggle: (childId: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const isDone = child.status === 'done';
  const assignee = assigneeOf(child);

  return (
    <motion.li {...presence} className='overflow-hidden'>
      <div className='flex h-9 items-center gap-2.5 px-1.5'>
        <button
          type='button'
          aria-label={toggleLabelOf(child)}
          onClick={() => onToggle(child.id)}
          className='hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
        >
          <Swap swapKey={child.status}>
            <StatusGlyph status={child.status} />
          </Swap>
        </button>
        <span className='text-muted-foreground w-14 shrink-0 text-xs tabular-nums'>
          {keyOf(child.number)}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[13px]',
            isDone && 'text-muted-foreground line-through'
          )}
        >
          {child.title}
        </span>
        <span className='sr-only'>{statusOf(child.status).name}</span>
        {assignee && <PersonAvatar person={assignee} className='me-1' />}
      </div>
    </motion.li>
  );
}

type ChildIssuesProps = {
  items: ChildIssue[];
  nextNumber: number;
  onChange: (items: ChildIssue[]) => void;
};

export function ChildIssues({ items, nextNumber, onChange }: ChildIssuesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const doneCount = items.filter((child) => child.status === 'done').length;
  const hasItems = items.length > 0;

  function toggle(childId: string) {
    const next = items.map((child) => {
      if (child.id !== childId) {
        return child;
      }
      return { ...child, status: nextStatusOf(child.status) };
    });
    onChange(next);
  }

  function add() {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    const child: ChildIssue = {
      id: `child-${nextNumber}`,
      number: nextNumber,
      title: trimmed,
      status: 'todo',
    };
    onChange([...items, child]);
    setTitle('');
  }

  function stopAdding() {
    setIsAdding(false);
    setTitle('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stopAdding();
    }
  }

  function handleBlur() {
    const isEmpty = title.trim().length === 0;
    if (isEmpty) {
      stopAdding();
    }
  }

  return (
    <section aria-label='Child issues'>
      <div className='flex h-7 items-center gap-2'>
        <h3 className='text-[13px] font-medium'>Child issues</h3>
        {hasItems && (
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums'>
            <ProgressRing done={doneCount} total={items.length} />
            <span aria-hidden='true' className='flex'>
              <MotionNumber value={doneCount} />/
              <MotionNumber value={items.length} />
            </span>
            <span className='sr-only'>
              {doneCount} of {items.length} done
            </span>
          </span>
        )}
      </div>
      <div className='mt-2 flex flex-col gap-2'>
        {hasItems && (
          <ul className='bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-clip rounded-lg'>
            <AnimatePresence initial={false}>
              {items.map((child) => (
                <ChildRow key={child.id} child={child} onToggle={toggle} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {!isAdding && (
          <button
            type='button'
            onClick={() => setIsAdding(true)}
            className={cn(
              ADD_ROW,
              'hover:border-foreground/35 hover:text-foreground focus-visible:ring-ring/25 cursor-pointer focus-visible:ring-[3px]'
            )}
          >
            <PlusIcon className='size-4' />
            Add child issue
          </button>
        )}
        {isAdding && (
          <div className={cn(ADD_ROW, 'border-foreground/35 text-foreground')}>
            <StatusGlyph status='todo' />
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              aria-label='Child issue title'
              placeholder='Child issue title, then Enter'
              className='placeholder:text-muted-foreground/75 h-7 min-w-0 flex-1 bg-transparent text-base outline-none md:text-[13px]'
            />
          </div>
        )}
      </div>
    </section>
  );
}
