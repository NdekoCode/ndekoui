'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { ConversationPane, type Typing } from './conversation-pane';
import {
  COMMENTS,
  EVENTS,
  LATER_REPLIES,
  NOW,
  SUBTASKS,
  TASK,
  type TaskComment,
} from './data';
import { RollingCount } from './motion-parts';
import { SubtaskPanel } from './subtask-panel';
import {
  PeopleStack,
  ProgressRing,
  STATUS_NAME,
  StatusGlyph,
} from './work-glyphs';
import {
  addedSubtask,
  doneCountOf,
  dueLabelOf,
  nextSeq,
  personOf,
  postedComment,
  toggledSubtask,
  withComment,
  type WorkState,
} from './work-model';

type Pane = 'task' | 'conversation';

const TYPING_STARTS_AFTER_MS = 900;

const TYPING_LASTS_MS = 2600;

const FIRST_STATE: WorkState = {
  subtasks: SUBTASKS,
  comments: COMMENTS,
  events: EVENTS,
};

function isPane(value: unknown): value is Pane {
  const isTask = value === 'task';
  const isConversation = value === 'conversation';
  return isTask || isConversation;
}

function FactsLine() {
  const people = TASK.assigneeIds.map(personOf);
  const firstNames = people.map((person) => person.firstName);
  const assigneeNames = firstNames.join(' and ');

  return (
    <dl className='mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]'>
      <dt className='text-muted-foreground'>Status</dt>
      <dd className='flex items-center gap-1.5'>
        <StatusGlyph status={TASK.status} />
        {STATUS_NAME[TASK.status]}
      </dd>
      <dt className='text-muted-foreground'>Assignees</dt>
      <dd className='flex min-w-0 items-center gap-2'>
        <PeopleStack people={people} />
        <span className='truncate'>{assigneeNames}</span>
      </dd>
      <dt className='text-muted-foreground'>Due</dt>
      <dd className='tabular-nums'>{dueLabelOf(TASK.due)}</dd>
    </dl>
  );
}

export default function TaskDetail04() {
  const [work, setWork] = useState<WorkState>(FIRST_STATE);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [repliesUsed, setRepliesUsed] = useState(0);
  const [pane, setPane] = useState<Pane>('task');
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const doneCount = doneCountOf(work.subtasks);
  const total = work.subtasks.length;
  const hidesTask = pane !== 'task';
  const hidesConversation = pane !== 'conversation';

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function later(run: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, delay);
    timers.current.add(timer);
  }

  function answer(reply: TaskComment, replyIndex: number) {
    const typingId = `reply-${replyIndex}`;
    later(() => {
      setTyping({ id: typingId, authorId: reply.authorId });
      later(() => {
        const arrived: TaskComment = {
          ...reply,
          id: typingId,
          at: NOW,
          seq: nextSeq(),
        };
        setTyping(null);
        setWork((current) => withComment(current, arrived));
      }, TYPING_LASTS_MS);
    }, TYPING_STARTS_AFTER_MS);
  }

  function post(body: string) {
    setWork((current) => postedComment(current, body));
    const reply = LATER_REPLIES[repliesUsed];
    if (!reply) {
      return;
    }
    setRepliesUsed((current) => current + 1);
    answer(reply, repliesUsed);
  }

  function changePane(value: unknown) {
    if (isPane(value)) {
      setPane(value);
    }
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-6 sm:px-8 lg:py-8'>
      <div className='mx-auto max-w-6xl'>
        <Tabs
          value={pane}
          onValueChange={changePane}
          className='mb-5 lg:hidden'
        >
          <TabsList variant='segmented' aria-label='Part of the task to show'>
            <TabsTab value='task'>Task</TabsTab>
            <TabsTab value='conversation'>
              Conversation
              <RollingCount
                value={work.comments.length}
                className='text-muted-foreground text-xs'
              />
            </TabsTab>
          </TabsList>
        </Tabs>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start'>
          <main className={cn('min-w-0', hidesTask && 'max-lg:hidden')}>
            <nav
              aria-label='Breadcrumb'
              className='text-muted-foreground flex items-center gap-1 text-xs'
            >
              <span>{TASK.project}</span>
              <ChevronRightIcon className='size-3' />
              <span className='tabular-nums'>{TASK.key}</span>
            </nav>
            <h1 className='mt-2 text-xl font-semibold text-balance sm:text-2xl'>
              {TASK.title}
            </h1>
            <FactsLine />
            <section aria-label='Description' className='mt-8'>
              <h2 className='text-sm font-medium'>Description</h2>
              <p className='mt-2 text-[13px] leading-relaxed'>
                {TASK.description}
              </p>
            </section>
            <section aria-label='Sub-tasks' className='mt-8'>
              <div className='flex items-center gap-2 px-2'>
                <h2 className='text-sm font-medium'>Sub-tasks</h2>
                <span className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
                  <ProgressRing done={doneCount} total={total} />
                  <span aria-hidden='true' className='flex tabular-nums'>
                    <RollingCount value={doneCount} />/
                    <RollingCount value={total} />
                  </span>
                  <span className='sr-only'>
                    {doneCount} of {total} done
                  </span>
                </span>
              </div>
              <div className='mt-2'>
                <SubtaskPanel
                  subtasks={work.subtasks}
                  onToggle={(subtaskId) =>
                    setWork((current) => toggledSubtask(current, subtaskId))
                  }
                  onAdd={(title) =>
                    setWork((current) => addedSubtask(current, title))
                  }
                />
              </div>
            </section>
          </main>
          <ConversationPane
            comments={work.comments}
            events={work.events}
            typing={typing}
            onPost={post}
            className={cn(
              'max-lg:min-h-[28rem] lg:sticky lg:top-8 lg:h-[calc(100svh-4rem)]',
              hidesConversation && 'max-lg:hidden'
            )}
          />
        </div>
      </div>
    </div>
  );
}
