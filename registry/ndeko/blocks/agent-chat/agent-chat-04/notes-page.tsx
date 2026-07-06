'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CalendarIcon, FeatherIcon } from '@/registry/ndeko/lib/icons';
import {
  risePresenceOf,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { summaryTextOf, type Note, type Owner, type Todo } from './data';
import type { DoneBy } from './session';

const SHARE_LABELS: Record<MorphState, string> = {
  idle: 'Share with the team',
  busy: 'Sharing',
  done: 'Shared',
};

function OwnerMark({ owner }: { owner: Owner }) {
  if (owner.isAssistant) {
    return (
      <span
        aria-hidden='true'
        className='gem-plate inline-flex size-4 items-center justify-center rounded-full [--gem:var(--primary)]'
      >
        <FeatherIcon className='size-2.5' />
      </span>
    );
  }
  return <Avatar className='size-4' seed={owner.name} />;
}

const PILL =
  'bg-foreground/[0.05] inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs';

function todoTextOf(isDone: boolean) {
  if (isDone) {
    return 'text-muted-foreground line-through';
  }
  return 'text-foreground';
}

type TodoRowProps = {
  todo: Todo;
  doneBy: DoneBy | undefined;
  onToggle: (id: string) => void;
};

function TodoRow({ todo, doneBy, onToggle }: TodoRowProps) {
  const isDone = doneBy !== undefined;
  const isByAssistant = doneBy === 'assistant';

  return (
    <div className='flex flex-wrap items-start gap-x-2.5 gap-y-1 py-1.5'>
      <button
        type='button'
        role='checkbox'
        aria-checked={isDone}
        aria-label={todo.text}
        onClick={() => onToggle(todo.id)}
        className='focus-visible:ring-ring/40 mt-0.5 flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-[3px] active:scale-[0.97]'
      >
        {isDone && <DrawnCheck entrance='draw' />}
        {!isDone && (
          <span className='hairline-ring ring-foreground/30 hover:ring-foreground/60 size-[18px] rounded-full transition-shadow duration-150' />
        )}
      </button>
      <div className='flex min-w-40 flex-1 flex-col'>
        <span
          className={cn(
            'text-[13px] leading-[1.375rem] transition-colors duration-200',
            todoTextOf(isDone)
          )}
        >
          {todo.text}
        </span>
        <Fold open={isByAssistant}>
          <span className='text-muted-foreground flex h-6 items-center gap-2 text-xs'>
            Done by assistant
            <button
              type='button'
              onClick={() => onToggle(todo.id)}
              className='text-primary-ink focus-visible:ring-ring/25 cursor-pointer rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
            >
              Undo
            </button>
          </span>
        </Fold>
      </div>
      <div className='flex items-center gap-1.5 ps-7 @md:ps-0'>
        <span className={PILL}>
          <OwnerMark owner={todo.owner} />
          {todo.owner.name}
        </span>
        <span className={cn(PILL, 'text-muted-foreground tabular-nums')}>
          <CalendarIcon className='size-3' />
          {todo.due}
        </span>
      </div>
    </div>
  );
}

function modeWordOf(isEnded: boolean) {
  if (isEnded) {
    return 'Summary of the call';
  }
  return 'Live notes';
}

function EmptyLine({ text }: { text: string }) {
  return <p className='text-muted-foreground py-1.5 text-[13px]'>{text}</p>;
}

type NotesPageProps = {
  title: string;
  notes: Note[];
  todos: Todo[];
  doneBy: Record<string, DoneBy>;
  isEnded: boolean;
  share: MorphState;
  onToggleTodo: (id: string) => void;
  onShare: () => void;
};

export function NotesPage({
  title,
  notes,
  todos,
  doneBy,
  isEnded,
  share,
  onToggleTodo,
  onShare,
}: NotesPageProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const risePresence = risePresenceOf(shouldReduceMotion);
  const modeWord = modeWordOf(isEnded);
  const hasNotes = notes.length > 0;
  const hasTodos = todos.length > 0;

  return (
    <section
      aria-label='Notes'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-w-0 flex-1 flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:p-6'
    >
      <header className='flex min-h-9 flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-col'>
          <h2 className='text-lg leading-tight font-semibold'>{title}</h2>
          <Swap swapKey={modeWord} className='text-muted-foreground text-xs'>
            {modeWord}
          </Swap>
        </div>
        <AnimatePresence initial={false}>
          {isEnded && (
            <motion.div
              key='actions'
              className='flex items-center gap-1.5'
              {...risePresence}
            >
              <CopyButton
                text={summaryTextOf(notes, todos)}
                label='Copy the summary'
              />
              <MorphButton
                type='button'
                size='sm'
                variant='outline'
                state={share}
                labels={SHARE_LABELS}
                onClick={onShare}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-xs'>Notes</h3>
        {!hasNotes && (
          <EmptyLine text='Notes are written here as they are said' />
        )}
        <ul className='flex flex-col'>
          <AnimatePresence initial={false}>
            {notes.map((note) => (
              <motion.li
                key={note.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <p className='flex gap-2.5 py-1.5 text-[13px] leading-snug'>
                  <span
                    aria-hidden='true'
                    className='bg-foreground/40 mt-[7px] size-1 shrink-0 rounded-full'
                  />
                  {note.text}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-xs'>To-dos</h3>
        {!hasTodos && (
          <EmptyLine text='To-dos get an owner and a date when they come up' />
        )}
        <ul className='flex flex-col'>
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.li
                key={todo.id}
                className='-mx-1 overflow-hidden px-1'
                {...rowPresence}
              >
                <TodoRow
                  todo={todo}
                  doneBy={doneBy[todo.id]}
                  onToggle={onToggleTodo}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
