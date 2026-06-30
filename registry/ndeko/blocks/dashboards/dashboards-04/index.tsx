'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { CohortPanel } from './cohort-panel';
import { shadeOf, type Selection } from './cohort-model';
import { CohortTable } from './cohort-table';
import {
  COHORTS,
  DISPLAY_MODES,
  INITIAL_SELECTION,
  REPORT,
  type DisplayMode,
} from './data';

const REPORT_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const LEGEND_STOPS = [0, 0.25, 0.5, 0.75, 1];

function isDisplayMode(value: unknown): value is DisplayMode {
  return DISPLAY_MODES.some((mode) => mode.id === value);
}

function cohortCountLabelOf(count: number) {
  if (count === 1) {
    return '1 weekly cohort';
  }
  return `${count} weekly cohorts`;
}

function ShadeLegend() {
  return (
    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
      <span>0%</span>
      <span aria-hidden='true' className='flex gap-0.5'>
        {LEGEND_STOPS.map((stop) => (
          <span
            key={stop}
            style={{ backgroundColor: shadeOf(stop) }}
            className='hairline-ring ring-foreground/5 size-3 rounded-[3px]'
          />
        ))}
      </span>
      <span>100% still subscribed</span>
    </div>
  );
}

export default function Dashboards04() {
  const [mode, setMode] = useState<DisplayMode>('percent');
  const [selection, setSelection] = useState<Selection>(INITIAL_SELECTION);
  const cohortCount = cohortCountLabelOf(COHORTS.length);

  function pickMode(value: unknown) {
    if (isDisplayMode(value)) {
      setMode(value);
    }
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='hairline-b border-border flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
        <div className='flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5'>
          <h1 className='truncate text-lg font-semibold'>{REPORT.title}</h1>
          <span className='text-muted-foreground text-xs'>
            {REPORT.workspace} · {cohortCount}
          </span>
        </div>
        <div className='ms-auto'>
          <Tabs value={mode} onValueChange={pickMode}>
            <TabsList variant='segmented' aria-label='Show cells as'>
              {DISPLAY_MODES.map((option) => (
                <TabsTab key={option.id} value={option.id}>
                  {option.label}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className='mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_17rem]'>
        <section
          aria-labelledby='dashboards-04-grid-title'
          className={cn(
            REPORT_SURFACE,
            'flex min-w-0 flex-col gap-3 p-3 sm:p-4'
          )}
        >
          <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1'>
            <h2 id='dashboards-04-grid-title' className='text-sm font-medium'>
              Still subscribed, by sign-up week
            </h2>
            <span className='text-muted-foreground text-xs'>
              Illustrative figures
            </span>
          </div>
          <CohortTable
            mode={mode}
            selection={selection}
            onSelect={setSelection}
          />
          <div className='px-1'>
            <ShadeLegend />
          </div>
        </section>
        <section
          aria-label='Selected cohort'
          className={cn(REPORT_SURFACE, 'p-4')}
        >
          <CohortPanel selection={selection} />
        </section>
      </div>
    </div>
  );
}
