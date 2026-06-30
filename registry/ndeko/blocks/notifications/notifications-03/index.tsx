'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import {
  NOTICES,
  SOURCES,
  TEAM_NAME,
  WORKING_DURATION_MS,
  type Source,
  type SourceId,
} from './data';
import { fadePresence, Swap } from './motion-parts';
import { Notice, type NoticePhase } from './notice';

const SOURCES_ANCHOR = 'sources';

type Phases = Record<string, NoticePhase>;

function phaseOf(phases: Phases, noticeId: string): NoticePhase {
  return phases[noticeId] ?? 'open';
}

function isSourceResolved(phases: Phases, sourceId: SourceId) {
  const notice = NOTICES.find((item) => item.sourceId === sourceId);
  if (!notice) {
    return false;
  }
  return phaseOf(phases, notice.id) === 'resolved';
}

function sourceStateOf(source: Source, isResolved: boolean) {
  if (isResolved) {
    return source.resolved;
  }
  return source.open;
}

export default function Notifications03() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [phases, setPhases] = useState<Phases>({});
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const shownNotices = NOTICES.filter(
    (notice) => !dismissedIds.includes(notice.id)
  );
  const hasNotices = shownNotices.length > 0;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function setPhase(noticeId: string, phase: NoticePhase) {
    setPhases((current) => ({ ...current, [noticeId]: phase }));
  }

  function act(noticeId: string) {
    setPhase(noticeId, 'working');
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setPhase(noticeId, 'resolved');
    }, WORKING_DURATION_MS);
    timers.current.add(timer);
  }

  function dismiss(noticeId: string) {
    setDismissedIds((current) => [...current, noticeId]);
  }

  function showDismissed() {
    setDismissedIds([]);
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-8 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-2xl font-semibold text-balance'>
          Imports and sync
        </h1>
        <p className='text-muted-foreground mt-1 text-[13px]'>
          Where {TEAM_NAME} gets its members and its calendar
        </p>
        <AnimatedSize className='mt-6'>
          <div className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              {hasNotices && (
                <motion.ul
                  key='notices'
                  aria-label='Notices'
                  aria-live='polite'
                  {...fadePresence()}
                >
                  <AnimatePresence initial={false}>
                    {shownNotices.map((notice) => (
                      <Notice
                        key={notice.id}
                        notice={notice}
                        phase={phaseOf(phases, notice.id)}
                        recoveryHref={`#${SOURCES_ANCHOR}`}
                        onAction={act}
                        onDismiss={dismiss}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
              {!hasNotices && (
                <motion.div
                  key='no-notices'
                  {...fadePresence()}
                  className='flex flex-wrap items-center justify-between gap-2 pb-3'
                >
                  <p className='text-muted-foreground text-[13px]'>
                    No notices, a source that needs you will show one here
                  </p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={showDismissed}
                    className='text-muted-foreground'
                  >
                    <RotateCcwIcon />
                    Show dismissed notices
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSize>
        <section id={SOURCES_ANCHOR} className='mt-7 scroll-mt-6'>
          <h2 className='text-sm font-medium'>Sources</h2>
          <ul className='bg-card hairline-ring ring-border hairline-divide-y divide-border mt-3 overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            {SOURCES.map((source) => {
              const isResolved = isSourceResolved(phases, source.id);
              const state = sourceStateOf(source, isResolved);
              return (
                <li
                  key={source.id}
                  className='flex min-h-14 items-center justify-between gap-3 px-4 py-3'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-[13px] font-medium'>
                      {source.name}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {source.detail}
                    </p>
                  </div>
                  <Swap swapKey={state.label}>
                    <Badge variant={state.variant}>{state.label}</Badge>
                  </Swap>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
