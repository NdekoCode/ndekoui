'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { useId, useRef } from 'react';

import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  TOOLTIP_GLIDE,
  Tooltip,
  type TooltipHandle,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

type Source = 'direct' | 'search' | 'referral';

type SourceEntry = { key: Source; label: string; colorClass: string };

type DayVisits = {
  day: string;
  date: string;
  visits: Record<Source, number>;
};

const SOURCES: SourceEntry[] = [
  { key: 'direct', label: 'Direct', colorClass: 'bg-chart-1' },
  { key: 'search', label: 'Search', colorClass: 'bg-chart-2' },
  { key: 'referral', label: 'Referral', colorClass: 'bg-chart-3' },
];

const WEEK: DayVisits[] = [
  {
    day: 'Mon',
    date: 'Monday, Aug 12',
    visits: { direct: 380, search: 690, referral: 110 },
  },
  {
    day: 'Tue',
    date: 'Tuesday, Aug 13',
    visits: { direct: 412, search: 736, referral: 128 },
  },
  {
    day: 'Wed',
    date: 'Wednesday, Aug 14',
    visits: { direct: 356, search: 640, referral: 96 },
  },
  {
    day: 'Thu',
    date: 'Thursday, Aug 15',
    visits: { direct: 440, search: 802, referral: 150 },
  },
  {
    day: 'Fri',
    date: 'Friday, Aug 16',
    visits: { direct: 398, search: 710, referral: 134 },
  },
  {
    day: 'Sat',
    date: 'Saturday, Aug 17',
    visits: { direct: 210, search: 388, referral: 64 },
  },
  {
    day: 'Sun',
    date: 'Sunday, Aug 18',
    visits: { direct: 186, search: 342, referral: 58 },
  },
];

const BAR_TRIGGER =
  'hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-ring focus-visible:ring-offset-background flex h-full w-9.5 flex-col items-center gap-1.5 rounded-md px-[9px] pt-2 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const READOUT = [
  'surface-raised flex w-48 flex-col gap-2 rounded-xl p-3 text-[13px] outline-none',
  POPUP_TRANSITION,
  'data-instant:transition-none',
].join(' ');

function totalOf(day: DayVisits) {
  const { direct, search, referral } = day.visits;
  return direct + search + referral;
}

const DAY_TOTALS = WEEK.map(totalOf);
const BUSIEST_DAY_TOTAL = Math.max(...DAY_TOTALS);

function percentOf(part: number, whole: number) {
  const ratio = part / whole;
  return `${ratio * 100}%`;
}

function formatVisits(count: number) {
  return count.toLocaleString('en-US');
}

function visitsOfSource(day: DayVisits, source: SourceEntry) {
  const count = formatVisits(day.visits[source.key]);
  const label = source.label.toLowerCase();
  return `${count} ${label}`;
}

function readoutLabelOf(day: DayVisits) {
  const parts = SOURCES.map((source) => visitsOfSource(day, source));
  const summary = parts.join(', ');
  return `${day.date}: ${summary} visits`;
}

function triggerIdOf(chartId: string, day: DayVisits) {
  return `${chartId}-${day.day}`;
}

type DayBarProps = {
  day: DayVisits;
  triggerId: string;
  readout: TooltipHandle<DayVisits>;
};

function DayBar({ day, triggerId, readout }: DayBarProps) {
  const pointerTypeRef = useRef('');
  const total = totalOf(day);
  const barHeight = percentOf(total, BUSIEST_DAY_TOTAL);

  function rememberPointerType(event: React.PointerEvent<HTMLButtonElement>) {
    pointerTypeRef.current = event.pointerType;
  }

  // Base UI tooltips ignore touch, so a tap opens the readout itself.
  function openOnTap() {
    const isTap = pointerTypeRef.current === 'touch';
    if (!isTap) {
      return;
    }
    readout.open(triggerId);
  }

  return (
    <TooltipTrigger
      id={triggerId}
      handle={readout}
      payload={day}
      delay={0}
      closeOnClick={false}
      onPointerDown={rememberPointerType}
      onClick={openOnTap}
      aria-label={readoutLabelOf(day)}
      className={BAR_TRIGGER}
    >
      <span className='flex w-full flex-1 items-end'>
        <span
          className='flex w-full flex-col-reverse overflow-hidden rounded-[3px]'
          style={{ height: barHeight }}
        >
          {SOURCES.map((source) => (
            <span
              key={source.key}
              className={source.colorClass}
              style={{ height: percentOf(day.visits[source.key], total) }}
            />
          ))}
        </span>
      </span>
      <span className='text-muted-foreground text-[11px]'>{day.day}</span>
    </TooltipTrigger>
  );
}

function ReadoutBody({ day }: { day: DayVisits | undefined }) {
  if (!day) {
    return null;
  }
  return (
    <>
      <p className='text-[13px] leading-none font-medium'>{day.date}</p>
      <ul className='flex flex-col gap-1.5 text-xs'>
        {SOURCES.map((source) => (
          <li key={source.key} className='flex items-center gap-2'>
            <span
              className={cn('size-2 shrink-0 rounded-full', source.colorClass)}
              aria-hidden='true'
            />
            {source.label}
            <span className='ml-auto font-medium tabular-nums'>
              {formatVisits(day.visits[source.key])}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Tooltip09() {
  const chartId = useId();
  const readout = useTooltipHandle<DayVisits>();

  return (
    <figure className='flex flex-col gap-2'>
      <figcaption className='text-muted-foreground text-xs'>
        Visits by source, week of Aug 12
      </figcaption>
      <div className='flex h-36 items-end'>
        {WEEK.map((day) => (
          <DayBar
            key={day.day}
            day={day}
            triggerId={triggerIdOf(chartId, day)}
            readout={readout}
          />
        ))}
      </div>
      <Tooltip handle={readout}>
        {({ payload }) => (
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
              side='top'
              sideOffset={6}
              className={cn('z-50', TOOLTIP_GLIDE)}
            >
              <TooltipPrimitive.Popup className={READOUT}>
                <ReadoutBody day={payload} />
              </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
          </TooltipPrimitive.Portal>
        )}
      </Tooltip>
    </figure>
  );
}
