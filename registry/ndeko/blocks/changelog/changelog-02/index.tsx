'use client';

import { AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ENTRIES, SECTION } from './data';
import { EntryRow } from './entry-row';
import { TypeFilters } from './filters';
import { entryCountOf, groupsOf } from './groups';
import { linkOf, useLinkedEntry } from './hash';
import { MonthNav } from './month-nav';
import {
  COPIED_MS,
  INITIAL,
  LOOP_AFTER_MS,
  monthKeyOf,
  reducer,
  RESTING,
  SCRIPT,
} from './session';
import { useMonthSpy } from './use-month-spy';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** An entry stops under the sticky month heading instead of behind it. */
const HEADING_HEIGHT_PX = 56;

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function offsetOf(jumpKey: string) {
  if (jumpKey.startsWith('entry-')) {
    return HEADING_HEIGHT_PX;
  }
  return 0;
}

export default function Changelog02() {
  const {
    ref,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const linkedFromAddress = useLinkedEntry();
  const groups = groupsOf(state.filter);
  const monthsKey = groups.map((group) => group.id).join(',');
  const spiedId = useMonthSpy(frameRef, monthsKey);
  const firstId = groups[0]?.id ?? null;
  const activeId = spiedId ?? firstId;
  const shownCount = entryCountOf(groups);
  const { copiedId, jumpKey, jumpRequest } = state;
  const copyLine = 'Link copied';
  const countLine = `${countOf(shownCount, 'update')} shown`;
  let line = countLine;
  if (copiedId !== null) {
    line = copyLine;
  }
  const message = spokenUnless(isAutoplaying, line);
  const canReplay = isFinished && !isAutoplaying;

  useEffect(() => {
    if (linkedFromAddress === null) {
      return;
    }
    takeOver();
    act({ type: 'linked', id: linkedFromAddress });
  }, [linkedFromAddress, takeOver, act]);

  useEffect(() => {
    if (jumpRequest === 0 || jumpKey === null) {
      return;
    }
    const frame = frameRef.current;
    const target = frame?.querySelector<HTMLElement>(
      `[data-anchor="${jumpKey}"]`
    );
    if (!frame || !target) {
      return;
    }
    const top = target.offsetTop - offsetOf(jumpKey);
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    frame.scrollTo({ top, behavior });
  }, [jumpKey, jumpRequest, shouldReduceMotion]);

  useEffect(() => {
    if (copiedId === null) {
      return;
    }
    const timer = setTimeout(() => act({ type: 'copyCleared' }), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copiedId, act]);

  async function copyLink(entryId: string) {
    try {
      await navigator.clipboard.writeText(linkOf(entryId));
    } catch {
      return;
    }
    act({ type: 'copied', id: entryId });
  }

  /** A wheel or a trackpad scrolling the frame is a person reading: the demonstration stops for good. */
  function yieldToWheel() {
    if (isAutoplaying) {
      takeOver();
    }
  }

  function replay() {
    frameRef.current?.scrollTo({ top: 0 });
    restart();
  }

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container flex h-dvh min-h-[34rem] w-full flex-col'
    >
      <header className='shrink-0 px-4 pt-6 pb-3 @2xl:px-8 @2xl:pt-8'>
        <div className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-2xl font-semibold text-balance'>
                {SECTION.title}
              </h2>
              <p className='text-muted-foreground text-[13px]'>
                {SECTION.description}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <ReplayButton
                isShown={canReplay}
                onReplay={replay}
                label='Replay'
              />
              <Badge variant='secondary'>{SECTION.badge}</Badge>
            </div>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <TypeFilters
              filter={state.filter}
              pressed={pressed}
              onPick={(filter) => act({ type: 'filterPicked', filter })}
            />
            <MonthNav
              groups={groups}
              activeId={activeId}
              pressed={pressed}
              onJump={(monthId) =>
                act({ type: 'jumped', key: monthKeyOf(monthId) })
              }
            />
          </div>
        </div>
      </header>
      <div
        ref={frameRef}
        onWheel={yieldToWheel}
        tabIndex={0}
        role='region'
        aria-label='Release notes'
        className='focus-visible:ring-ring/25 relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 outline-none focus-visible:ring-[3px] focus-visible:ring-inset @2xl:px-8'
      >
        <div className='mx-auto max-w-3xl pb-16'>
          {groups.map((group) => (
            <section
              key={group.id}
              data-month={group.id}
              data-anchor={monthKeyOf(group.id)}
              aria-labelledby={`${group.id}-heading`}
            >
              <h3
                id={`${group.id}-heading`}
                className='bg-background sticky top-0 z-10 flex items-baseline gap-2 py-3 text-sm font-semibold'
              >
                {group.label}
                <span className='text-muted-foreground text-xs font-normal tabular-nums'>
                  {countOf(group.entries.length, 'update')}
                </span>
              </h3>
              <ol>
                <AnimatePresence initial={false}>
                  {group.entries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      isOpen={state.openIds.includes(entry.id)}
                      isCopied={copiedId === entry.id}
                      pressed={pressed}
                      onToggle={(id) => act({ type: 'toggled', id })}
                      onCopy={copyLink}
                    />
                  ))}
                </AnimatePresence>
              </ol>
            </section>
          ))}
          {groups.length === 0 && (
            <div className='flex flex-col items-start gap-3 py-8'>
              <p className='text-muted-foreground text-sm'>
                No updates of this kind yet, out of {ENTRIES.length} in all.
              </p>
              <Button
                variant='outline'
                onClick={() => act({ type: 'filterPicked', filter: 'all' })}
              >
                Show every update
              </Button>
            </div>
          )}
        </div>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
