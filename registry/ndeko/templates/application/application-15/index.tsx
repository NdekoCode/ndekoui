'use client';

import { useRef, useState } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AccountGraph } from './account-graph';
import { AgentRuns } from './agent-runs';
import { AppSidebar } from './app-sidebar';
import type { RunId, SectionId } from './data';
import { DayStrip } from './day-strip';
import { FigureBand } from './figure-band';
import type { LayoutId } from './graph-layouts';
import { LeadTrend } from './lead-trend';
import { PageHeader } from './page-header';
import { PipelineFunnel } from './pipeline-funnel';
import {
  INITIAL,
  LOOP_AFTER_MS,
  openTaskCount,
  reducer,
  RESTING,
  SCRIPT,
  type Decision,
} from './session';
import { TodoList } from './todo-list';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the sections live in a sheet. */
const SHEET_BELOW_REM = 48;

const SCROLL_MARGIN_PX = 16;

function scrollBehaviorOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

/** Nothing calls a network. A real CRM plugs in here: a task a person ticks, and their answer to a request of the agent. */
export type Application15Props = {
  onTaskChange?: (id: string, isDone: boolean) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application15({
  onTaskChange,
  onApprove,
  onDeny,
}: Application15Props) {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<SectionId>('overview');
  const shouldReduceMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow(ref, SHEET_BELOW_REM);
  const isSheetShown = isNarrow && state.isSidebarOpen;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const openCount = openTaskCount(state);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function scrollToSection(id: SectionId) {
    const scroller = scrollerRef.current;
    const target = ref.current?.querySelector<HTMLElement>(
      `[data-section="${id}"]`
    );
    if (!scroller || !target) {
      return;
    }
    const scrollerTop = scroller.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const offset = targetTop - scrollerTop + scroller.scrollTop;
    const top = Math.max(offset - SCROLL_MARGIN_PX, 0);
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    scroller.scrollTo({ top, behavior });
  }

  function navigate(id: SectionId) {
    setActiveId(id);
    scrollToSection(id);
    if (isSheetShown) {
      closeSidebar();
    }
  }

  function openSidebar() {
    act({ type: 'sidebar', isOpen: true });
    focusLater('[data-sheet-close="sections"]');
  }

  function closeSidebar() {
    act({ type: 'sidebar', isOpen: false });
    focusLater('[data-menu-open]');
  }

  function changeLayout(layout: LayoutId) {
    act({ type: 'layoutSet', layout });
  }

  function selectNode(id: string) {
    if (state.selectedId === id) {
      act({ type: 'nodeSelected', id: null });
      return;
    }
    act({ type: 'nodeSelected', id });
  }

  function clearNode() {
    act({ type: 'nodeSelected', id: null });
  }

  function selectDay(index: number) {
    if (state.dayIndex === index) {
      act({ type: 'daySelected', index: null });
      return;
    }
    act({ type: 'daySelected', index });
  }

  function toggleTask(id: string) {
    const wasDone = state.doneTaskIds.includes(id);
    act({ type: 'taskToggled', id });
    onTaskChange?.(id, !wasDone);
  }

  /** The two buttons leave the row, so the focus goes to the row, which now says what was decided. */
  function decide(id: RunId, decision: Decision) {
    act({ type: 'decided', id, decision });
    focusLater(`[data-run="${id}"]`);
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    onApprove?.();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-sidebar text-foreground @container min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] overflow-hidden'>
          <div inert={isSheetShown} className='flex min-w-0 flex-1 @3xl:p-2'>
            <aside
              aria-label='Sections'
              className='hidden w-56 shrink-0 pe-2 @3xl:flex'
            >
              {!isNarrow && (
                <AppSidebar activeId={activeId} onNavigate={navigate} />
              )}
            </aside>
            <main className='bg-background @3xl:hairline-ring @3xl:ring-border flex min-w-0 flex-1 flex-col overflow-hidden @3xl:rounded-xl @3xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <PageHeader
                canReplay={canReplay}
                onReplay={restart}
                onOpenMenu={openSidebar}
              />
              <div
                ref={scrollerRef}
                className='@container/page min-h-0 flex-1 overflow-y-auto'
              >
                <div className='mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pt-1 pb-6 @3xl/page:px-4'>
                  <div className='grid gap-4 @4xl/page:grid-cols-[minmax(0,1fr)_21rem]'>
                    <div className='flex min-w-0 flex-col gap-4'>
                      <FigureBand isLoaded={state.isLoaded} />
                      <AccountGraph
                        layout={state.layout}
                        selectedId={state.selectedId}
                        pressed={pressed}
                        isActive={isInView}
                        onLayoutChange={changeLayout}
                        onSelect={selectNode}
                        onClear={clearNode}
                      />
                    </div>
                    <div className='flex min-w-0 flex-col gap-4'>
                      <AgentRuns
                        runs={state.runs}
                        pressed={pressed}
                        onDecide={decide}
                      />
                      <TodoList
                        taskIds={state.taskIds}
                        doneTaskIds={state.doneTaskIds}
                        openCount={openCount}
                        pressed={pressed}
                        onToggle={toggleTask}
                      />
                    </div>
                  </div>
                  <div className='grid gap-4 @2xl/page:grid-cols-2'>
                    <PipelineFunnel counts={state.stageCounts} />
                    <LeadTrend />
                  </div>
                  <DayStrip
                    dayIndex={state.dayIndex}
                    pressed={pressed}
                    onSelect={selectDay}
                  />
                </div>
              </div>
            </main>
          </div>

          <InlineSheet
            name='sections'
            label='Sections of the overview'
            closeLabel='Close the sections'
            side='start'
            isOpen={isSheetShown}
            className='@3xl:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closeSidebar}
          >
            {isNarrow && (
              <AppSidebar activeId={activeId} onNavigate={navigate} />
            )}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
