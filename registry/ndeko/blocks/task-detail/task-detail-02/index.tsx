'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { ChildIssues } from './child-issues';
import { CommentComposer } from './comment-composer';
import { TASKS, TEAM_NAME, type TaskDetail } from './data';
import { DescriptionBlock } from './description-block';
import {
  nextNumberOf,
  personOf,
  shortDateOf,
  timeOf,
  toggledIds,
  type FeedFilter,
} from './detail-model';
import { PageBand } from './page-band';
import { PropertyRows } from './property-rows';
import { RailSection } from './rail-section';
import { commentOf, patchedTask, withComment } from './task-edits';
import { TaskFeed } from './task-feed';
import { TimeSummary } from './time-summary';

const IGNORED_KEY_TARGETS =
  'input, textarea, select, [contenteditable="true"], [role="menu"]';

const COLUMN_PART = 'mx-auto w-full max-w-[46rem] px-4 @xl:px-8';

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex min-h-8 items-center gap-2 text-[13px]'>
      <span className='text-muted-foreground w-[6.75rem] shrink-0'>
        {label}
      </span>
      <span className='min-w-0 truncate'>{value}</span>
    </div>
  );
}

export default function TaskDetail02() {
  const [tasks, setTasks] = useState<TaskDetail[]>(TASKS);
  const [shownId, setShownId] = useState(TASKS[0].id);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [freshItemId, setFreshItemId] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const position = positionOf(tasks, shownId);
  const task = tasks[position];
  const reporter = personOf(task.reporterId);
  const isFavourite = favouriteIds.includes(task.id);

  useEffect(() => {
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
      setShownId(next.id);
    }
    document.addEventListener('keydown', walk);
    return () => document.removeEventListener('keydown', walk);
  }, [position, tasks]);

  function step(delta: number) {
    const next = tasks[position + delta];
    if (next) {
      setShownId(next.id);
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

  function toggleFavourite() {
    setFavouriteIds((current) => toggledIds(current, task.id, !isFavourite));
  }

  return (
    <div className='bg-background text-foreground @container flex h-svh min-h-[30rem] flex-col'>
      <PageBand
        task={task}
        position={position + 1}
        total={tasks.length}
        isFavourite={isFavourite}
        onToggleFavourite={toggleFavourite}
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
      />
      <div
        key={task.id}
        className='flex min-h-0 flex-1 flex-col overflow-y-auto @5xl:grid @5xl:grid-cols-[minmax(0,1fr)_20rem] @5xl:grid-rows-[minmax(0,1fr)] @5xl:overflow-hidden @7xl:grid-cols-[minmax(0,1fr)_22rem]'
      >
        <div className='contents @5xl:block @5xl:min-h-0 @5xl:overflow-y-auto'>
          <div className={cn(COLUMN_PART, 'order-1 pt-6 @5xl:pt-10')}>
            <h1 className='text-[26px] leading-tight font-semibold text-balance'>
              {task.title}
            </h1>
            <p className='text-muted-foreground mt-2 text-[13px]'>
              Opened by {reporter.name} on {shortDateOf(task.createdAt)} ·
              Updated {shortDateOf(task.updatedAt)} at {timeOf(task.updatedAt)}
            </p>
          </div>
          <div
            className={cn(
              COLUMN_PART,
              'order-3 flex flex-col gap-10 pt-8 pb-12'
            )}
          >
            <DescriptionBlock
              paragraphs={task.description}
              onSave={(description) => patch({ description })}
            />
            <ChildIssues
              items={task.children}
              nextNumber={nextNumberOf(tasks)}
              onChange={(children) => patch({ children })}
            />
            <TaskFeed
              items={task.feed}
              filter={feedFilter}
              onFilterChange={setFeedFilter}
              freshItemId={freshItemId}
            >
              <CommentComposer onSubmit={postComment} className='mt-5' />
            </TaskFeed>
          </div>
        </div>
        <aside
          aria-label='Task properties'
          className={cn(
            COLUMN_PART,
            '@5xl:hairline-l @5xl:border-border order-2 mt-6 @5xl:order-none @5xl:mx-0 @5xl:mt-0 @5xl:min-h-0 @5xl:max-w-none @5xl:overflow-y-auto @5xl:px-0'
          )}
        >
          <RailSection title='Properties'>
            <PropertyRows task={task} onPatch={patch} columns={1} />
          </RailSection>
          <RailSection title='Time'>
            <TimeSummary task={task} />
          </RailSection>
          <RailSection title='Details'>
            <DetailRow label='Team' value={TEAM_NAME} />
            <DetailRow label='Reporter' value={reporter.name} />
            <DetailRow label='Created' value={shortDateOf(task.createdAt)} />
            <DetailRow label='Updated' value={shortDateOf(task.updatedAt)} />
          </RailSection>
        </aside>
      </div>
    </div>
  );
}
