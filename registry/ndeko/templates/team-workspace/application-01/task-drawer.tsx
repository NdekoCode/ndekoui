'use client';

import { useEffect, useState } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { ChildIssues } from './child-issues';
import { CommentComposer } from './comment-composer';
import type { ChildIssue, FeedComment, Task } from './data';
import { DescriptionBlock } from './description-block';
import { taskUrlOf, type FeedFilter } from './detail-model';
import { DrawerBar } from './drawer-bar';
import { PropertyRows } from './property-rows';
import { TaskBand } from './task-band';
import { commentOf } from './task-edits';
import { TaskFeed } from './task-feed';
import { keyOf, nextNumberOf } from './task-model';

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

/** A task opened from outside the walked list, or one that left it, is walked on its own. */
function walkOf(sequence: string[], taskId: string) {
  if (sequence.includes(taskId)) {
    return sequence;
  }
  return [taskId];
}

type TaskDrawerProps = {
  tasks: Task[];
  sequence: string[];
  openTaskId: string | null;
  shownTaskId: string | null;
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
  onPatch: (taskId: string, patch: Partial<Task>) => void;
  onComment: (taskId: string, comment: FeedComment) => void;
};

export function TaskDrawer({
  tasks,
  sequence,
  openTaskId,
  shownTaskId,
  onOpenTask,
  onClose,
  onPatch,
  onComment,
}: TaskDrawerProps) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [freshItemId, setFreshItemId] = useState<string | null>(null);
  const isOpen = openTaskId !== null;
  const task = tasks.find((item) => item.id === shownTaskId);
  const shownId = task?.id ?? '';
  const walk = walkOf(sequence, shownId);
  const position = walk.indexOf(shownId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function walkWithKeys(event: KeyboardEvent) {
      if (isIgnoredKey(event)) {
        return;
      }
      const step = stepOfKey(event.key);
      if (step === 0) {
        return;
      }
      const nextId = walk[position + step];
      if (!nextId) {
        return;
      }
      event.preventDefault();
      onOpenTask(nextId);
    }
    document.addEventListener('keydown', walkWithKeys);
    return () => document.removeEventListener('keydown', walkWithKeys);
  }, [isOpen, position, walk, onOpenTask]);

  if (!task) {
    return null;
  }

  const shownTask = task;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onClose();
    }
  }

  function step(delta: number) {
    const nextId = walk[position + delta];
    if (nextId) {
      onOpenTask(nextId);
    }
  }

  function showPrevious() {
    step(-1);
  }

  function showNext() {
    step(1);
  }

  function patch(changes: Partial<Task>) {
    onPatch(shownTask.id, changes);
  }

  function saveDescription(description: string[]) {
    patch({ description });
  }

  function changeChildren(children: ChildIssue[]) {
    patch({ children });
  }

  function postComment(body: string) {
    const comment = commentOf(body);
    onComment(shownTask.id, comment);
    setFreshItemId(comment.id);
    if (feedFilter === 'history') {
      setFeedFilter('all');
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        showCloseButton={false}
        className='w-[calc(100%-1rem)] max-w-[42rem] gap-0 overflow-hidden p-0'
      >
        <DrawerBar
          position={position + 1}
          total={walk.length}
          link={taskUrlOf(task.number)}
          onPrevious={showPrevious}
          onNext={showNext}
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
              onSave={saveDescription}
            />
          </div>
          <div className='mt-8'>
            <ChildIssues
              items={task.children}
              nextNumber={nextNumberOf(tasks)}
              onChange={changeChildren}
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
  );
}
