'use client';

import { useRef, useState } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { AppSidebar } from './app-sidebar';
import type { SortKey } from './campaign-sort';
import { CampaignTable } from './campaign-table';
import { ChannelBars } from './channel-bars';
import { ConversionFunnel } from './conversion-funnel';
import type { PeriodId, SectionId } from './data';
import { GoalMeters } from './goal-meters';
import { LeadSplit } from './lead-split';
import { PageHeader } from './page-header';
import { dataOf } from './period-data';
import { INITIAL, LOOP_AFTER_MS, reducer, RESTING, SCRIPT } from './session';
import { TrafficLine } from './traffic-line';
import { WeekStrip } from './week-strip';

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

/** Nothing calls a network. A real analytics source plugs in here: the period a person picks, and the campaign they open. */
export type Application16Props = {
  onPeriodChange?: (period: PeriodId) => void;
  onSortChange?: (key: SortKey) => void;
  onCampaignSelect?: (id: string | null) => void;
};

export default function Application16({
  onPeriodChange,
  onSortChange,
  onCampaignSelect,
}: Application16Props) {
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
  const data = dataOf(state.period);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function scrollToSection(id: SectionId) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    const target = ref.current?.querySelector<HTMLElement>(
      `[data-section="${id}"]`
    );
    if (!target) {
      scroller.scrollTo({ top: 0, behavior });
      return;
    }
    const scrollerTop = scroller.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const offset = targetTop - scrollerTop + scroller.scrollTop;
    const top = Math.max(offset - SCROLL_MARGIN_PX, 0);
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

  function changePeriod(period: PeriodId) {
    act({ type: 'periodSet', period });
    onPeriodChange?.(period);
  }

  function sortBy(key: SortKey) {
    act({ type: 'sorted', key });
    onSortChange?.(key);
  }

  function selectCampaign(id: string) {
    if (state.campaignId === id) {
      act({ type: 'campaignSelected', id: null });
      onCampaignSelect?.(null);
      return;
    }
    act({ type: 'campaignSelected', id });
    onCampaignSelect?.(id);
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
                <AppSidebar
                  activeId={activeId}
                  isShown={isInView}
                  onNavigate={navigate}
                />
              )}
            </aside>
            <main className='bg-background @3xl:hairline-ring @3xl:ring-border flex min-w-0 flex-1 flex-col overflow-hidden @3xl:rounded-xl @3xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <PageHeader
                period={state.period}
                canReplay={canReplay}
                onPeriodChange={changePeriod}
                onReplay={restart}
                onOpenMenu={openSidebar}
              />
              <div
                ref={scrollerRef}
                className='@container/page min-h-0 flex-1 overflow-y-auto'
              >
                <Settle
                  isShown={isInView}
                  className='mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pt-1 pb-6'
                >
                  <div className='grid gap-4 @3xl/page:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
                    <SettleItem className='min-w-0'>
                      <LeadSplit data={data} />
                    </SettleItem>
                    <SettleItem className='min-w-0'>
                      <GoalMeters data={data} />
                    </SettleItem>
                  </div>
                  <SettleItem>
                    <TrafficLine data={data} />
                  </SettleItem>
                  <div className='grid gap-4 @3xl/page:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
                    <SettleItem className='min-w-0'>
                      <ChannelBars data={data} />
                    </SettleItem>
                    <SettleItem className='min-w-0'>
                      <ConversionFunnel data={data} />
                    </SettleItem>
                  </div>
                  <SettleItem>
                    <WeekStrip
                      selectedId={state.campaignId}
                      pressed={pressed}
                      onSelect={selectCampaign}
                    />
                  </SettleItem>
                  <SettleItem>
                    <CampaignTable
                      data={data}
                      sortKey={state.sortKey}
                      sortDirection={state.sortDirection}
                      selectedId={state.campaignId}
                      pressed={pressed}
                      onSort={sortBy}
                      onSelect={selectCampaign}
                    />
                  </SettleItem>
                </Settle>
              </div>
            </main>
          </div>

          <InlineSheet
            name='sections'
            label='Sections of the dashboard'
            closeLabel='Close the sections'
            side='start'
            isOpen={isSheetShown}
            className='@3xl:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closeSidebar}
          >
            {isNarrow && (
              <AppSidebar
                activeId={activeId}
                isShown={isInView}
                onNavigate={navigate}
              />
            )}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
