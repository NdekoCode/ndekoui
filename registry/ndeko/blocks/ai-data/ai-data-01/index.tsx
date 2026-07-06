'use client';

import { useCallback, useMemo, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { AccountsTable } from './accounts-table';
import type { FilterKind } from './ask';
import { AskBar } from './ask-bar';
import { BulkBar } from './bulk-bar';
import { csvRowsOf, downloadCsv } from './csv';
import { TODAY_LABEL, type OwnerId } from './data';
import {
  accountsWordOf,
  INITIAL,
  LOOP_AFTER_MS,
  matchingOf,
  PAGE_SIZE,
  pageCountOf,
  pageRowsOf,
  reducer,
  RESTING,
  resultOf,
  SCRIPT,
  viewCountOf,
  VIEWS,
  type AccountsAction,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const FILE_NAME = 'accounts.csv';

const EXPORTED_FOR_MS = 1600;

/** 1 to 8 of 24: the rows on screen out of the rows the filters keep. */
function rangeLineOf(page: number, shown: number, total: number) {
  if (total === 0) {
    return 'No account';
  }
  const first = page * PAGE_SIZE + 1;
  const last = first + shown - 1;
  return `${first} to ${last} of ${total}`;
}

export default function AiData01() {
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
  const { schedule } = useTimeouts();
  const [isExported, setIsExported] = useState(false);
  const { filters, view, sort, page } = state;
  const matching = useMemo(() => matchingOf(filters), [filters]);
  const result = useMemo(
    () => resultOf(filters, view, sort),
    [filters, view, sort]
  );
  const rows = useMemo(() => pageRowsOf(result, page), [result, page]);
  const total = result.length;
  const pageCount = pageCountOf(total);
  const pageNumber = page + 1;
  const isFirstPage = page === 0;
  const isLastPage = pageNumber === pageCount;
  const rangeLine = rangeLineOf(page, rows.length, total);
  const hasChanged = state.revision > 0;
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

  /** The button that removes the filters leaves with the empty state, so the focus goes back to the question box. */
  const actOnTable = useCallback(
    (action: AccountsAction) => {
      act(action);
      if (action.type === 'filtersCleared') {
        focusLater('[data-ask-field]');
      }
    },
    [act, focusLater]
  );

  /** A chip that is removed takes its button with it: the focus goes to the chip that takes its place, or to the question box. */
  function removeFilter(kind: FilterKind) {
    const kinds = filters.map((filter) => filter.kind);
    const index = kinds.indexOf(kind);
    const neighbour = kinds[index + 1] ?? kinds[index - 1];
    act({ type: 'filterRemoved', kind });
    if (neighbour) {
      focusLater(`[data-filter-remove="${neighbour}"]`);
      return;
    }
    focusLater('[data-ask-field]');
  }

  function clearFilters() {
    act({ type: 'filtersCleared' });
    focusLater('[data-ask-field]');
  }

  function pickView(value: unknown) {
    const picked = VIEWS.find((candidate) => candidate.id === value);
    if (picked) {
      act({ type: 'viewPicked', view: picked.id });
    }
  }

  function showOwners() {
    act({ type: 'bulkModeSet', mode: 'owners' });
    focusLater('[data-bulk-owner]');
  }

  function hideOwners() {
    act({ type: 'bulkModeSet', mode: 'actions' });
    focusLater('[data-bulk-assign]');
  }

  /** The bar leaves once its accounts have their owner, so the focus goes back to the table. */
  function assign(owner: OwnerId) {
    act({ type: 'ownerAssigned', owner });
    focusLater('[data-select-page]');
  }

  function clearSelection() {
    act({ type: 'selectionCleared' });
    focusLater('[data-select-page]');
  }

  function exportSelected() {
    const chosen = result.filter((account) =>
      state.selected.includes(account.id)
    );
    downloadCsv(FILE_NAME, csvRowsOf(chosen, state.owners));
    act({ type: 'exported' });
    setIsExported(true);
    schedule(() => setIsExported(false), EXPORTED_FOR_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>Accounts</h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                <span className='flex items-baseline gap-1'>
                  <MotionNumber value={total} />
                  {accountsWordOf(total)}
                </span>
                <span aria-hidden='true'>·</span>
                As of {TODAY_LABEL}
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </header>

          <AskBar
            question={state.question}
            hasAskFailed={state.hasAskFailed}
            filters={filters}
            pressed={pressed}
            onType={(text) => act({ type: 'questionTyped', text })}
            onAsk={() => act({ type: 'asked' })}
            onRemove={removeFilter}
            onClear={clearFilters}
          />

          <Tabs value={view} onValueChange={pickView} className='gap-4'>
            <TabsList aria-label='Saved views'>
              {VIEWS.map((candidate) => (
                <TabsTab
                  key={candidate.id}
                  value={candidate.id}
                  className={cn(
                    'transition-[color,background-color,scale]',
                    pressedQuietOf(pressed === `view-${candidate.id}`)
                  )}
                >
                  {candidate.label}
                  <span className='text-muted-foreground text-xs'>
                    <MotionNumber value={viewCountOf(matching, candidate.id)} />
                  </span>
                </TabsTab>
              ))}
            </TabsList>
            <TabsPanel value={view} className='flex flex-col gap-3'>
              <div className='bg-card hairline-ring ring-border @container min-h-[26.5rem] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                <AccountsTable
                  rows={rows}
                  owners={state.owners}
                  sort={sort}
                  selected={state.selected}
                  openSummaries={state.openSummaries}
                  writtenSummaries={state.writtenSummaries}
                  streamingSummary={state.streamingSummary}
                  hasChanged={hasChanged}
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
                        act({ type: 'pageTurned', page: page - 1 })
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
                        act({ type: 'pageTurned', page: page + 1 })
                      }
                    >
                      <ChevronRightIcon />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </TabsPanel>
          </Tabs>

          <BulkBar
            count={state.selected.length}
            mode={state.bulkMode}
            isExported={isExported}
            pressed={pressed}
            onShowOwners={showOwners}
            onHideOwners={hideOwners}
            onAssign={assign}
            onExport={exportSelected}
            onClear={clearSelection}
          />
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
