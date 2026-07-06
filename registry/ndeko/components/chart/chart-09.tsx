'use client';

import { useCallback, useRef, useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  TriangleAlertIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import { dayLabelsOf, nounOf } from './_parts/format';
import { PLOT_SURFACE } from './_parts/plot';
import { Readout, ReadoutTitle } from './_parts/readout';
import { columnCenterOf, positionsTo } from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { useReading } from './_parts/use-reading';

export type UptimeState = 'up' | 'degraded' | 'down' | 'none';

export type UptimeDay = {
  label: string;
  state: UptimeState;
  /** How long the service was degraded or down that day. */
  minutes?: number;
  /** What happened, in one line. */
  note?: string;
};

export type UptimeBarProps = {
  service: string;
  /** The oldest day first. The bar shows as many of the latest days as its width holds. */
  days: readonly UptimeDay[];
  /** The day whose details stay open under the bar, counted in `days`. */
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  /** Shows the readout of a day without a pointer, for a demonstration. Counted in `days`. */
  guideIndex?: number | null;
  className?: string;
};

/** The counts of days a bar can show, most first. Each needs 3px a day and 2px between two days. */
const DAY_COUNTS = [90, 60, 30];

const DAY_PITCH_PX = 5;

const DAY_GAP_PX = 2;

const FALLBACK_WIDTH = 420;

const MINUTES_PER_DAY = 1440;

const STATE_FILL: Record<UptimeState, string> = {
  up: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-destructive',
  none: 'bg-foreground/10',
};

const STATE_TONE: Record<UptimeState, string> = {
  up: 'text-success-foreground',
  degraded: 'text-warning-foreground',
  down: 'text-destructive-ink',
  none: 'text-muted-foreground',
};

const STATE_ICON: Record<UptimeState, Icon> = {
  up: CircleCheckIcon,
  degraded: TriangleAlertIcon,
  down: CircleXIcon,
  none: CircleDashedIcon,
};

const STATE_WORD: Record<UptimeState, string> = {
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
  none: 'No data',
};

const UPTIME = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function widthOfDays(count: number) {
  const pitches = count * DAY_PITCH_PX;
  return pitches - DAY_GAP_PX;
}

/** The most days that fit, so the bars thin out on a narrow piece and nothing scrolls sideways. */
function fittingDayCountOf(width: number) {
  const fitting = DAY_COUNTS.find((count) => widthOfDays(count) <= width);
  return fitting ?? DAY_COUNTS[DAY_COUNTS.length - 1];
}

function durationOf(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${rest} min`;
}

function stateWordsOf(day: UptimeDay) {
  if (day.state === 'up') {
    return 'Up all day';
  }
  if (day.state === 'none') {
    return 'No data';
  }
  const word = STATE_WORD[day.state];
  if (day.minutes === undefined) {
    return word;
  }
  return `${word} for ${durationOf(day.minutes)}`;
}

function hasData(day: UptimeDay) {
  return day.state !== 'none';
}

function downMinutesOf(day: UptimeDay) {
  if (day.state === 'down') {
    return day.minutes ?? MINUTES_PER_DAY;
  }
  return 0;
}

/** The share of the measured time the service was not down. Days without data are left out of it. */
function uptimeOf(days: readonly UptimeDay[]) {
  const measured = days.filter(hasData);
  if (measured.length === 0) {
    return null;
  }
  let downMinutes = 0;
  for (const day of measured) {
    downMinutes += downMinutesOf(day);
  }
  const totalMinutes = measured.length * MINUTES_PER_DAY;
  const downShare = downMinutes / totalMinutes;
  return 1 - downShare;
}

function uptimeTextOf(days: readonly UptimeDay[]) {
  const uptime = uptimeOf(days);
  if (uptime === null) {
    return 'No data';
  }
  return `${UPTIME.format(uptime)} uptime`;
}

function countOf(days: readonly UptimeDay[], state: UptimeState) {
  const matching = days.filter((day) => day.state === state);
  return matching.length;
}

function summaryOf(service: string, days: readonly UptimeDay[]) {
  const uptime = uptimeTextOf(days);
  const degraded = countOf(days, 'degraded');
  const down = countOf(days, 'down');
  const degradedDays = nounOf(degraded, 'day', 'days');
  const downDays = nounOf(down, 'day', 'days');
  return `${service}: ${uptime} over the last ${days.length} days, ${degraded} ${degradedDays} degraded, ${down} ${downDays} with an outage.`;
}

/** An index counted in every day, as an index in the days that are shown. Null when it is not shown. */
function shownIndexOf(index: number | null, hiddenCount: number) {
  if (index === null) {
    return null;
  }
  const shown = index - hiddenCount;
  if (shown < 0) {
    return null;
  }
  return shown;
}

function liftedOf(isLifted: boolean) {
  if (isLifted) {
    return 'scale-y-[1.15]';
  }
  return undefined;
}

type DayDetailProps = {
  day: UptimeDay;
  onClear: () => void;
};

function DayDetail({ day, onClear }: DayDetailProps) {
  const StateIcon = STATE_ICON[day.state];

  return (
    <div className='bg-foreground/[0.04] mt-1.5 flex items-start gap-2 rounded-md py-1.5 ps-2.5 pe-1 text-xs leading-5'>
      <StateIcon
        className={cn('mt-[3px] size-3.5 shrink-0', STATE_TONE[day.state])}
      />
      <p className='min-w-0 flex-1 text-pretty'>
        <span className='font-medium'>{day.label}</span>
        <span className='text-muted-foreground'> · {stateWordsOf(day)}</span>
        {day.note && (
          <span className='text-muted-foreground'>. {day.note}</span>
        )}
      </p>
      <button
        type='button'
        aria-label='Close the details of this day'
        onClick={onClear}
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px]'
      >
        <XIcon className='size-3.5' />
      </button>
    </div>
  );
}

/** The day last selected stays written while its details fold away. */
function useKeptDay(day: UptimeDay | null) {
  const [kept, setKept] = useState(day);
  const isNewDay = day !== null && day !== kept;
  if (isNewDay) {
    setKept(day);
  }
  return kept;
}

export function UptimeBar({
  service,
  days,
  selectedIndex,
  onSelectedIndexChange,
  guideIndex = null,
  className,
}: UptimeBarProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const plot = useRef<HTMLDivElement | null>(null);
  const wantedCount = fittingDayCountOf(width);
  const shownCount = Math.min(wantedCount, days.length);
  const hiddenCount = days.length - shownCount;
  const shown = days.slice(hiddenCount);
  const lastIndex = Math.max(shownCount - 1, 0);

  function selectShown(index: number) {
    onSelectedIndexChange(index + hiddenCount);
  }

  const reading = useReading({
    count: shownCount,
    defaultIndex: lastIndex,
    guideIndex: shownIndexOf(guideIndex, hiddenCount),
    onSelect: selectShown,
  });
  const shownDay = shown.at(reading.shownIndex);
  const selectedShownIndex = shownIndexOf(selectedIndex, hiddenCount);
  const selectedDay = days[selectedIndex ?? -1] ?? null;
  const keptDay = useKeptDay(selectedDay);
  const isReadoutShown = reading.isActive && shownDay !== undefined;
  const shownState = shownDay?.state ?? 'none';
  const ShownIcon = STATE_ICON[shownState];
  const shownWords = wordsOf(shownDay);
  const spoken = spokenOf(shownDay, reading.isReadingByKeys, selectedDay);
  const safeCount = Math.max(shownCount, 1);
  const selectedRatio = columnCenterOf(selectedShownIndex ?? 0, safeCount);
  const selectedShare = selectedRatio * 100;
  const uptimeText = uptimeTextOf(shown);
  const spanText = `${shownCount} days`;

  function pressKey(event: React.KeyboardEvent<HTMLElement>) {
    reading.handlers.onKeyDown(event);
    if (event.key === 'Escape') {
      onSelectedIndexChange(null);
    }
  }

  /** Stable, since it sets the measured element: a new callback on every render would set it twice per commit. */
  const keepPlot = useCallback(
    (element: HTMLDivElement | null) => {
      plot.current = element;
      plotRef(element);
    },
    [plotRef]
  );

  /** The details fold away with the button that closed them, so the focus goes back to the days. */
  function closeDetails() {
    onSelectedIndexChange(null);
    plot.current?.focus({ preventScroll: true });
  }

  const rows: DataRow[] = shown.map((day, index) => ({
    id: `${index}-${day.label}`,
    label: day.label,
    cells: [stateWordsOf(day), day.note ?? ''],
  }));

  return (
    <div className={cn('relative flex flex-col', className)}>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pb-1.5'>
        <span className='min-w-0 text-[13px] font-medium text-pretty'>
          {service}
        </span>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {uptimeText} · {spanText}
        </span>
      </div>
      <div
        ref={keepPlot}
        role='group'
        tabIndex={0}
        aria-label={`${summaryOf(service, shown)} Use the arrow keys to read each day, Enter to keep its details open.`}
        className={cn(
          PLOT_SURFACE,
          'flex h-8 cursor-pointer items-stretch gap-0.5'
        )}
        {...reading.handlers}
        onKeyDown={pressKey}
      >
        {shown.map((day, index) => (
          <span
            key={`${index}-${day.label}`}
            aria-hidden='true'
            className={cn(
              'min-w-0 flex-1 origin-bottom rounded-[2px] transition-transform duration-100 ease-(--ease-out-strong)',
              STATE_FILL[day.state],
              liftedOf(reading.isActive && index === reading.shownIndex)
            )}
          />
        ))}
        {selectedShownIndex !== null && (
          <span
            aria-hidden='true'
            className='pointer-events-none absolute top-full left-0 size-0 transition-transform duration-200 ease-(--ease-out-strong)'
            style={{ transform: `translateX(${selectedShare}cqw)` }}
          >
            <span className='bg-foreground absolute top-0.5 size-1 -translate-x-1/2 rounded-full' />
          </span>
        )}
        <Readout
          ratio={columnCenterOf(reading.shownIndex, safeCount)}
          top={0}
          isVisible={isReadoutShown}
          isGliding={reading.isGliding}
          hasCrosshair={false}
        >
          <ReadoutTitle>{shownDay?.label}</ReadoutTitle>
          <span className='flex items-center gap-1.5 text-[13px] font-medium'>
            <ShownIcon
              className={cn('size-3.5 shrink-0', STATE_TONE[shownState])}
            />
            {shownWords}
          </span>
        </Readout>
      </div>
      <Fold open={selectedDay !== null}>
        {keptDay && <DayDetail day={keptDay} onClear={closeDetails} />}
      </Fold>
      <LiveRegion message={spoken} />
      <DataTable
        caption={`${service}, day by day`}
        columns={['Day', 'State', 'What happened']}
        rows={rows}
      />
    </div>
  );
}

function wordsOf(day: UptimeDay | undefined) {
  if (!day) {
    return '';
  }
  return stateWordsOf(day);
}

/** A day is said when the arrow keys reach it, and its note when it is the one kept open. */
function spokenOf(
  day: UptimeDay | undefined,
  isReadingByKeys: boolean,
  selectedDay: UptimeDay | null
) {
  const isSilent = !isReadingByKeys || day === undefined;
  if (isSilent) {
    return '';
  }
  const reading = `${day.label}: ${stateWordsOf(day)}`;
  const isSelected = day === selectedDay;
  if (!isSelected) {
    return reading;
  }
  const note = day.note ?? 'Details open';
  return `${reading}. ${note}`;
}

type Incident = {
  state: UptimeState;
  minutes: number;
  note: string;
};

type Service = {
  id: string;
  name: string;
  /** The first day the service was measured. Before it, there is no data. */
  measuredFrom: number;
  /** What went wrong, by day. */
  incidents: Record<number, Incident>;
};

const DAY_TOTAL = 90;

const DAY_LABELS = dayLabelsOf('2026-03-01', DAY_TOTAL);

const SERVICES: Service[] = [
  {
    id: 'api',
    name: 'API',
    measuredFrom: 0,
    incidents: {
      47: {
        state: 'degraded',
        minutes: 14,
        note: 'A slow database replica was taken out of rotation',
      },
      71: {
        state: 'down',
        minutes: 18,
        note: 'A bad deploy was rolled back',
      },
      84: {
        state: 'degraded',
        minutes: 42,
        note: 'Search answered slowly while its index was rebuilt',
      },
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    measuredFrom: 0,
    incidents: {
      62: {
        state: 'degraded',
        minutes: 25,
        note: 'Charts loaded slowly for accounts in one region',
      },
      71: {
        state: 'degraded',
        minutes: 18,
        note: 'Pages showed stale figures during the API rollback',
      },
    },
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    measuredFrom: 44,
    incidents: {
      58: {
        state: 'degraded',
        minutes: 37,
        note: 'Deliveries ran up to five minutes late',
      },
      79: {
        state: 'down',
        minutes: 72,
        note: 'Deliveries were queued, then replayed in order',
      },
    },
  },
];

function dayOf(service: Service, index: number): UptimeDay {
  const label = DAY_LABELS[index];
  if (index < service.measuredFrom) {
    return { label, state: 'none' };
  }
  const incident = service.incidents[index];
  if (!incident) {
    return { label, state: 'up' };
  }
  return { label, ...incident };
}

function daysOf(service: Service) {
  return DAY_LABELS.map((_, index) => dayOf(service, index));
}

const SERVICE_DAYS: Record<string, UptimeDay[]> = Object.fromEntries(
  SERVICES.map((service) => [service.id, daysOf(service)])
);

const STATES: UptimeState[] = ['up', 'degraded', 'down', 'none'];

function StateLegend() {
  return (
    <ul
      aria-label='What the colours mean'
      className='flex flex-wrap gap-x-4 gap-y-1'
    >
      {STATES.map((state) => (
        <li key={state} className='flex items-center gap-1.5 text-xs'>
          <span
            aria-hidden='true'
            className={cn('size-2 rounded-[2px]', STATE_FILL[state])}
          />
          {STATE_WORD[state]}
        </li>
      ))}
    </ul>
  );
}

type Guide = {
  serviceId: string;
  index: number;
};

type Selection = Record<string, number | null>;

const NOTHING_SELECTED: Selection = {};

const API_INCIDENT = 84;

const WEBHOOKS_OUTAGE = 79;

function guidesTo(serviceId: string, from: number, to: number): Guide[] {
  const positions = positionsTo(from, to);
  return positions.map((index) => ({ serviceId, index }));
}

const TO_API_INCIDENT = guidesTo('api', 78, API_INCIDENT);

const TO_WEBHOOKS_OUTAGE = guidesTo('webhooks', 73, WEBHOOKS_OUTAGE);

function guideIndexOf(guide: Guide | null, serviceId: string) {
  if (guide?.serviceId === serviceId) {
    return guide.index;
  }
  return null;
}

export default function Chart09() {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [selection, setSelection] = useState<Selection>(NOTHING_SELECTED);

  function select(serviceId: string, index: number | null) {
    setSelection((current) => ({ ...current, [serviceId]: index }));
  }

  function resetDemo() {
    setGuide(null);
    setSelection(NOTHING_SELECTED);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(TO_API_INCIDENT, setGuide, { startAfter: 1200, stepMs: 200 }),
    { after: 900, run: () => select('api', API_INCIDENT) },
    ...walkSteps(TO_WEBHOOKS_OUTAGE, setGuide, {
      startAfter: 2400,
      stepMs: 200,
    }),
    { after: 900, run: () => select('webhooks', WEBHOOKS_OUTAGE) },
    { after: 2400, run: () => setGuide(null) },
    { after: 800, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });
  const shownGuide = whileDemonstrating(isAutoplaying, guide);

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[25.5rem] w-full max-w-[34rem]'
    >
      <ChartCard
        title='Uptime'
        note='Illustrative'
        summary='Three services, one bar per day: up, degraded, down or no data.'
        className='w-full'
      >
        <div className='flex flex-col gap-4'>
          {SERVICES.map((service) => (
            <UptimeBar
              key={service.id}
              service={service.name}
              days={SERVICE_DAYS[service.id]}
              selectedIndex={selection[service.id] ?? null}
              onSelectedIndexChange={(index) => select(service.id, index)}
              guideIndex={guideIndexOf(shownGuide, service.id)}
            />
          ))}
        </div>
        <StateLegend />
      </ChartCard>
    </div>
  );
}
