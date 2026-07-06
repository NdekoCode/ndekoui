'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { QUEUE, TASKS, type QueueTask } from './cta-data';
import type { TaskStatus } from './cta-session';

const STATUS_WORD: Record<TaskStatus, string> = {
  open: 'Open',
  working: 'Working',
  done: 'Done',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const STATUS_RANK: Record<TaskStatus, number> = {
  open: 0,
  working: 1,
  done: 2,
};

function StatusGlyph({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (status === 'working') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
  );
}

function dimmedOf(status: TaskStatus) {
  if (status === 'done') {
    return 'opacity-60';
  }
  return undefined;
}

type QueueRowProps = {
  task: QueueTask;
  status: TaskStatus;
};

function QueueRow({ task, status }: QueueRowProps) {
  const word = STATUS_WORD[status];

  return (
    <li
      className={cn(
        'bg-card dark:bg-foreground/[0.06] flex h-11 items-center gap-3 rounded-lg px-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 ease-(--ease-out-strong)',
        dimmedOf(status)
      )}
    >
      <span className='flex size-[18px] shrink-0 items-center justify-center'>
        <Swap swapKey={status}>
          <StatusGlyph status={status} />
        </Swap>
      </span>
      <span className='min-w-0 flex-1 truncate text-[13px]'>
        <span className='sr-only'>{word}: </span>
        {task.title}
      </span>
      <span
        aria-hidden='true'
        className='text-muted-foreground w-14 shrink-0 text-end text-xs'
      >
        <WordRoll
          text={word}
          labels={STATUS_WORDS}
          value={STATUS_RANK[status]}
        />
      </span>
    </li>
  );
}

type QueueCardProps = {
  tasks: TaskStatus[];
  resolved: number;
};

export function QueueCard({ tasks, resolved }: QueueCardProps) {
  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-3'>
      <div className='flex items-center justify-between gap-3 px-1'>
        <div className='flex min-w-0 items-center gap-2'>
          <h3 className='text-sm font-medium'>{QUEUE.title}</h3>
          <Badge variant='secondary'>{QUEUE.badge}</Badge>
        </div>
        <p className='text-muted-foreground flex shrink-0 items-baseline gap-1 text-xs tabular-nums'>
          <MotionNumber value={resolved} />
          <span>of {TASKS.length} done</span>
        </p>
      </div>
      <ul aria-label='Tasks of the close' className='flex flex-col gap-1.5'>
        {TASKS.map((task, index) => (
          <QueueRow key={task.id} task={task} status={tasks[index]} />
        ))}
      </ul>
    </div>
  );
}
