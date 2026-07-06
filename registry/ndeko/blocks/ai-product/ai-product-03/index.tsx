'use client';

import { useCallback } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AGENT, leadOf, PASS_IDS } from './data';
import { LeadsTable } from './leads-table';
import {
  enrichedCountOf,
  INITIAL,
  LOOP_AFTER_MS,
  pageCountOf,
  pageRowsOf,
  PAGE_SIZE,
  reducer,
  RESTING,
  resultOf,
  SCRIPT,
  TOTAL,
  type LeadsAction,
  type LeadsState,
} from './session';
import { Toolbar } from './toolbar';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function rangeLineOf(page: number, shown: number, total: number) {
  if (total === 0) {
    return 'No lead';
  }
  const offset = page * PAGE_SIZE;
  const first = offset + 1;
  const lastOffset = shown - 1;
  const last = first + lastOffset;
  return `${first} to ${last} of ${total}`;
}

function leadsWordOf(count: number) {
  if (count === 1) {
    return 'lead';
  }
  return 'leads';
}

function passLineOf(state: LeadsState, enriched: number) {
  if (state.litId !== null) {
    const lead = leadOf(state.litId);
    const name = lead?.name ?? 'a lead';
    return `Working on ${name}`;
  }
  if (enriched === 0) {
    return 'Ready to start';
  }
  if (enriched >= PASS_IDS.length) {
    return 'Pass finished';
  }
  return 'Moving to the next lead';
}

export default function AiProduct03() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    isFinished,
    restart,
    pressed,
  } = useSession(SESSION);
  useKeptHeight(ref);
  const result = resultOf(state);
  const rows = pageRowsOf(result, state.page);
  const total = result.length;
  const pageCount = pageCountOf(total);
  const pageNumber = state.page + 1;
  const isFirstPage = state.page === 0;
  const isLastPage = pageNumber >= pageCount;
  const rangeLine = rangeLineOf(state.page, rows.length, total);
  const enriched = enrichedCountOf(state);
  const passLine = passLineOf(state, enriched);
  const selectedCount = state.selected.length;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const focusLater = useCallback(
    (selector: string) => {
      requestAnimationFrame(() => {
        const target = ref.current?.querySelector<HTMLElement>(selector);
        target?.focus();
      });
    },
    [ref]
  );

  /** The button of the empty state leaves with it, so the focus goes back to the search field. */
  function actOnTable(action: LeadsAction) {
    act(action);
    if (action.type === 'filtersCleared') {
      focusLater('[data-leads-search]');
    }
  }

  function clearSelection() {
    act({ type: 'selectionCleared' });
    focusLater('[data-select-page]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-[52rem] w-full @3xl:min-h-[46rem]'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h2 className='text-lg font-semibold text-balance'>Leads</h2>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                <span className='flex items-baseline gap-1'>
                  <MotionNumber value={total} />
                  {leadsWordOf(total)}
                </span>
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </header>

          <section
            aria-label='Agent pass'
            className='bg-foreground/[0.04] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2'
          >
            <MeshTile
              seed={AGENT.name}
              color={seriesColorOf(AGENT.series)}
              size='md'
            />
            <p className='flex items-baseline gap-1 text-[13px]'>
              {AGENT.name} enriched
              <MotionNumber value={enriched} className='font-medium' />
              of {TOTAL} leads
            </p>
            <span className='text-muted-foreground ms-auto text-xs'>
              <Swap swapKey={passLine}>{passLine}</Swap>
            </span>
          </section>

          <Toolbar
            query={state.query}
            status={state.status}
            owner={state.owner}
            onQuery={(text) => act({ type: 'queryTyped', text })}
            onStatus={(status) => act({ type: 'statusPicked', status })}
            onOwner={(owner) => act({ type: 'ownerPicked', owner })}
          />

          <Fold open={selectedCount > 0}>
            <div className='flex items-center gap-2 text-[13px]'>
              <span className='tabular-nums'>{selectedCount} selected</span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={clearSelection}
                className='text-muted-foreground'
              >
                Clear selection
              </Button>
            </div>
          </Fold>

          <div className='bg-card hairline-ring ring-border @container min-h-[26.5rem] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <LeadsTable
              rows={rows}
              state={state}
              isActive={isInView}
              pressed={pressed}
              onAction={actOnTable}
            />
          </div>

          <Pagination className='items-center justify-between gap-3'>
            <p className='text-muted-foreground text-xs tabular-nums'>
              {rangeLine}
            </p>
            <PaginationContent>
              <PaginationItem>
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Go to the previous page'
                  disabled={isFirstPage}
                  focusableWhenDisabled
                  onClick={() =>
                    act({ type: 'pageTurned', page: state.page - 1 })
                  }
                >
                  <ChevronLeftIcon />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <p className='text-muted-foreground px-1 text-xs tabular-nums'>
                  Page {pageNumber} of {pageCount}
                </p>
              </PaginationItem>
              <PaginationItem>
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Go to the next page'
                  disabled={isLastPage}
                  focusableWhenDisabled
                  onClick={() =>
                    act({ type: 'pageTurned', page: state.page + 1 })
                  }
                >
                  <ChevronRightIcon />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
