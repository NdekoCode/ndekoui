'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { MotionNumber } from '@/components/core/motion-number';

import type { MetricId } from './data';
import type { MetricFigure } from './figures';

type MetricStripProps = {
  figures: MetricFigure[];
  value: MetricId;
  onValueChange: (metricId: MetricId) => void;
};

/** The figures band. Each cell is a tab that picks the figure the chart below draws. */
export function MetricStrip({
  figures,
  value,
  onValueChange,
}: MetricStripProps) {
  function changeValue(nextValue: unknown) {
    const figure = figures.find(
      (candidate) => candidate.metric.id === nextValue
    );
    if (figure) {
      onValueChange(figure.metric.id);
    }
  }

  return (
    <TabsPrimitive.Root value={value} onValueChange={changeValue}>
      <TabsPrimitive.List
        aria-label='Figure drawn in the chart'
        className='relative grid grid-cols-2 gap-1 lg:grid-cols-4'
      >
        {figures.map((figure) => (
          <TabsPrimitive.Tab
            key={figure.metric.id}
            value={figure.metric.id}
            className='group/metric hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg px-3 pt-2.5 pb-3.5 text-left transition-colors duration-150 outline-none focus-visible:ring-[3px] sm:px-4'
          >
            <span className='text-muted-foreground group-data-active/metric:text-foreground text-xs font-medium transition-colors duration-150'>
              {figure.metric.label}
            </span>
            <MotionNumber
              value={figure.total}
              suffix={figure.metric.suffix}
              className='text-lg leading-7 font-semibold'
            />
            <span className='text-muted-foreground text-xs text-pretty'>
              {figure.hint}
            </span>
          </TabsPrimitive.Tab>
        ))}
        <TabsPrimitive.Indicator className='bg-primary pointer-events-none absolute top-0 left-0 h-0.5 w-[calc(var(--active-tab-width)-1.5rem)] translate-x-[calc(var(--active-tab-left)+0.75rem)] translate-y-[calc(var(--active-tab-top)+var(--active-tab-height)-2px)] rounded-full transition-[translate,width] duration-300 ease-(--ease-out-quint) sm:w-[calc(var(--active-tab-width)-2rem)] sm:translate-x-[calc(var(--active-tab-left)+1rem)]' />
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
