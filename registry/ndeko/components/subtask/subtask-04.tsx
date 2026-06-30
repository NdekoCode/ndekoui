'use client';

import { useState } from 'react';

import { UserIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { Swap } from './_parts/motion-parts';
import { PEOPLE, personOf } from './_parts/people';
import { keyOf, SUBTASKS, type Subtask } from './_parts/subtask-data';
import {
  isStatusId,
  PersonAvatar,
  StatusGlyph,
  statusOf,
  STATUSES,
  type StatusId,
} from './_parts/subtask-parts';

const UNASSIGNED = 'unassigned';

const ROW_BUTTON =
  'hover:bg-foreground/5 focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]';

function patched(
  subtasks: Subtask[],
  subtaskId: string,
  changes: Partial<Subtask>
) {
  return subtasks.map((subtask) => {
    if (subtask.id !== subtaskId) {
      return subtask;
    }
    return { ...subtask, ...changes };
  });
}

function assigneeIdOf(value: unknown) {
  if (value === UNASSIGNED) {
    return undefined;
  }
  const isPerson = PEOPLE.some((person) => person.id === value);
  if (isPerson) {
    return String(value);
  }
  return undefined;
}

function StatusMenu({
  subtask,
  onPick,
}: {
  subtask: Subtask;
  onPick: (status: StatusId) => void;
}) {
  const meta = statusOf(subtask.status);

  function pick(value: unknown) {
    if (isStatusId(value)) {
      onPick(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status of ${subtask.title}: ${meta.name}. Change status`}
        className={cn(ROW_BUTTON, 'size-7')}
      >
        <Swap swapKey={subtask.status}>
          <StatusGlyph status={subtask.status} />
        </Swap>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-44'>
        <DropdownMenuRadioGroup value={subtask.status} onValueChange={pick}>
          {STATUSES.map((status) => (
            <DropdownMenuRadioItem
              key={status.id}
              value={status.id}
              closeOnClick
            >
              <StatusGlyph status={status.id} />
              {status.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssigneeFace({ assigneeId }: { assigneeId?: string }) {
  if (!assigneeId) {
    return (
      <span className='hairline-border border-foreground/30 text-muted-foreground flex size-5 items-center justify-center rounded-full border-dashed'>
        <UserIcon className='size-3' />
      </span>
    );
  }
  return <PersonAvatar person={personOf(assigneeId)} />;
}

function assigneeNameOf(assigneeId?: string) {
  if (!assigneeId) {
    return 'nobody';
  }
  return personOf(assigneeId).name;
}

function AssigneeMenu({
  subtask,
  onPick,
}: {
  subtask: Subtask;
  onPick: (assigneeId: string | undefined) => void;
}) {
  const value = subtask.assigneeId ?? UNASSIGNED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${subtask.title} is assigned to ${assigneeNameOf(subtask.assigneeId)}. Change assignee`}
        className={cn(ROW_BUTTON, 'size-7 rounded-full')}
      >
        <Swap swapKey={value}>
          <AssigneeFace assigneeId={subtask.assigneeId} />
        </Swap>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onPick(assigneeIdOf(next))}
        >
          <DropdownMenuRadioItem value={UNASSIGNED} closeOnClick>
            <AssigneeFace />
            No assignee
          </DropdownMenuRadioItem>
          {PEOPLE.map((person) => (
            <DropdownMenuRadioItem
              key={person.id}
              value={person.id}
              closeOnClick
            >
              <PersonAvatar person={person} />
              {person.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function countWith(subtasks: Subtask[], status: StatusId) {
  return subtasks.filter((subtask) => subtask.status === status).length;
}

function summaryOf(subtasks: Subtask[]) {
  const phrases: string[] = [];
  for (const status of STATUSES) {
    const count = countWith(subtasks, status.id);
    if (count === 0) {
      continue;
    }
    phrases.push(`${count} ${status.name.toLowerCase()}`);
  }
  return phrases.join(', ');
}

function StatusBreakdown({ subtasks }: { subtasks: Subtask[] }) {
  const summary = summaryOf(subtasks);

  return (
    <div className='flex flex-col gap-1.5'>
      <span aria-hidden='true' className='flex gap-0.5'>
        {subtasks.map((subtask) => {
          const segmentStyle = {
            backgroundColor: statusOf(subtask.status).color,
          } as React.CSSProperties;
          return (
            <span
              key={subtask.id}
              style={segmentStyle}
              className='h-1.5 flex-1 rounded-full opacity-80 transition-[background-color] duration-200'
            />
          );
        })}
      </span>
      <p className='text-muted-foreground text-xs'>{summary}</p>
    </div>
  );
}

export default function Subtask04() {
  const [subtasks, setSubtasks] = useState(SUBTASKS.slice(0, 6));

  function patch(subtaskId: string, changes: Partial<Subtask>) {
    setSubtasks((current) => patched(current, subtaskId, changes));
  }

  return (
    <section aria-label='Sub-tasks with status' className='w-full max-w-md'>
      <header className='flex flex-col gap-3 px-1.5'>
        <h3 className='text-sm font-medium'>Sub-tasks</h3>
        <StatusBreakdown subtasks={subtasks} />
      </header>
      <ul className='mt-3 flex flex-col'>
        {subtasks.map((subtask) => {
          const isFinished = subtask.status === 'done';
          return (
            <li
              key={subtask.id}
              className='flex h-10 items-center gap-2 rounded-lg px-1'
            >
              <StatusMenu
                subtask={subtask}
                onPick={(status) => patch(subtask.id, { status })}
              />
              <span className='text-muted-foreground w-16 shrink-0 text-xs tabular-nums'>
                {keyOf(subtask.number)}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[13px] transition-colors duration-200',
                  isFinished && 'text-muted-foreground'
                )}
              >
                {subtask.title}
              </span>
              <AssigneeMenu
                subtask={subtask}
                onPick={(assigneeId) => patch(subtask.id, { assigneeId })}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
