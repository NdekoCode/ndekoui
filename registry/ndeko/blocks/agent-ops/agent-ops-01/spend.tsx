'use client';

import { motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { MODELS, type Model, type PeriodId } from './data';

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const PERCENT_TEXT = new Intl.NumberFormat('en-US', PERCENT);

export type ModelSpend = {
  model: Model;
  usd: number;
};

function shareOf(usd: number, total: number) {
  const base = Math.max(total, 0.01);
  const share = usd / base;
  return share * 100;
}

/** Each segment grows by its spend, so the gaps between them never push the last one out. */
function segmentStyleOf(entry: ModelSpend): React.CSSProperties {
  return {
    flexGrow: entry.usd,
    backgroundColor: seriesColorOf(entry.model.series),
  };
}

function spokenBarOf(entries: ModelSpend[], total: number) {
  const parts = entries.map((entry) => {
    const share = shareOf(entry.usd, total);
    const percent = PERCENT_TEXT.format(share);
    return `${entry.model.name} ${percent}%`;
  });
  return `Spend by model: ${parts.join(', ')}`;
}

type StackedBarProps = {
  entries: ModelSpend[];
  total: number;
  period: PeriodId;
};

/** The segments only measure themselves again when the period changes. */
function StackedBar({ entries, total, period }: StackedBarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const spring = springOf(shouldReduceMotion);

  return (
    <div
      role='img'
      aria-label={spokenBarOf(entries, total)}
      className='bg-foreground/[0.05] flex h-2.5 gap-0.5 overflow-hidden rounded-full'
    >
      {entries.map((entry) => (
        <motion.span
          key={entry.model.id}
          layout
          layoutDependency={period}
          transition={{ layout: spring }}
          style={segmentStyleOf(entry)}
          className='h-full min-w-0 basis-0'
        />
      ))}
    </div>
  );
}

type SpendByModelProps = {
  period: PeriodId;
  total: number;
  spendOfModel: (model: Model) => number;
};

export function SpendByModel({
  period,
  total,
  spendOfModel,
}: SpendByModelProps) {
  const entries = MODELS.map((model) => ({ model, usd: spendOfModel(model) }));

  return (
    <section
      aria-label='Spend by model'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-medium'>Spend by model</h2>
        <Badge variant='secondary'>Illustrative</Badge>
      </header>
      <MotionNumber
        value={total}
        format={USD}
        className='text-2xl leading-8 font-semibold'
      />
      <StackedBar entries={entries} total={total} period={period} />
      <ul className='flex flex-col'>
        {entries.map((entry) => (
          <li
            key={entry.model.id}
            className='flex h-8 items-center gap-2 text-[13px]'
          >
            <span
              aria-hidden='true'
              style={{ backgroundColor: seriesColorOf(entry.model.series) }}
              className='size-2 shrink-0 rounded-full'
            />
            <BrandTile brand={entry.model.brand} size='sm' />
            <span className='min-w-0 flex-1 truncate'>{entry.model.name}</span>
            <MotionNumber
              value={shareOf(entry.usd, total)}
              format={PERCENT}
              suffix='%'
              className='text-muted-foreground w-10 justify-end text-xs'
            />
            <MotionNumber
              value={entry.usd}
              format={USD}
              className='w-16 justify-end'
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
