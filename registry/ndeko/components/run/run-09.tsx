'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';

import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { FADE, risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type UsageEntity = {
  id: string;
  name: string;
  /** Fixed per entity, so a colour always means the same model or agent whatever its rank. */
  series: SeriesSlot;
  spendUsd: number;
};

export type UsagePeriod = {
  label: string;
  limitUsd: number;
  byModel: UsageEntity[];
  byAgent: UsageEntity[];
  /** One spend per day of the period; days not reached yet are left out. */
  dailyUsd: number[];
  daysInPeriod: number;
  /** Index of today in `dailyUsd`, when the period is the current one. */
  todayIndex?: number;
  resetsOn: string;
};

export type GroupBy = 'model' | 'agent';

type PeriodId = 'this-month' | 'last-month';

const PERIODS: Segment<PeriodId>[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
];

const GROUPINGS: Segment<GroupBy>[] = [
  { value: 'model', label: 'Model' },
  { value: 'agent', label: 'Agent' },
];

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

const WHOLE_USD: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const WARNING_FROM = 0.8;

/** The bar's scale rounds up in steps of $250, with room above the limit for its tick. */
const SCALE_STEP_USD = 250;

const SCALE_HEADROOM = 1.2;

const RAISE_LABELS: Record<MorphState, string> = {
  idle: 'Raise limit',
  busy: 'Raising',
  done: 'Raised',
};

const USD_TEXT = new Intl.NumberFormat('en-US', WHOLE_USD);

function totalOf(entities: UsageEntity[]) {
  let total = 0;
  for (const entity of entities) {
    total += entity.spendUsd;
  }
  return total;
}

function scaleOf(limit: number, total: number) {
  const peak = Math.max(limit, total);
  const withRoom = peak * SCALE_HEADROOM;
  const steps = Math.ceil(withRoom / SCALE_STEP_USD);
  return steps * SCALE_STEP_USD;
}

function percentOf(value: number, scale: number) {
  const share = value / scale;
  return share * 100;
}

function entitiesOf(period: UsagePeriod, groupBy: GroupBy) {
  if (groupBy === 'agent') {
    return period.byAgent;
  }
  return period.byModel;
}

type StackSegment = {
  entity: UsageEntity;
  /** Where the segment starts on the bar and how much of it is its own, both from 0 to 1. */
  start: number;
  share: number;
};

const BAR_TRAVEL =
  'transition-transform duration-700 ease-(--ease-out-strong) motion-reduce:transition-none';

function stackOf(entities: UsageEntity[], scale: number) {
  const segments: StackSegment[] = [];
  let start = 0;
  for (const entity of entities) {
    const share = entity.spendUsd / scale;
    segments.push({ entity, start, share });
    start += share;
  }
  return segments;
}

/** A segment is the whole bar, moved to its start and scaled to its share: no width to lay out. */
function segmentStyleOf(segment: StackSegment): React.CSSProperties {
  const offset = segment.start * 100;
  return {
    backgroundColor: seriesColorOf(segment.entity.series),
    transform: `translateX(${offset}%) scaleX(${segment.share})`,
  };
}

/** A gap after a segment: a mark of the surface behind the bar, moved to where the segment ends. */
function gapStyleOf(segment: StackSegment): React.CSSProperties {
  const end = segment.start + segment.share;
  const offset = end * 100;
  return { transform: `translateX(${offset}%)` };
}

function hasSpend(segment: StackSegment) {
  return segment.share > 0;
}

function StackedBar({
  entities,
  limit,
  scale,
  label,
}: {
  entities: UsageEntity[];
  limit: number;
  scale: number;
  label: string;
}) {
  const total = totalOf(entities);
  const tickOffset = percentOf(limit, scale);
  const totalText = USD_TEXT.format(total);
  const limitText = USD_TEXT.format(limit);
  const spoken = `${totalText} spent of a ${limitText} limit`;
  const valueNow = Math.min(total, limit);
  const segments = stackOf(entities, scale);
  const spent = segments.filter(hasSpend);

  return (
    <div className='relative pt-1 pb-5'>
      <div
        role='meter'
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={valueNow}
        aria-valuetext={spoken}
        className='bg-foreground/[0.05] relative h-3 overflow-hidden rounded-full'
      >
        <AnimatePresence initial={false}>
          {segments.map((segment) => (
            <motion.span
              key={segment.entity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className={cn('absolute inset-0 origin-left', BAR_TRAVEL)}
              style={segmentStyleOf(segment)}
            />
          ))}
        </AnimatePresence>
        {spent.map((segment) => (
          <span
            key={segment.entity.id}
            className={cn('absolute inset-0', BAR_TRAVEL)}
            style={gapStyleOf(segment)}
          >
            <span className='bg-card absolute inset-y-0 start-0 w-0.5' />
          </span>
        ))}
      </div>
      <div
        className={cn('pointer-events-none absolute inset-0', BAR_TRAVEL)}
        style={{ transform: `translateX(${tickOffset}%)` }}
      >
        <span
          aria-hidden='true'
          className='bg-foreground/60 absolute start-0 top-0 h-5 w-0.5 -translate-x-1/2 rounded-full'
        />
        <span className='text-muted-foreground absolute start-0 top-6 -translate-x-1/2 text-[11px] whitespace-nowrap'>
          Limit <MotionNumber value={limit} format={WHOLE_USD} />
        </span>
      </div>
    </div>
  );
}

function Legend({ entities }: { entities: UsageEntity[] }) {
  const total = totalOf(entities);
  const base = Math.max(total, 1);

  return (
    <AnimatedSize>
      <ul aria-label='Spend by entity' className='flex flex-col'>
        <AnimatePresence initial={false} mode='popLayout'>
          {entities.map((entity) => {
            const share = percentOf(entity.spendUsd, base);
            return (
              <motion.li
                key={entity.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={FADE}
                className='flex h-8 items-center gap-2.5 text-[13px]'
              >
                <span
                  aria-hidden='true'
                  className='size-2 shrink-0 rounded-full'
                  style={{ backgroundColor: seriesColorOf(entity.series) }}
                />
                <span className='min-w-0 flex-1 truncate'>{entity.name}</span>
                <MotionNumber
                  value={share}
                  format={PERCENT}
                  suffix='%'
                  className='text-muted-foreground w-10 justify-end text-xs'
                />
                <MotionNumber
                  value={entity.spendUsd}
                  format={USD}
                  className='w-20 justify-end'
                />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </AnimatedSize>
  );
}

/** Days rise one after the other when a period arrives, 18ms apart. */
const DAY_STAGGER_MS = 18;

function dailyBarStyleOf(
  spend: number,
  maxSpend: number,
  index: number
): React.CSSProperties {
  const share = spend / maxSpend;
  const bounded = Math.max(0.04, share);
  const delay = index * DAY_STAGGER_MS;
  return { transform: `scaleY(${bounded})`, transitionDelay: `${delay}ms` };
}

function dayFillOf(index: number, todayIndex: number | undefined) {
  if (index === todayIndex) {
    return 'bg-primary';
  }
  return 'bg-foreground/25';
}

function maxOf(values: number[]) {
  let max = 1;
  for (const value of values) {
    max = Math.max(max, value);
  }
  return max;
}

function dayCountLabelOf(period: UsagePeriod) {
  if (period.todayIndex === undefined) {
    return `${period.daysInPeriod} days`;
  }
  const day = period.todayIndex + 1;
  return `Day ${day} of ${period.daysInPeriod}`;
}

function DailyBars({ period }: { period: UsagePeriod }) {
  const maxSpend = maxOf(period.dailyUsd);
  const aheadCount = period.daysInPeriod - period.dailyUsd.length;
  const aheadDays = Array.from({ length: aheadCount }, (_, index) => index);

  return (
    <div className='flex flex-col gap-1.5'>
      <div aria-hidden='true' className='flex h-12 items-end gap-[3px]'>
        {period.dailyUsd.map((spend, index) => (
          <span
            key={index}
            className={cn(
              'h-full min-w-0 flex-1 origin-bottom rounded-t-[2px] transition-[transform,background-color] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
              dayFillOf(index, period.todayIndex)
            )}
            style={dailyBarStyleOf(spend, maxSpend, index)}
          />
        ))}
        {aheadDays.map((day) => (
          <span
            key={`ahead-${day}`}
            className='hairline-border border-foreground/15 h-2 min-w-0 flex-1 rounded-[2px] border-dashed'
          />
        ))}
      </div>
      <div className='text-muted-foreground flex items-center justify-between gap-3 text-xs'>
        <span>{dayCountLabelOf(period)}</span>
        <span>Resets on {period.resetsOn}</span>
      </div>
      <div className='sr-only'>
        <table>
          <caption>Spend per day, {period.label}</caption>
          <tbody>
            {period.dailyUsd.map((spend, index) => (
              <tr key={index}>
                <th scope='row'>Day {index + 1}</th>
                <td>{USD_TEXT.format(spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type UsageByModelProps = {
  period: UsagePeriod;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  periodSwitch?: React.ReactNode;
  raiseState?: MorphState;
  onRaiseLimit?: () => void;
  raisedLine?: string | null;
  /** Shows Raise limit held down, for a demonstration that presses it. */
  isRaisePressed?: boolean;
  className?: string;
};

export function UsageByModel({
  period,
  groupBy,
  onGroupByChange,
  periodSwitch,
  raiseState = 'idle',
  onRaiseLimit,
  raisedLine = null,
  isRaisePressed = false,
  className,
}: UsageByModelProps) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const entities = entitiesOf(period, groupBy);
  const total = totalOf(entities);
  const limit = period.limitUsd;
  const scale = scaleOf(limit, total);
  const usedShare = total / limit;
  const usedPercent = usedShare * 100;
  const isNearLimit = usedShare >= WARNING_FROM;
  const isRaising = raiseState !== 'idle';
  const isNoticeShown = isNearLimit || isRaising;
  const trace = traceOf(raisedLine, isNoticeShown);
  const groupLabel = `Spend by ${groupBy}`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h3 id={titleId} className='text-sm font-medium'>
            Usage
          </h3>
          <Badge variant='secondary'>Illustrative</Badge>
        </div>
        {periodSwitch}
      </header>

      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <p className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={total}
            format={USD}
            className='text-2xl font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>
            of <MotionNumber value={limit} format={WHOLE_USD} />
          </span>
        </p>
        <MotionNumber
          value={usedPercent}
          format={PERCENT}
          suffix='% used'
          className={cn(
            'text-xs transition-colors duration-200',
            usedToneOf(isNearLimit)
          )}
        />
      </div>

      <StackedBar
        entities={entities}
        limit={limit}
        scale={scale}
        label={groupLabel}
      />

      <div className='flex flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs'>Group by</span>
          <Segments
            value={groupBy}
            segments={GROUPINGS}
            onValueChange={onGroupByChange}
            label='Group the spend by'
          />
        </div>
        <Legend entities={entities} />
      </div>

      <DailyBars period={period} />

      <AnimatePresence initial={false} mode='popLayout'>
        {isNoticeShown && (
          <motion.div key='notice' className='@container' {...risePresence}>
            <div className='bg-warning/10 flex flex-col gap-2.5 rounded-lg p-3 @lg:flex-row @lg:items-center'>
              <p className='text-warning-foreground flex min-w-0 flex-1 items-start gap-2 text-xs leading-5'>
                <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
                Agents pause when the limit is reached. Raise it to keep them
                running until the reset.
              </p>
              <MorphButton
                type='button'
                size='sm'
                variant='outline'
                state={raiseState}
                labels={RAISE_LABELS}
                onClick={onRaiseLimit}
                className={pressedQuietOf(isRaisePressed)}
              />
            </div>
          </motion.div>
        )}
        {trace && (
          <motion.p
            key='raised'
            className='text-muted-foreground flex items-center gap-2 text-xs'
            {...risePresence}
          >
            <CheckIcon className='text-success-foreground size-3.5' />
            {trace}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

function traceOf(raisedLine: string | null, isNoticeShown: boolean) {
  if (isNoticeShown) {
    return null;
  }
  return raisedLine;
}

function usedToneOf(isNearLimit: boolean) {
  if (isNearLimit) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

const THIS_MONTH: UsagePeriod = {
  label: 'this month',
  limitUsd: 500,
  byModel: [
    { id: 'claude-haiku', name: 'Claude Haiku', series: 1, spendUsd: 96.4 },
    { id: 'claude-sonnet', name: 'Claude Sonnet', series: 2, spendUsd: 171.2 },
    { id: 'claude-opus', name: 'Claude Opus', series: 3, spendUsd: 147.6 },
  ],
  byAgent: [
    { id: 'planner', name: 'Planner', series: 1, spendUsd: 88.3 },
    { id: 'researcher', name: 'Researcher', series: 2, spendUsd: 142.1 },
    { id: 'writer', name: 'Writer', series: 3, spendUsd: 121.5 },
    { id: 'reviewer', name: 'Reviewer', series: 4, spendUsd: 63.3 },
  ],
  dailyUsd: [
    18.2, 21.4, 24.9, 19.6, 12.1, 9.8, 22.7, 26.3, 25.1, 28.4, 23, 11.2, 10.4,
    27.9, 30.6, 31.8, 29.2, 42.6,
  ],
  daysInPeriod: 30,
  todayIndex: 17,
  resetsOn: 'the 1st',
};

const LAST_MONTH: UsagePeriod = {
  label: 'last month',
  limitUsd: 500,
  byModel: [
    { id: 'claude-haiku', name: 'Claude Haiku', series: 1, spendUsd: 82.1 },
    { id: 'claude-sonnet', name: 'Claude Sonnet', series: 2, spendUsd: 131.7 },
    { id: 'claude-opus', name: 'Claude Opus', series: 3, spendUsd: 104.8 },
  ],
  byAgent: [
    { id: 'planner', name: 'Planner', series: 1, spendUsd: 71.4 },
    { id: 'researcher', name: 'Researcher', series: 2, spendUsd: 109.9 },
    { id: 'writer', name: 'Writer', series: 3, spendUsd: 92.6 },
    { id: 'reviewer', name: 'Reviewer', series: 4, spendUsd: 44.7 },
  ],
  dailyUsd: [
    9.4, 11.2, 12.8, 10.1, 6.2, 5.4, 11.9, 12.6, 13.1, 12.2, 10.8, 5.9, 5.1,
    12.4, 13.7, 12.9, 11.6, 10.2, 6, 5.6, 12.1, 13.4, 14.2, 12.7, 11.3, 6.4,
    5.8, 12.9, 13.6, 17.1,
  ],
  daysInPeriod: 30,
  resetsOn: 'the 1st',
};

const RAISED_LIMIT_USD = 750;

const RAISED_LIMIT_TEXT = USD_TEXT.format(RAISED_LIMIT_USD);

const RAISE_BUSY_MS = 700;

const RAISE_DONE_MS = 700;

function unspent(entity: UsageEntity): UsageEntity {
  return { ...entity, spendUsd: 0 };
}

/** The first morning of the month: nothing spent yet, every day still to come. */
const MONTH_START: UsagePeriod = {
  ...THIS_MONTH,
  byModel: THIS_MONTH.byModel.map(unspent),
  byAgent: THIS_MONTH.byAgent.map(unspent),
  dailyUsd: THIS_MONTH.dailyUsd.map(() => 0),
  todayIndex: 0,
};

function thisMonthOf(isStarting: boolean) {
  if (isStarting) {
    return MONTH_START;
  }
  return THIS_MONTH;
}

function periodOf(
  periodId: PeriodId,
  raisedLimit: number | null,
  isStarting: boolean
) {
  if (periodId === 'last-month') {
    return LAST_MONTH;
  }
  const month = thisMonthOf(isStarting);
  if (raisedLimit === null) {
    return month;
  }
  return { ...month, limitUsd: raisedLimit };
}

function raisedLineOf(periodId: PeriodId, raisedLimit: number | null) {
  const isThisMonth = periodId === 'this-month';
  if (!isThisMonth) {
    return null;
  }
  if (raisedLimit === null) {
    return null;
  }
  const limitText = USD_TEXT.format(raisedLimit);
  return `Limit raised to ${limitText} until the reset`;
}

/** The notice waits on a person: the demonstration raises the limit after this long. */
const RAISE_AFTER_MS = 2500;

type PressKey = 'raise';

export default function Run09() {
  const [periodId, setPeriodId] = useState<PeriodId>('this-month');
  const [groupBy, setGroupBy] = useState<GroupBy>('model');
  const [raisedLimit, setRaisedLimit] = useState<number | null>(null);
  const [raiseState, setRaiseState] = useState<MorphState>('idle');
  const [isMonthStarting, setIsMonthStarting] = useState(false);
  const [message, setMessage] = useState('');
  const { schedule, clearAll } = useTimeouts();
  const { pressed, press } = usePress<PressKey>();

  function changePeriod(next: PeriodId) {
    setPeriodId(next);
    const nextPeriod = periodOf(next, raisedLimit, false);
    const total = totalOf(nextPeriod.byModel);
    const totalText = USD_TEXT.format(total);
    setMessage(`${totalText} spent ${nextPeriod.label}`);
  }

  function changeGroupBy(next: GroupBy) {
    setGroupBy(next);
    setMessage(`Spend grouped by ${next}`);
  }

  function raiseLimit() {
    if (raiseState !== 'idle') {
      return;
    }
    setRaiseState('busy');
    schedule(() => setRaiseState('done'), RAISE_BUSY_MS);
    const settleDelay = RAISE_BUSY_MS + RAISE_DONE_MS;
    schedule(() => {
      setRaisedLimit(RAISED_LIMIT_USD);
      setRaiseState('idle');
      setMessage(`Limit raised to ${RAISED_LIMIT_TEXT}`);
    }, settleDelay);
  }

  function resetDemo() {
    clearAll();
    setPeriodId('this-month');
    setGroupBy('model');
    setRaisedLimit(null);
    setRaiseState('idle');
    setIsMonthStarting(false);
  }

  const raiseTime = RAISE_BUSY_MS + RAISE_DONE_MS;
  const regroupAfter = raiseTime + 1400;
  const steps: AutoplayStep[] = [
    { after: 1600, run: () => setIsMonthStarting(true) },
    { after: 1000, run: () => setIsMonthStarting(false) },
    { after: RAISE_AFTER_MS, run: () => press('raise') },
    { after: PRESS_LEAD_MS, run: raiseLimit },
    { after: regroupAfter, run: () => changeGroupBy('agent') },
    { after: 2200, run: () => changeGroupBy('model') },
    { after: 1200, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: resetDemo,
  });
  // A person who takes over while the month is being rewound gets the month as it stands today.
  const isStarting = isMonthStarting && isAutoplaying;
  const period = periodOf(periodId, raisedLimit, isStarting);
  const raisedLine = raisedLineOf(periodId, raisedLimit);

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[34rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <UsageByModel
          period={period}
          groupBy={groupBy}
          onGroupByChange={changeGroupBy}
          periodSwitch={
            <Segments
              value={periodId}
              segments={PERIODS}
              onValueChange={changePeriod}
              label='Period'
            />
          }
          raiseState={raiseState}
          onRaiseLimit={raiseLimit}
          raisedLine={raisedLine}
          isRaisePressed={pressed === 'raise'}
        />
      </ClockGate>
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
