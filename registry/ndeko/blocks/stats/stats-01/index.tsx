'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { ChartBarIcon, InfoIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  DRAFTS,
  EDIT_BUCKETS,
  EDIT_SHARES,
  FIGURES,
  HANDOFF,
  HANDOFF_BY_WEEKDAY,
  PERIODS,
  REPLY,
  REPLY_TREND,
  REPLY_TREND_MAX,
  SECTION,
  WEEKDAYS,
  type Figure,
  type FigureId,
  type PeriodId,
} from './data';
import { FigureCell } from './figure-cell';
import { PeriodSwitch } from './period-switch';
import { Distribution, TrendLine, WeekdayBars } from './proofs';

const LOOP_AFTER_MS = 2200;

function periodOf(id: PeriodId) {
  const period = PERIODS.find((candidate) => candidate.id === id);
  return period ?? PERIODS[0];
}

function formattedOf(figure: Figure, value: number) {
  const figureText = value.toFixed(figure.fractionDigits);
  return `${figureText}${figure.suffix}`;
}

function minutesOf(value: number) {
  return formattedOf(REPLY, value);
}

function spokenFigureOf(figure: Figure, period: PeriodId) {
  const reading = figure.readings[period];
  const value = formattedOf(figure, reading.value);
  return `${figure.label} ${value}`;
}

function spokenPeriodOf(id: PeriodId) {
  const period = periodOf(id);
  const figures = FIGURES.map((figure) => spokenFigureOf(figure, id));
  const figuresLine = figures.join('. ');
  return `Showing ${period.spoken}. ${figuresLine}`;
}

function trendCaptionOf(pointName: string) {
  const unit = pointName.toLowerCase();
  return `${REPLY.label} by ${unit}, illustrative`;
}

export default function Stats01() {
  const [period, setPeriod] = useState<PeriodId>('90d');
  const [litId, setLitId] = useState<FigureId | null>(null);
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<PeriodId>();
  const shownPeriod = periodOf(period);
  const pointName = shownPeriod.trendPointName;
  const trendCaption = trendCaptionOf(pointName);

  function resetDemonstration() {
    setPeriod('90d');
    setLitId(null);
  }

  const steps = [
    { after: 2400, run: () => press('12m') },
    { after: PRESS_LEAD_MS, run: () => setPeriod('12m') },
    { after: 2600, run: () => setLitId('handoff') },
    { after: 2600, run: () => setLitId(null) },
    { after: 1400, run: () => press('90d') },
    { after: PRESS_LEAD_MS, run: () => setPeriod('90d') },
    { after: 2600, run: () => setLitId('reply') },
    { after: 2600, run: () => setLitId(null) },
  ];
  const { ref, isAutoplaying } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: resetDemonstration,
  });

  /** A comparison the demonstration showed is not left behind once a person takes over. */
  function isLit(id: FigureId) {
    const isShownByDemonstration = litId === id;
    return isAutoplaying && isShownByDemonstration;
  }

  function pickPeriod(next: PeriodId) {
    setPeriod(next);
    setMessage(spokenPeriodOf(next));
  }

  return (
    <section ref={ref} className='@container'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
          <div className='flex max-w-2xl flex-col gap-3'>
            <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
              <ChartBarIcon className='size-4' />
              {SECTION.label}
            </p>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.lead}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <PeriodSwitch
              value={period}
              pressed={pressed}
              onValueChange={pickPeriod}
            />
            <Badge variant='secondary'>Illustrative</Badge>
          </div>
        </header>
        <div className='flex flex-col gap-4'>
          <div className='grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4'>
            <FigureCell
              figure={REPLY}
              reading={REPLY.readings[period]}
              isLit={isLit('reply')}
              className='@xl:col-span-2'
            >
              <TrendLine
                values={REPLY_TREND[period]}
                max={REPLY_TREND_MAX}
                caption={trendCaption}
                pointName={pointName}
                formatValue={minutesOf}
              />
            </FigureCell>
            <FigureCell
              figure={HANDOFF}
              reading={HANDOFF.readings[period]}
              isLit={isLit('handoff')}
            >
              <WeekdayBars
                values={HANDOFF_BY_WEEKDAY[period]}
                days={WEEKDAYS}
                caption={`${HANDOFF.label} by day of the week, illustrative`}
              />
            </FigureCell>
            <FigureCell
              figure={DRAFTS}
              reading={DRAFTS.readings[period]}
              isLit={isLit('drafts')}
            >
              <Distribution
                values={EDIT_SHARES[period]}
                buckets={EDIT_BUCKETS}
                caption='Words changed before a draft is sent, illustrative'
              />
            </FigureCell>
          </div>
          <p className='text-muted-foreground flex items-start gap-1.5 text-xs text-pretty'>
            <InfoIcon className='mt-px size-3.5 shrink-0' />
            {SECTION.source}
          </p>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
