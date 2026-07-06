'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  keyDelayOf,
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { countOf } from '@/registry/ndeko/lib/words';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { type Segment, Segments } from '@/registry/ndeko/ui/segments';

import {
  type BillingPeriod,
  HOUR_RANGE,
  type Plan,
  SEAT_RANGE,
  SECTION,
  START,
} from './data';
import { EstimateCard } from './estimate-card';
import { MeterSlider } from './meter-slider';
import { PlanColumns } from './plan-columns';
import {
  type CapNotice,
  capNoticeOf,
  estimateOf,
  fittingPlanOf,
  formatMoney,
  hourTicksOf,
  MONEY_FORMAT,
  PERIOD_ORDER,
  seatTicksOf,
  type Usage,
  yearlySavingOf,
} from './pricing-model';

const PERIODS: Segment<BillingPeriod>[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/** Where the demonstration takes the two numbers: past the cap of Starter, then past the hours it includes. */
const DEMO = {
  seats: 14,
  hoursPerPerson: 30,
};

/** The pause between two notches of a slider the demonstration drags. */
const DRAG_STEP_MS = 110;

const LOOP_AFTER_MS = 3200;

/** A drag of the demonstration, one notch after the other, through the same handler a hand uses. */
function dragSteps(
  from: number,
  to: number,
  write: (value: number) => void,
  startAfter: number
): AutoplayStep[] {
  const distance = to - from;
  const direction = Math.sign(distance);
  const count = Math.abs(distance);
  const indexes = Array.from({ length: count }, (_, index) => index);
  return indexes.map((index) => {
    const walked = index + 1;
    const offset = walked * direction;
    const value = from + offset;
    const after = keyDelayOf(index, startAfter, DRAG_STEP_MS);
    return { after, run: () => write(value) };
  });
}

/** The amount keeps its place while its digits roll; only a change of period rolls the words around it. */
function savingWordsOf(period: BillingPeriod, saving: number): WordRollWord[] {
  const amount: WordRollWord = {
    key: 'saving',
    text: formatMoney(saving),
    node: (
      <MotionNumber
        value={saving}
        format={MONEY_FORMAT}
        className='text-foreground font-medium'
      />
    ),
  };
  if (period === 'yearly') {
    return ['Saving', amount, 'a', 'year'];
  }
  return ['Yearly', 'billing', 'saves', amount];
}

function announcementOf(fit: Plan, notice: CapNotice | null) {
  if (notice) {
    return `${fit.name} fits. ${notice.plan.name} holds up to ${notice.seats} seats.`;
  }
  return `${fit.name} fits your numbers.`;
}

export default function Pricing03() {
  const [seats, setSeats] = useState(START.seats);
  const [hoursPerPerson, setHoursPerPerson] = useState(START.hoursPerPerson);
  const [period, setPeriod] = useState<BillingPeriod>(START.period);
  const { pressed, press } = usePress<'fix'>();
  const markerId = useId();
  const seatsId = useId();
  const hoursId = useId();
  const usage: Usage = { seats, hoursPerPerson, period };
  const fit = fittingPlanOf(usage);
  const estimate = estimateOf(fit, usage);
  const notice = capNoticeOf(usage, fit);
  const seatTicks = seatTicksOf(usage);
  const hourTicks = hourTicksOf(usage);
  const saving = yearlySavingOf(fit, seats);
  const savingWords = savingWordsOf(period, saving);
  const periodOrder = PERIOD_ORDER[period];

  function fixSeats() {
    if (!notice) {
      return;
    }
    setSeats(notice.seats);
  }

  function startOver() {
    setSeats(START.seats);
    setHoursPerPerson(START.hoursPerPerson);
    setPeriod(START.period);
  }

  function seatsTextOf(value: number) {
    const valueUsage: Usage = { ...usage, seats: value };
    const plan = fittingPlanOf(valueUsage);
    const label = countOf(value, 'seat');
    return `${label}, ${plan.name} fits`;
  }

  function hoursTextOf(value: number) {
    const valueUsage: Usage = { ...usage, hoursPerPerson: value };
    const plan = fittingPlanOf(valueUsage);
    const label = countOf(value, 'hour');
    return `${label} each, ${plan.name} fits`;
  }

  const steps: AutoplayStep[] = [
    ...dragSteps(START.seats, DEMO.seats, setSeats, 1400),
    { after: 1700, run: () => press('fix') },
    { after: PRESS_LEAD_MS, run: fixSeats },
    ...dragSteps(
      START.hoursPerPerson,
      DEMO.hoursPerPerson,
      setHoursPerPerson,
      1500
    ),
    { after: 1600, run: () => setPeriod('yearly') },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: startOver,
  });
  const announcement = announcementOf(fit, notice);
  const message = spokenUnless(isAutoplaying, announcement);

  useKeptHeight(ref);

  return (
    <section className='@container'>
      <div
        ref={ref}
        className='mx-auto flex min-h-[55rem] max-w-6xl flex-col gap-8 px-4 py-16 @2xl:gap-10 @2xl:px-6 @2xl:py-24'
      >
        <div className='flex flex-col gap-6 @4xl:flex-row @4xl:items-end @4xl:justify-between'>
          <div className='flex max-w-2xl flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.description}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <Segments
              value={period}
              segments={PERIODS}
              onValueChange={setPeriod}
              label='Billing period'
            />
            <p className='text-muted-foreground text-xs tabular-nums'>
              <WordRoll words={savingWords} value={periodOrder} />
            </p>
          </div>
        </div>
        <div className='grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_20rem]'>
          <div className='flex min-w-0 flex-col gap-4'>
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] grid gap-x-8 gap-y-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @md:p-5 @2xl:grid-cols-2'>
              <MeterSlider
                id={seatsId}
                label='People who record'
                unit='seats'
                range={SEAT_RANGE}
                value={seats}
                ticks={seatTicks}
                valueTextOf={seatsTextOf}
                onValueChange={setSeats}
              />
              <MeterSlider
                id={hoursId}
                label='Hours each one records a month'
                unit='hours'
                range={HOUR_RANGE}
                value={hoursPerPerson}
                ticks={hourTicks}
                valueTextOf={hoursTextOf}
                onValueChange={setHoursPerPerson}
              />
            </div>
            <PlanColumns period={period} fit={fit} markerId={markerId} />
          </div>
          <EstimateCard
            estimate={estimate}
            period={period}
            notice={notice}
            isFixPressed={pressed === 'fix'}
            onFix={fixSeats}
          />
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
