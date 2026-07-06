'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pendingApprovalsOf,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { Board } from './board';
import { Budget } from './budget';
import { DECLINED_LINE, POSTED_LINE } from './data';
import { Fleet } from './fleet';
import { Graph } from './graph';
import { Monitor } from './monitor';
import { PageHeader, SlimBar, useCondensedHeader } from './page-header';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type Decision,
  type ScrollTarget,
} from './session';
import { Waterfall } from './waterfall';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The slim bar covers the top of the page once it has condensed: a panel brought into view stops below it. */
const SCROLL_MARGIN_PX = 64;

/**
 * One column under 48rem, two from there, three from 64rem. The grid names the places of the panels,
 * so their order in the page stays the order a phone reads them in.
 */
const PANELS =
  "grid grid-cols-1 gap-4 @3xl:grid-cols-2 @3xl:[grid-template-areas:'monitor_budget'_'graph_graph'_'fleet_fleet'_'waterfall_waterfall'_'board_board'] @5xl:grid-cols-3 @5xl:[grid-template-areas:'monitor_graph_graph'_'budget_waterfall_waterfall'_'fleet_board_board']";

function scrollTopOf(scroller: HTMLElement, target: ScrollTarget) {
  if (target === 'top') {
    return 0;
  }
  const panel = scroller.querySelector<HTMLElement>('[data-panel="fleet"]');
  if (!panel) {
    return 0;
  }
  const panelTop = panel.getBoundingClientRect().top;
  const scrollerTop = scroller.getBoundingClientRect().top;
  const offset = panelTop - scrollerTop + scroller.scrollTop;
  return Math.max(0, offset - SCROLL_MARGIN_PX);
}

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function announcementOf(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run)[0];
  if (pending) {
    return `${pending.title}. Allow or deny it`;
  }
  if (run.status === 'done') {
    return `The run is done. ${POSTED_LINE}`;
  }
  if (run.status === 'cancelled') {
    return DECLINED_LINE;
  }
  return '';
}

/** Nothing calls a network. A real backend plugs in here: the answer of a person to the request that waits on them. */
export type Application07Props = {
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application07({
  onApprove,
  onDeny,
}: Application07Props) {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, isCondensed } = useCondensedHeader(scrollerRef);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { run, focusAgentId, scrollTarget } = state;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, announcementOf(run));

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const top = scrollTopOf(scroller, scrollTarget);
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    scroller.scrollTo({ top, behavior });
  }, [scrollTarget, shouldReduceMotion]);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The two buttons leave with the request, so the focus goes to what replaces them: the line that says what was decided. */
  function decide(decision: Decision) {
    act({ type: 'decided', decision });
    focusLater('[data-request]');
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    onApprove?.();
  }

  function pickAgent(id: string) {
    if (focusAgentId === id) {
      act({ type: 'focused', id: null });
      return;
    }
    act({ type: 'focused', id });
  }

  function review() {
    focusLater('[data-approval]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='relative h-dvh min-h-[40rem] overflow-hidden'>
          <div
            ref={scrollerRef}
            onWheel={takeOver}
            className='relative h-full overflow-y-auto'
          >
            <SlimBar
              run={run}
              isCondensed={isCondensed}
              canReplay={canReplay}
              onReplay={restart}
            />
            <div className='mx-auto flex w-full max-w-[90rem] flex-col gap-5 px-3 pb-8 @xl:px-5'>
              <PageHeader
                run={run}
                sentinelRef={sentinelRef}
                canReplay={canReplay}
                onReplay={restart}
              />
              <div className={PANELS}>
                <Monitor
                  run={run}
                  focusAgentId={focusAgentId}
                  pressed={pressed}
                  onDecide={decide}
                  className='@3xl:[grid-area:monitor]'
                />
                <Budget
                  run={run}
                  focusAgentId={focusAgentId}
                  className='@3xl:[grid-area:budget]'
                />
                <Graph
                  run={run}
                  focusAgentId={focusAgentId}
                  onFocusAgent={pickAgent}
                  className='@3xl:[grid-area:graph]'
                />
                <Fleet
                  run={run}
                  focusAgentId={focusAgentId}
                  pressed={pressed}
                  onFocusAgent={pickAgent}
                  className='@3xl:[grid-area:fleet]'
                />
                <Waterfall
                  run={run}
                  focusAgentId={focusAgentId}
                  className='@3xl:[grid-area:waterfall]'
                />
                <Board
                  run={run}
                  focusAgentId={focusAgentId}
                  onReview={review}
                  className='@3xl:[grid-area:board]'
                />
              </div>
            </div>
          </div>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
