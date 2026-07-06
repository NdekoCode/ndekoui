'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { type Commitment, COMMITMENTS, NEW_COMMITMENT } from './data';
import { useRestingState } from './use-resting-state';

type NotesState = {
  hasNew: boolean;
  doneIds: string[];
};

const FIRST: NotesState = { hasNew: false, doneIds: [] };

const RESTING: NotesState = {
  hasNew: true,
  doneIds: ['quote', 'contract'],
};

function listOf(state: NotesState) {
  if (state.hasNew) {
    return [NEW_COMMITMENT, ...COMMITMENTS];
  }
  return COMMITMENTS;
}

function isDoneIn(state: NotesState, id: string) {
  return state.doneIds.includes(id);
}

function toggled(state: NotesState, id: string): NotesState {
  if (isDoneIn(state, id)) {
    const remaining = state.doneIds.filter((doneId) => doneId !== id);
    return { ...state, doneIds: remaining };
  }
  return { ...state, doneIds: [...state.doneIds, id] };
}

function openCountOf(state: NotesState) {
  const list = listOf(state);
  const open = list.filter((item) => !isDoneIn(state, item.id));
  return open.length;
}

type PromiseRowProps = {
  item: Commitment;
  isDone: boolean;
  onToggle: () => void;
};

function PromiseRow({ item, isDone, onToggle }: PromiseRowProps) {
  return (
    <div className='flex items-center gap-3 px-2.5 py-2.5'>
      <button
        type='button'
        role='checkbox'
        aria-checked={isDone}
        aria-label={`Mark "${item.text}" as done`}
        onClick={onToggle}
        className='focus-visible:ring-ring relative flex size-5 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      >
        <span
          aria-hidden='true'
          className='hairline-ring ring-foreground/25 absolute size-[18px] rounded-full'
        />
        <AnimatePresence initial={false}>
          {isDone && (
            <DrawnCheck key='check' tone='success' className='absolute' />
          )}
        </AnimatePresence>
      </button>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[13px] transition-colors duration-200',
          isDone && 'text-muted-foreground line-through'
        )}
      >
        {item.text}
      </span>
      <Badge variant='secondary' className='text-muted-foreground'>
        {item.due}
      </Badge>
    </div>
  );
}

export function NotesDemo() {
  const [state, setState] = useState<NotesState>(FIRST);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const steps = [
    { after: 1500, run: () => setState({ ...FIRST, hasNew: true }) },
    {
      after: 1700,
      run: () => setState((current) => toggled(current, 'quote')),
    },
    {
      after: 1500,
      run: () => setState((current) => toggled(current, 'contract')),
    },
    { after: 3400, run: hold },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 1200,
    onReset: () => setState(FIRST),
  });
  const list = listOf(state);
  const openCount = openCountOf(state);

  useKeptHeight(ref);
  useRestingState<NotesState>(shouldReduceMotion, RESTING, setState);

  return (
    <div
      ref={ref}
      className='bg-card hairline-ring ring-border flex w-full max-w-sm flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]'
    >
      <div className='flex items-center justify-between gap-3 px-1 pt-1'>
        <p className='text-muted-foreground text-xs font-medium'>
          Promises this week
        </p>
        <p
          aria-live='polite'
          className='text-muted-foreground flex items-center gap-1 text-xs'
        >
          <MotionNumber
            value={openCount}
            className='text-foreground font-medium'
          />
          open
        </p>
      </div>
      <ul className='bg-foreground/[0.04] flex flex-col rounded-lg'>
        <AnimatePresence initial={false}>
          {list.map((item) => (
            <motion.li key={item.id} {...presence} className='overflow-hidden'>
              <PromiseRow
                item={item}
                isDone={isDoneIn(state, item.id)}
                onToggle={() =>
                  setState((current) => toggled(current, item.id))
                }
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
