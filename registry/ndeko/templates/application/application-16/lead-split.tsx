'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { ChartCard } from './chart-card';
import { ORIGINS } from './data';
import { COUNT_FORMAT, percentOf } from './format';
import type { PeriodData } from './period-data';

/** A segment is the whole bar clipped to its share, so every segment glides to its new place together and keeps its round ends. */
function insetOf(start: number, end: number) {
  const left = start * 100;
  const right = (1 - end) * 100;
  return `inset(0 calc(${right}% + 1px) 0 calc(${left}% + 1px) round 6px)`;
}

type Segment = {
  id: string;
  color: string;
  start: number;
  end: number;
};

function segmentsOf(leads: readonly number[], total: number) {
  const segments: Segment[] = [];
  let used = 0;
  ORIGINS.forEach((origin, index) => {
    const share = leads[index] / total;
    const start = used;
    used += share;
    segments.push({
      id: origin.id,
      color: seriesColorOf(origin.series),
      start,
      end: used,
    });
  });
  return segments;
}

type LeadSplitProps = {
  data: PeriodData;
};

export function LeadSplit({ data }: LeadSplitProps) {
  const segments = segmentsOf(data.leads, data.totalLeads);

  return (
    <ChartCard
      title='Leads by origin'
      section='leads'
      description={
        <p className='text-muted-foreground text-xs'>
          Where each lead came from
        </p>
      }
    >
      <div className='flex flex-col gap-1'>
        <p className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={data.totalLeads}
            format={COUNT_FORMAT}
            className='text-2xl leading-8 font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>leads</span>
        </p>
        <Swap
          swapKey={data.leadsChange}
          className='text-muted-foreground text-xs'
        >
          {data.leadsChange}
        </Swap>
      </div>
      <div
        aria-hidden='true'
        className='bg-foreground/[0.06] relative h-3 rounded-full'
      >
        {segments.map((segment) => (
          <span
            key={segment.id}
            className='absolute inset-0 transition-[clip-path] duration-500 ease-(--ease-out-strong)'
            style={{
              backgroundColor: segment.color,
              clipPath: insetOf(segment.start, segment.end),
            }}
          />
        ))}
      </div>
      <ul
        aria-label='Leads by origin'
        className='grid gap-x-6 gap-y-2 @md/card:grid-cols-2'
      >
        {ORIGINS.map((origin, index) => (
          <li key={origin.id} className='flex items-center gap-2 text-[13px]'>
            <span
              aria-hidden='true'
              className='size-2 shrink-0 rounded-full'
              style={{ backgroundColor: seriesColorOf(origin.series) }}
            />
            <span className='text-muted-foreground min-w-0 flex-1 truncate'>
              {origin.name}
            </span>
            <MotionNumber
              value={data.leads[index]}
              format={COUNT_FORMAT}
              className='font-medium'
            />
            <MotionNumber
              value={percentOf(data.leads[index] / data.totalLeads)}
              format={COUNT_FORMAT}
              suffix='%'
              className='text-muted-foreground w-10 justify-end text-xs'
            />
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
