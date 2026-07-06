'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

import {
  PERIODS,
  WORKSPACE,
  type MetricDefinition,
  type MetricId,
  type PeriodId,
} from './data';
import {
  chartPointsOf,
  csvRowsOf,
  figuresOf,
  formatMetric,
  metricOf,
  periodOf,
} from './overview-figures';
import { MetricStrip } from './metric-strip';
import {
  ExportButton,
  PeriodSwitch,
  REPORT_SURFACE,
  ReportToolbar,
  downloadCsv,
  useSimulatedLoad,
  type PeriodOption,
} from './report-frame';
import { TrendChart } from './trend-chart';

const PERIOD_OPTIONS: PeriodOption<PeriodId>[] = PERIODS.map((period) => ({
  id: period.id,
  label: period.switchLabel,
}));

const SKELETON_CELLS = ['tracked', 'closed', 'billable', 'review'];

function periodKeyOf(periodId: PeriodId) {
  return periodId;
}

function peopleLabelOf(count: number) {
  if (count === 1) {
    return '1 person';
  }
  return `${count} people`;
}

function formatterOf(metric: MetricDefinition) {
  return (value: number) => formatMetric(metric, value);
}

function OverviewSkeleton() {
  return (
    <div
      aria-hidden='true'
      className={cn(REPORT_SURFACE, 'flex flex-col gap-6 p-2 pb-5')}
    >
      <div className='grid grid-cols-2 gap-1 lg:grid-cols-4'>
        {SKELETON_CELLS.map((cell) => (
          <div
            key={cell}
            className='flex flex-col gap-2 px-3 pt-2.5 pb-3.5 sm:px-4'
          >
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>
      <div className='flex flex-col gap-3 px-3 sm:px-4'>
        <Skeleton className='h-3.5 w-40' />
        <Skeleton className='h-[224px] w-full rounded-lg' />
      </div>
    </div>
  );
}

export function OverviewPage() {
  const load = useSimulatedLoad<PeriodId>('weeks', periodKeyOf);
  const [metricId, setMetricId] = useState<MetricId>('tracked');
  const shownPeriodId = load.loaded ?? load.requested;
  const shownPeriod = periodOf(shownPeriodId);
  const metric = metricOf(metricId);
  const figures = figuresOf(shownPeriodId);
  const points = chartPointsOf(shownPeriodId, metricId);
  const formatValue = formatterOf(metric);
  const chartTitle = `${metric.chartTitle} ${shownPeriod.perUnit}`;
  const peopleLabel = peopleLabelOf(WORKSPACE.peopleCount);
  const meta = `${shownPeriod.label} · ${peopleLabel}`;

  function exportOverview() {
    const rows = csvRowsOf(shownPeriodId);
    const fileName = `tidewell-overview-${shownPeriod.fileSlug}.csv`;
    downloadCsv(fileName, rows);
  }

  return (
    <div className='min-h-0 w-full flex-1 overflow-y-auto'>
      <ReportToolbar title={WORKSPACE.name} meta={meta}>
        <ExportButton disabled={load.isFirstLoad} onExport={exportOverview} />
      </ReportToolbar>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 md:px-6'>
        <PeriodSwitch
          label='Period'
          options={PERIOD_OPTIONS}
          value={load.requested}
          isUpdating={load.isUpdating}
          onValueChange={load.request}
        />
        {load.isFirstLoad && <OverviewSkeleton />}
        {!load.isFirstLoad && (
          <section
            aria-label='Overview'
            aria-busy={load.isUpdating}
            className={cn(REPORT_SURFACE, 'flex flex-col gap-5 p-2 pb-5')}
          >
            <MetricStrip
              figures={figures}
              value={metricId}
              onValueChange={setMetricId}
            />
            <div className='flex flex-col gap-4 px-3 sm:px-4'>
              <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
                <h2 className='text-sm font-medium'>{chartTitle}</h2>
                <span className='text-muted-foreground text-xs'>
                  Illustrative figures
                </span>
              </div>
              <TrendChart
                title={chartTitle}
                valueHeading={metric.label}
                points={points}
                formatValue={formatValue}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
