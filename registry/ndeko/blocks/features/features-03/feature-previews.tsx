import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Switch } from '@/registry/ndeko/ui/switch';

import {
  type DayHours,
  type FeatureId,
  HOURS_BY_DAY,
  MINI_LANES,
  RULE,
  TIMELINE_BARS,
  type TimelineBar,
  WEEK_DAYS,
} from './data';

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.05] rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const LANE_CARD =
  'bg-card dark:bg-foreground/[0.05] rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.06)]';

const CHART = {
  width: 320,
  height: 176,
  left: 30,
  right: 6,
  top: 10,
  bottom: 26,
  maxHours: 8,
  gridStep: 2,
  barRatio: 0.48,
};

const HOURS_FORMAT = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function BoardsPreview() {
  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-3'>
      {MINI_LANES.map((lane) => (
        <div
          key={lane.title}
          className='bg-foreground/[0.03] flex min-w-0 flex-col gap-2 rounded-lg p-1.5 sm:p-2'
        >
          <div className='flex items-center justify-between gap-1 px-1 pt-0.5'>
            <span className='truncate text-xs font-medium'>{lane.title}</span>
            <Kbd>{lane.cards.length}</Kbd>
          </div>
          {lane.cards.map((card) => (
            <div
              key={card.title}
              className={cn(LANE_CARD, 'flex flex-col gap-2 p-2')}
            >
              <p className='line-clamp-2 text-xs leading-snug font-medium'>
                {card.title}
              </p>
              <Badge variant='secondary' className='text-muted-foreground'>
                {card.label}
              </Badge>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function gridColumnOf(bar: TimelineBar) {
  return `${bar.startDay} / span ${bar.dayCount}`;
}

function TimelinePreview() {
  return (
    <div className='flex flex-col gap-2'>
      <div className='grid grid-cols-5 gap-1.5'>
        {WEEK_DAYS.map((day) => (
          <span
            key={day}
            className='text-muted-foreground px-1 text-xs font-medium'
          >
            {day}
          </span>
        ))}
      </div>
      <div className='bg-foreground/[0.03] grid grid-cols-5 gap-x-1.5 gap-y-2 rounded-lg p-1.5'>
        {TIMELINE_BARS.map((bar) => {
          const barStyle = {
            gridColumn: gridColumnOf(bar),
            '--chip': 'var(--primary)',
          } as React.CSSProperties;

          return (
            <div
              key={bar.title}
              style={barStyle}
              className='chip-3d flex h-8 min-w-0 items-center rounded-md px-2.5 text-xs font-medium'
            >
              <span className='truncate'>{bar.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function runsLabelOf(count: number) {
  if (count === 1) {
    return 'Ran once this week';
  }
  return `Ran ${count} times this week`;
}

function AutomationsPreview() {
  return (
    <div className={cn(CARD, 'flex flex-col gap-4 rounded-xl p-4')}>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm font-medium'>{RULE.name}</p>
        <Switch defaultChecked aria-label={`Turn ${RULE.name} on or off`} />
      </div>
      <dl className='flex flex-col gap-2.5 text-[13px]'>
        <div className='flex flex-wrap items-center gap-2'>
          <dt className='text-muted-foreground w-12'>When</dt>
          <dd className='flex flex-wrap items-center gap-1.5'>
            <Badge variant='secondary' className='text-muted-foreground'>
              {RULE.triggerField}
            </Badge>
            is
            <Chip color='var(--success)'>{RULE.triggerValue}</Chip>
          </dd>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <dt className='text-muted-foreground w-12'>Then</dt>
          <dd className='flex flex-wrap items-center gap-1.5'>
            {RULE.action}
            <Badge variant='secondary' className='text-muted-foreground'>
              {RULE.channel}
            </Badge>
          </dd>
        </div>
      </dl>
      <p className='text-muted-foreground text-xs tabular-nums'>
        {runsLabelOf(RULE.runsThisWeek)}
      </p>
    </div>
  );
}

function plotWidthOf() {
  const horizontalPadding = CHART.left + CHART.right;
  return CHART.width - horizontalPadding;
}

function plotHeightOf() {
  const verticalPadding = CHART.top + CHART.bottom;
  return CHART.height - verticalPadding;
}

function yOf(hours: number) {
  const ratio = hours / CHART.maxHours;
  const remaining = 1 - ratio;
  const plotHeight = plotHeightOf();
  const offset = plotHeight * remaining;
  return CHART.top + offset;
}

function gridHoursOf() {
  const lines: number[] = [];
  for (let hours = 0; hours <= CHART.maxHours; hours += CHART.gridStep) {
    lines.push(hours);
  }
  return lines;
}

function slotWidthOf() {
  return plotWidthOf() / HOURS_BY_DAY.length;
}

function barGeometryOf(entry: DayHours, index: number) {
  const slotWidth = slotWidthOf();
  const width = slotWidth * CHART.barRatio;
  const slotOffset = slotWidth * index;
  const slotStart = CHART.left + slotOffset;
  const freeSpace = slotWidth - width;
  const inset = freeSpace / 2;
  const x = slotStart + inset;
  const y = yOf(entry.hours);
  const baseline = yOf(0);
  const height = baseline - y;
  const halfSlot = slotWidth / 2;
  const center = slotStart + halfSlot;
  return { x, y, width, height, center };
}

function hoursLabelOf(hours: number) {
  const figure = HOURS_FORMAT.format(hours);
  return `${figure} h`;
}

function totalHoursOf(entries: DayHours[]) {
  let total = 0;
  for (const entry of entries) {
    total += entry.hours;
  }
  return total;
}

function ReportsPreview() {
  const gridHours = gridHoursOf();
  const chartRight = CHART.width - CHART.right;
  const labelY = CHART.height - 8;
  const tickX = CHART.left - 6;
  const viewBox = `0 0 ${CHART.width} ${CHART.height}`;
  const totalHours = totalHoursOf(HOURS_BY_DAY);

  return (
    <div className={cn(CARD, 'flex flex-col gap-3 rounded-xl p-4')}>
      <div className='flex items-baseline justify-between gap-3'>
        <div className='flex flex-col'>
          <p className='text-sm font-medium'>Hours this week</p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            {hoursLabelOf(totalHours)} logged
          </p>
        </div>
        <Badge variant='secondary' className='text-muted-foreground'>
          Illustrative
        </Badge>
      </div>
      <svg viewBox={viewBox} aria-hidden='true' className='h-auto w-full'>
        {gridHours.map((hours) => {
          const y = yOf(hours);

          return (
            <g key={hours}>
              <line
                x1={CHART.left}
                x2={chartRight}
                y1={y}
                y2={y}
                className='stroke-border'
                strokeWidth={1}
                vectorEffect='non-scaling-stroke'
              />
              <text
                x={tickX}
                y={y}
                textAnchor='end'
                dominantBaseline='middle'
                className='fill-muted-foreground text-[10px] tabular-nums'
              >
                {hours}h
              </text>
            </g>
          );
        })}
        {HOURS_BY_DAY.map((entry, index) => {
          const bar = barGeometryOf(entry, index);

          return (
            <g key={entry.day}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={5}
                className='fill-primary'
              />
              <text
                x={bar.center}
                y={labelY}
                textAnchor='middle'
                className='fill-muted-foreground text-[10px]'
              >
                {entry.day}
              </text>
            </g>
          );
        })}
      </svg>
      <div className='sr-only'>
        <table>
          <caption>Hours logged per day this week, illustrative</caption>
          <thead>
            <tr>
              <th scope='col'>Day</th>
              <th scope='col'>Hours</th>
            </tr>
          </thead>
          <tbody>
            {HOURS_BY_DAY.map((entry) => (
              <tr key={entry.day}>
                <th scope='row'>{entry.day}</th>
                <td>{hoursLabelOf(entry.hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PREVIEW_BY_ID: Record<FeatureId, () => React.ReactNode> = {
  boards: BoardsPreview,
  timeline: TimelinePreview,
  automations: AutomationsPreview,
  reports: ReportsPreview,
};

export function FeaturePreview({ id }: { id: FeatureId }) {
  const Preview = PREVIEW_BY_ID[id];
  return <Preview />;
}
