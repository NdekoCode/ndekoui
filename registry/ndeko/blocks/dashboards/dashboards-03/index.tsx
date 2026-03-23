'use client';

import { useState } from 'react';

import { CircleCheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { PROJECT, SPRINTS, type Sprint, type SprintId } from './data';
import {
  csvRowsOf,
  goalOf,
  needsAttention,
  rowsOf,
  sprintOf,
  totalsOf,
} from './figures';
import { GoalCard } from './goal-card';
import {
  ExportButton,
  PeriodSwitch,
  REPORT_SURFACE,
  ReportToolbar,
  downloadCsv,
  useSimulatedLoad,
  type PeriodOption,
} from './report-frame';
import { WorkstreamTable } from './workstream-table';

type RowFilter = 'all' | 'attention';

const SPRINT_OPTIONS: PeriodOption<SprintId>[] = SPRINTS.map((sprint) => ({
  id: sprint.id,
  label: `Sprint ${sprint.number}`,
}));

const CURRENT_SPRINT: SprintId = 's23';

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth', 'fifth'];

function sprintKeyOf(sprintId: SprintId) {
  return sprintId;
}

function isRowFilter(value: unknown): value is RowFilter {
  const isAll = value === 'all';
  const isAttention = value === 'attention';
  return isAll || isAttention;
}

function peopleLabelOf(count: number) {
  if (count === 1) {
    return '1 person';
  }
  return `${count} people`;
}

function blockedLabelOf(count: number) {
  if (count === 0) {
    return 'nothing blocked';
  }
  if (count === 1) {
    return '1 task blocked';
  }
  return `${count} tasks blocked`;
}

function workstreamCountOf(count: number) {
  if (count === 1) {
    return '1 workstream';
  }
  return `${count} workstreams`;
}

function calmLineOf(sprint: Sprint) {
  const isRunning = sprint.daysElapsed < sprint.workingDays;
  if (isRunning) {
    return `Every workstream is on track in sprint ${sprint.number}`;
  }
  return `Every workstream was on track in sprint ${sprint.number}`;
}

function visibleRowsOf<Row>(
  isAttentionView: boolean,
  rows: Row[],
  attentionRows: Row[]
) {
  if (isAttentionView) {
    return attentionRows;
  }
  return rows;
}

function totalsWhen<Value>(isShown: boolean, value: Value) {
  if (isShown) {
    return value;
  }
  return null;
}

function HealthSkeleton() {
  return (
    <div aria-hidden='true' className='flex flex-col gap-4'>
      <div className={cn(REPORT_SURFACE, 'flex flex-col gap-4 p-5')}>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-4 w-64 max-w-full' />
        <Skeleton className='h-7 w-40' />
        <Skeleton className='h-2 w-full rounded-full' />
        <Skeleton className='h-3 w-56 max-w-full' />
      </div>
      <div className={cn(REPORT_SURFACE, 'flex flex-col gap-3 p-5')}>
        <Skeleton className='h-3.5 w-28' />
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} className='h-8 w-full' />
        ))}
      </div>
    </div>
  );
}

export default function Dashboards03() {
  const load = useSimulatedLoad<SprintId>(CURRENT_SPRINT, sprintKeyOf);
  const [filter, setFilter] = useState<RowFilter>('all');
  const shownSprintId = load.loaded ?? load.requested;
  const sprint = sprintOf(shownSprintId);
  const rows = rowsOf(sprint);
  const totals = totalsOf(rows);
  const goal = goalOf(sprint, totals);
  const attentionRows = rows.filter(needsAttention);
  const isAttentionView = filter === 'attention';
  const visibleRows = visibleRowsOf(isAttentionView, rows, attentionRows);
  const isCalm = attentionRows.length === 0;
  const showsCalmState = isAttentionView && isCalm;
  const showsTotals = !isAttentionView;
  const shownTotals = totalsWhen(showsTotals, totals);
  const peopleLabel = peopleLabelOf(PROJECT.peopleCount);
  const meta = `${PROJECT.release} · ${sprint.rangeLabel} · ${peopleLabel}`;
  const workstreamLabel = workstreamCountOf(rows.length);
  const blockedLabel = blockedLabelOf(totals.blocked);
  const calmLine = calmLineOf(sprint);

  function changeFilter(value: unknown) {
    if (isRowFilter(value)) {
      setFilter(value);
    }
  }

  function showAll() {
    setFilter('all');
  }

  function exportHealth() {
    const csvRows = csvRowsOf(rows);
    const fileName = `${PROJECT.fileSlug}-sprint-${sprint.number}.csv`;
    downloadCsv(fileName, csvRows);
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <ReportToolbar title={PROJECT.name} meta={meta}>
        <ExportButton disabled={load.isFirstLoad} onExport={exportHealth} />
      </ReportToolbar>
      <div className='mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5 md:px-6'>
        <PeriodSwitch
          label='Sprint'
          options={SPRINT_OPTIONS}
          value={load.requested}
          isUpdating={load.isUpdating}
          onValueChange={load.request}
        />
        {load.isFirstLoad && <HealthSkeleton />}
        {!load.isFirstLoad && (
          <div aria-busy={load.isUpdating} className='flex flex-col gap-4'>
            <GoalCard sprint={sprint} goal={goal} />
            <section
              aria-label='Workstreams'
              className={cn(REPORT_SURFACE, 'flex flex-col gap-3 pt-4 pb-1')}
            >
              <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4'>
                <div className='flex flex-col gap-0.5'>
                  <h2 className='text-sm font-medium'>Workstreams</h2>
                  <p className='text-muted-foreground text-xs tabular-nums'>
                    {`${workstreamLabel}, ${blockedLabel}`}
                  </p>
                </div>
                <Tabs value={filter} onValueChange={changeFilter}>
                  <TabsList
                    variant='segmented'
                    aria-label='Workstreams to show'
                  >
                    <TabsTab value='all'>All</TabsTab>
                    <TabsTab value='attention'>
                      Needs attention
                      <span className='text-muted-foreground text-xs tabular-nums'>
                        {attentionRows.length}
                      </span>
                    </TabsTab>
                  </TabsList>
                </Tabs>
              </div>
              <WorkstreamTable
                rows={visibleRows}
                totals={shownTotals}
                emptyState={
                  showsCalmState && (
                    <div className='flex flex-col items-center gap-3 px-4 py-10 text-center'>
                      <span className='keycap-3d text-success-foreground flex size-9 items-center justify-center rounded-lg'>
                        <CircleCheckIcon />
                      </span>
                      <p className='text-[13px] font-medium text-balance'>
                        {calmLine}
                      </p>
                      <Button variant='outline' size='sm' onClick={showAll}>
                        Show all workstreams
                      </Button>
                    </div>
                  )
                }
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
