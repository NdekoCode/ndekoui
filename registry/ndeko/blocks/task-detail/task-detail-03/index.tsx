'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { ActivityPanel } from './activity-panel';
import { CommentComposer } from './comment-composer';
import { CommentPanel } from './comment-panel';
import { COMMENTS, EVENTS, SUBTASKS, TASK } from './data';
import { heightPresenceOf, RollingCount } from './motion-parts';
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
  personOf,
  postedComment,
  toggledSubtask,
  type WorkState,
} from './work-model';

type WorkTab = 'subtasks' | 'comments' | 'activity';

const FIRST_STATE: WorkState = {
  subtasks: SUBTASKS,
  comments: COMMENTS,
  events: EVENTS,
};

function isWorkTab(value: unknown): value is WorkTab {
  const isSubtasks = value === 'subtasks';
  const isComments = value === 'comments';
  const isActivity = value === 'activity';
  return isSubtasks || isComments || isActivity;
}

function TaskHeader() {
  const people = TASK.assigneeIds.map(personOf);
  const firstNames = people.map((person) => person.firstName);
  const assigneeNames = firstNames.join(' and ');
  return (
    <header>
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
      <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]'>
        <span className='text-foreground inline-flex items-center gap-1.5'>
          <StatusGlyph status={TASK.status} />
          {STATUS_NAME[TASK.status]}
        </span>
        <span className='inline-flex items-center gap-2'>
          <PeopleStack people={people} />
          {assigneeNames}
        </span>
        <span className='tabular-nums'>{dueLabelOf(TASK.due)}</span>
      </div>
      <p className='mt-4 text-[13px] leading-relaxed'>{TASK.description}</p>
    </header>
  );
}

export default function TaskDetail03() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [work, setWork] = useState<WorkState>(FIRST_STATE);
  const [tab, setTab] = useState<WorkTab>('subtasks');
  const doneCount = doneCountOf(work.subtasks);
  const total = work.subtasks.length;
  const isCommentsTab = tab === 'comments';

  function change(value: unknown) {
    if (isWorkTab(value)) {
      setTab(value);
    }
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-6 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-2xl'>
        <TaskHeader />
        <div className='bg-card hairline-ring ring-border mt-6 rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <Tabs value={tab} onValueChange={change} className='gap-0'>
            <div className='px-3 pt-3 sm:px-4 sm:pt-4'>
              <TabsList
                variant='segmented'
                aria-label='Work on this task'
                className='max-w-full'
              >
                <TabsTab value='subtasks'>
                  <span className='hidden sm:inline-flex'>
                    <ProgressRing done={doneCount} total={total} />
                  </span>
                  Sub-tasks
                  <span className='text-muted-foreground flex text-xs tabular-nums'>
                    <RollingCount value={doneCount} />/
                    <RollingCount value={total} />
                  </span>
                </TabsTab>
                <TabsTab value='comments'>
                  Comments
                  <RollingCount
                    value={work.comments.length}
                    className='text-muted-foreground text-xs'
                  />
                </TabsTab>
                <TabsTab value='activity'>
                  Activity
                  <RollingCount
                    value={work.events.length}
                    className='text-muted-foreground text-xs'
                  />
                </TabsTab>
              </TabsList>
            </div>
            <AnimatedSize>
              <div className='px-3 py-3 sm:px-4'>
                <TabsPanel value='subtasks'>
                  <SubtaskPanel
                    subtasks={work.subtasks}
                    onToggle={(subtaskId) =>
                      setWork((current) => toggledSubtask(current, subtaskId))
                    }
                    onAdd={(title) =>
                      setWork((current) => addedSubtask(current, title))
                    }
                  />
                </TabsPanel>
                <TabsPanel value='comments'>
                  <CommentPanel comments={work.comments} />
                </TabsPanel>
                <TabsPanel value='activity'>
                  <ActivityPanel events={work.events} />
                </TabsPanel>
              </div>
            </AnimatedSize>
            <AnimatePresence initial={false}>
              {isCommentsTab && (
                <motion.div
                  key='composer'
                  {...heightPresenceOf(shouldReduceMotion)}
                  className='overflow-hidden'
                >
                  <CommentComposer
                    onSubmit={(body) =>
                      setWork((current) => postedComment(current, body))
                    }
                    className='px-3 pb-3 sm:px-4 sm:pb-4'
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
