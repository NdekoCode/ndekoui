'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { ChildIssues } from './child-issues';
import { CommentComposer } from './comment-composer';
import { TASKS, type TaskDetail } from './data';
import { DescriptionBlock } from './description-block';
import {
  countLabel,
  keyOf,
  nextNumberOf,
  peopleOf,
  taskUrlOf,
  type FeedFilter,
} from './detail-model';
import { DrawerBar } from './drawer-bar';
import { PropertyRows } from './property-rows';
import { TaskBand } from './task-band';
import { commentOf, patchedTask, withComment } from './task-edits';
import { TaskFeed } from './task-feed';
import { IssueTypeGem, PeopleStack, StatusGlyph } from './task-glyphs';

const IGNORED_KEY_TARGETS =
  'input, textarea, select, [contenteditable="true"], [role="menu"]';

function isIgnoredKey(event: KeyboardEvent) {
  const isCommand = event.metaKey || event.ctrlKey;
  if (isCommand || event.altKey) {
    return true;
  }
  if (!(event.target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(event.target.closest(IGNORED_KEY_TARGETS));
}

function stepOfKey(key: string) {
  const lowered = key.toLowerCase();
  if (lowered === 'j') {
    return 1;
  }
  if (lowered === 'k') {
    return -1;
  }
  return 0;
}

function positionOf(tasks: TaskDetail[], taskId: string) {
  const index = tasks.findIndex((task) => task.id === taskId);
  return Math.max(0, index);
}

function replacedTask(
  tasks: TaskDetail[],
  taskId: string,
  update: (task: TaskDetail) => TaskDetail
) {
  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }
    return update(task);
  });
}

export default function TaskDetail01() {
  const [tasks, setTasks] = useState<TaskDetail[]>(TASKS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shownId, setShownId] = useState(TASKS[0].id);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [freshItemId, setFreshItemId] = useState<string | null>(null);
  const isOpen = openId !== null;
  const position = positionOf(tasks, shownId);
  const task = tasks[position];

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function walk(event: KeyboardEvent) {
      if (isIgnoredKey(event)) {
        return;
      }
      const step = stepOfKey(event.key);
      if (step === 0) {
        return;
      }
      const next = tasks[position + step];
      if (!next) {
        return;
      }
      event.preventDefault();
      setOpenId(next.id);
      setShownId(next.id);
    }
    document.addEventListener('keydown', walk);
    return () => document.removeEventListener('keydown', walk);
  }, [isOpen, position, tasks]);

  function open(taskId: string) {
    setOpenId(taskId);
    setShownId(taskId);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setOpenId(null);
    }
  }

  function step(delta: number) {
    const next = tasks[position + delta];
    if (next) {
      open(next.id);
    }
  }

  function patch(changes: Partial<TaskDetail>) {
    setTasks((current) =>
      replacedTask(current, task.id, (item) => patchedTask(item, changes))
    );
  }

  function postComment(body: string) {
    const comment = commentOf(body);
    setTasks((current) =>
      replacedTask(current, task.id, (item) => withComment(item, comment))
    );
    setFreshItemId(comment.id);
    if (feedFilter === 'history') {
      setFeedFilter('all');
    }
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-6 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-sm font-semibold'>Cycle 14</h1>
        <p className='text-muted-foreground text-xs'>
          Nov 2 to Nov 15 · {countLabel(tasks.length, 'task', 'tasks')}
        </p>
        <ul className='bg-card hairline-ring ring-border hairline-divide-y divide-border mt-4 overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          {tasks.map((item) => {
            const isCurrent = isOpen && item.id === shownId;
            return (
              <li key={item.id}>
                <button
                  type='button'
                  aria-haspopup='dialog'
                  onClick={() => open(item.id)}
                  className={cn(
                    'hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] flex h-11 w-full cursor-pointer items-center gap-3 px-3 text-left outline-none',
                    isCurrent && 'bg-primary/[0.06] hover:bg-primary/[0.08]'
                  )}
                >
                  <StatusGlyph status={item.status} />
                  <span className='text-muted-foreground hidden w-14 shrink-0 text-xs tabular-nums sm:inline'>
                    {keyOf(item.number)}
                  </span>
                  <IssueTypeGem type={item.type} />
                  <span className='min-w-0 flex-1 truncate text-[13px]'>
                    {item.title}
                  </span>
                  <PeopleStack
                    people={peopleOf(item.assigneeIds)}
                    ringClassName='ring-card'
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          showCloseButton={false}
          className='w-[calc(100%-1rem)] max-w-[42rem] gap-0 overflow-hidden p-0'
        >
          <DrawerBar
            position={position + 1}
            total={tasks.length}
            link={taskUrlOf(task.number)}
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
          />
          <div
            key={task.id}
            className='@container min-h-0 flex-1 overflow-y-auto px-5 pb-6'
          >
            <TaskBand task={task} />
            <SheetTitle className='mt-5 text-xl leading-snug font-semibold text-balance'>
              {task.title}
            </SheetTitle>
            {task.parent && (
              <p className='text-muted-foreground mt-1 text-xs'>
                Part of {keyOf(task.parent.number)} {task.parent.title}
              </p>
            )}
            <div className='mt-5'>
              <PropertyRows task={task} onPatch={patch} columns={2} />
            </div>
            <div className='mt-8'>
              <DescriptionBlock
                paragraphs={task.description}
                onSave={(description) => patch({ description })}
              />
            </div>
            <div className='mt-8'>
              <ChildIssues
                items={task.children}
                nextNumber={nextNumberOf(tasks)}
                onChange={(children) => patch({ children })}
              />
            </div>
            <div className='mt-8'>
              <TaskFeed
                items={task.feed}
                filter={feedFilter}
                onFilterChange={setFeedFilter}
                freshItemId={freshItemId}
              />
            </div>
          </div>
          <div className='before:from-card relative shrink-0 px-5 pt-3 pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-linear-to-t before:to-transparent'>
            <CommentComposer onSubmit={postComment} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
