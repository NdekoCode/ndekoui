'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { Progress } from '@/registry/ndeko/ui/progress';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  SPRINT_ANCHOR,
  SPRINT_SECTION,
  SPRINT_TASKS,
  type SprintTask,
} from './data';
import { Reveal } from './reveal';
import { SESSION, tickPressKeyOf, type SprintState } from './sprint-session';

function titleOfId(id: string | null) {
  const task = SPRINT_TASKS.find((candidate) => candidate.id === id);
  if (!task) {
    return null;
  }
  return task.title;
}

function statusOf(state: SprintState) {
  const working = titleOfId(state.workingId);
  if (working !== null) {
    return `Working on: ${working}`;
  }
  if (state.doneIds.length === SPRINT_TASKS.length) {
    return 'Sprint done';
  }
  return 'Ready for the next task';
}

function rowToneOf(isWorking: boolean) {
  if (isWorking) {
    return 'bg-primary/[0.06]';
  }
  return 'bg-transparent';
}

function titleToneOf(isDone: boolean) {
  if (isDone) {
    return 'text-muted-foreground line-through';
  }
  return 'text-foreground';
}

type TaskRowProps = {
  task: SprintTask;
  isDone: boolean;
  isWorking: boolean;
  isTickPressed: boolean;
  onToggle: (id: string) => void;
};

function TaskRow({
  task,
  isDone,
  isWorking,
  isTickPressed,
  onToggle,
}: TaskRowProps) {
  function toggle() {
    onToggle(task.id);
  }

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl p-3 transition-colors duration-300',
        rowToneOf(isWorking)
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={toggle}
        aria-label={task.title}
        className={cn('size-5', pressedQuietOf(isTickPressed))}
      />
      <p
        className={cn(
          'min-w-0 flex-1 text-[13px] transition-colors duration-300',
          titleToneOf(isDone)
        )}
      >
        {task.title}
      </p>
      {isWorking && (
        <LoaderCircleIcon className='text-muted-foreground size-4 shrink-0 animate-spin' />
      )}
    </li>
  );
}

export function Sprint() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const doneCount = state.doneIds.length;
  const total = SPRINT_TASKS.length;
  const status = statusOf(state);
  const message = spokenUnless(isAutoplaying, status);
  useKeptHeight(ref);

  function toggle(id: string) {
    act({ type: 'toggled', id });
  }

  return (
    <section
      id={SPRINT_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='grid items-center gap-8 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16'
      >
        <SettleItem className='flex max-w-xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SPRINT_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SPRINT_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] min-h-[27rem] rounded-2xl p-2 @3xl:p-3'
          >
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <div className='flex items-center gap-3'>
                <MeshTile
                  seed={SPRINT_SECTION.agent}
                  color={seriesColorOf(3)}
                  size='lg'
                />
                <div className='flex min-w-0 flex-col gap-0.5'>
                  <p className='text-sm font-medium'>{SPRINT_SECTION.agent}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    <Swap swapKey={status}>{status}</Swap>
                  </p>
                </div>
                <p className='text-muted-foreground ms-auto shrink-0 text-xs tabular-nums'>
                  {SPRINT_SECTION.sprint}
                </p>
              </div>
              <Progress
                value={(doneCount / total) * 100}
                aria-label='Sprint progress'
                className='gap-0'
              />
              <p className='text-muted-foreground text-xs tabular-nums'>
                <MotionNumber value={doneCount} /> of {total} done
              </p>
              <ul className='flex flex-col'>
                {SPRINT_TASKS.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isDone={state.doneIds.includes(task.id)}
                    isWorking={state.workingId === task.id}
                    isTickPressed={pressed === tickPressKeyOf(task.id)}
                    onToggle={toggle}
                  />
                ))}
              </ul>
            </div>
            <LiveRegion message={message} />
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
