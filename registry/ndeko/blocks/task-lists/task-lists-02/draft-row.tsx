'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import type { StatusId } from './data';
import { heightPresenceOf } from './motion-parts';
import { IssueTypeGem, StatusGlyph } from './task-glyphs';
import {
  DRAFT_TITLE_CELL,
  ID_CELL,
  PRIORITY_CELL,
  ROW_CLASS,
  TASK_GRID,
} from './task-grid';
import { statusOf } from './task-model';

type DraftRowProps = {
  status: StatusId;
  onCreate: (title: string) => void;
  onCancel: () => void;
};

export function DraftRow({ status, onCreate, onCancel }: DraftRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const statusName = statusOf(status).name;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCreate(trimmed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  function handleBlur() {
    const isEmpty = title.trim().length === 0;
    if (isEmpty) {
      onCancel();
    }
  }

  return (
    <motion.div
      role='row'
      {...presence}
      className={cn(TASK_GRID, ROW_CLASS, 'bg-primary/[0.04]')}
    >
      <div role='cell' />
      <div role='cell' className={PRIORITY_CELL} />
      <div role='cell' className={cn(ID_CELL, 'text-muted-foreground text-xs')}>
        New
      </div>
      <div role='cell' className='flex size-7 items-center justify-center'>
        <StatusGlyph status={status} />
      </div>
      <div
        role='cell'
        className={cn('flex min-w-0 items-center gap-2', DRAFT_TITLE_CELL)}
      >
        <IssueTypeGem type='task' />
        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-label={`New task in ${statusName}`}
          placeholder='Task title'
          className='placeholder:text-muted-foreground/75 h-7 min-w-0 flex-1 bg-transparent text-base outline-none md:text-[13px]'
        />
        <Kbd className='hidden sm:inline-flex'>Enter</Kbd>
      </div>
    </motion.div>
  );
}
