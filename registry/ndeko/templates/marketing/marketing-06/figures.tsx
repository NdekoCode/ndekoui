'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { ChartBarIcon, InfoIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ANCHORS } from './data';
import { FigureCell } from './figure-cell';
import {
  CLOSE,
  CLOSE_TREND,
  CLOSE_TREND_MAX,
  EDIT_BUCKETS,
  EDIT_SHARES,
  FIGURES,
  MATCHED,
  MATCHED_BY_WEEKDAY,
  PERIODS,
  POSTED,
  SECTION,
  WEEKDAYS,
  type Figure,
  type FigureId,
  type PeriodId,
} from './figures-data';
import { PeriodSwitch } from './period-switch';
import { Distribution, TrendLine, WeekdayBars } from './proofs';
import { SectionFrame, SectionHeader } from './section-frame';

const LOOP_AFTER_MS = 2200;

function periodOf(id: PeriodId) {
  const period = PERIODS.find((candidate) => candidate.id === id);
  return period ?? PERIODS[0];
}

function formattedOf(figure: Figure, value: number) {
  const figureText = value.toFixed(figure.fractionDigits);
  return `${figureText}${figure.suffix}`;
}

function daysOf(value: number) {
  return formattedOf(CLOSE, value);
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
  return `${CLOSE.label} by ${unit}, illustrative`;
}

export function Figures() {
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
    { after: 2600, run: () => setLitId('matched') },
    { after: 2600, run: () => setLitId(null) },
    { after: 1400, run: () => press('90d') },
    { after: PRESS_LEAD_MS, run: () => setPeriod('90d') },
    { after: 2600, run: () => setLitId('close') },
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
    <SectionFrame id={ANCHORS.figures} ref={ref}>
      <SectionHeader
        icon={ChartBarIcon}
        label={SECTION.label}
        title={SECTION.title}
        lead={SECTION.lead}
      >
        <PeriodSwitch
          value={period}
          pressed={pressed}
          onValueChange={pickPeriod}
        />
        <Badge variant='secondary'>Illustrative</Badge>
      </SectionHeader>
      <div className='flex flex-col gap-4'>
        <div className='grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4'>
          <FigureCell
            figure={CLOSE}
            reading={CLOSE.readings[period]}
            isLit={isLit('close')}
            className='@xl:col-span-2'
          >
            <TrendLine
              values={CLOSE_TREND[period]}
              max={CLOSE_TREND_MAX}
              caption={trendCaption}
              pointName={pointName}
              formatValue={daysOf}
            />
          </FigureCell>
          <FigureCell
            figure={MATCHED}
            reading={MATCHED.readings[period]}
            isLit={isLit('matched')}
          >
            <WeekdayBars
              values={MATCHED_BY_WEEKDAY[period]}
              days={WEEKDAYS}
              caption={`${MATCHED.label} by day of the week, illustrative`}
            />
          </FigureCell>
          <FigureCell
            figure={POSTED}
            reading={POSTED.readings[period]}
            isLit={isLit('posted')}
          >
            <Distribution
              values={EDIT_SHARES[period]}
              buckets={EDIT_BUCKETS}
              caption='Fields changed before an entry is posted, illustrative'
            />
          </FigureCell>
        </div>
        <p className='text-muted-foreground flex items-start gap-1.5 text-xs text-pretty'>
          <InfoIcon className='mt-px size-3.5 shrink-0' />
          {SECTION.source}
        </p>
      </div>
      <LiveRegion message={message} />
    </SectionFrame>
  );
}
