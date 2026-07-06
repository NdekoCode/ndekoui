'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { InfoIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { type BillingPeriod, SECTION } from './data';
import {
  type CapNotice,
  type Estimate,
  formatMoney,
  formatRate,
  MONEY_FORMAT,
  PERIOD_ORDER,
  yearlySeatBillOf,
} from './pricing-model';

/** The amount keeps its place while its digits roll; only a change of period rolls the words around it. */
function billingWordsOf(
  period: BillingPeriod,
  estimate: Estimate
): WordRollWord[] {
  if (period === 'monthly') {
    return ['Billed', 'every', 'month'];
  }
  const yearlyBill = yearlySeatBillOf(estimate);
  const amount: WordRollWord = {
    key: 'yearly-bill',
    text: formatMoney(yearlyBill),
    node: <MotionNumber value={yearlyBill} format={MONEY_FORMAT} />,
  };
  return ['Seats', 'billed', amount, 'once', 'a', 'year'];
}

type LineProps = {
  term: string;
  detail: ReactNode;
  children: ReactNode;
};

function Line({ term, detail, children }: LineProps) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <dt className='flex min-w-0 flex-col gap-0.5'>
        <span>{term}</span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {detail}
        </span>
      </dt>
      <dd className='font-medium tabular-nums'>{children}</dd>
    </div>
  );
}

type NoticeProps = {
  notice: CapNotice;
  isFixPressed: boolean;
  onFix: () => void;
};

function Notice({ notice, isFixPressed, onFix }: NoticeProps) {
  const total = formatMoney(notice.total);

  return (
    <div className='pt-4'>
      <div className='bg-info/10 flex flex-col gap-2.5 rounded-lg p-3'>
        <p className='flex gap-2 text-[13px] text-pretty'>
          <InfoIcon className='text-info-foreground mt-0.5 size-4 shrink-0' />
          <span>
            {notice.plan.name} holds up to {notice.seats} seats. With{' '}
            {notice.seats} seats there, your month comes to {total}.
          </span>
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onFix}
          className={cn('ms-6 self-start', pressedQuietOf(isFixPressed))}
        >
          Use {notice.seats} seats on {notice.plan.name}
        </Button>
      </div>
    </div>
  );
}

type EstimateCardProps = {
  estimate: Estimate;
  period: BillingPeriod;
  notice: CapNotice | null;
  isFixPressed: boolean;
  onFix: () => void;
};

/** The month on the plan that fits, line by line, with the seat-cap notice and its fix. */
export function EstimateCard({
  estimate,
  period,
  notice,
  isFixPressed,
  onFix,
}: EstimateCardProps) {
  const startRef = useRef<HTMLAnchorElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const planName = estimate.plan.name;
  const extraHourPrice = formatRate(estimate.plan.pricePerExtraHour);
  const billingWords = billingWordsOf(period, estimate);
  const periodOrder = PERIOD_ORDER[period];

  /** The fix folds the notice away with the button that was pressed: the focus goes on to the next action. */
  function fixByHand() {
    onFix();
    startRef.current?.focus();
  }

  return (
    <section
      aria-label='Your estimate'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center justify-between gap-3'>
        <h3 className='min-w-0 text-sm font-medium'>
          <WordRoll text={`Your month on ${planName}`} />
        </h3>
        <Badge variant='secondary'>Illustrative</Badge>
      </div>
      <dl className='mt-4 flex flex-col gap-3 text-[13px]'>
        <Line
          term='Seats'
          detail={
            <>
              <MotionNumber value={estimate.seats} /> ×{' '}
              <MotionNumber value={estimate.seatPrice} format={MONEY_FORMAT} />
            </>
          }
        >
          <MotionNumber value={estimate.seatCost} format={MONEY_FORMAT} />
        </Line>
        <Line
          term='Hours recorded'
          detail={
            <>
              <MotionNumber value={estimate.includedHours} /> included with the
              seats
            </>
          }
        >
          <MotionNumber value={estimate.recordedHours} suffix=' h' />
        </Line>
        <Line
          term='Extra hours'
          detail={
            <>
              <MotionNumber value={estimate.extraHours} /> × {extraHourPrice}
            </>
          }
        >
          <MotionNumber value={estimate.extraCost} format={MONEY_FORMAT} />
        </Line>
      </dl>
      <div className='bg-foreground/[0.04] mt-4 flex flex-col gap-1 rounded-lg p-3'>
        <div className='flex items-baseline justify-between gap-3'>
          <span className='text-[13px]'>Total per month</span>
          <MotionNumber
            value={estimate.total}
            format={MONEY_FORMAT}
            className='text-[1.75rem] leading-none font-semibold'
          />
        </div>
        <p className='text-muted-foreground text-xs tabular-nums'>
          <WordRoll words={billingWords} value={periodOrder} />
        </p>
      </div>
      <AnimatePresence initial={false}>
        {notice && (
          <motion.div key='notice' {...presence} className='overflow-hidden'>
            <Notice
              notice={notice}
              isFixPressed={isFixPressed}
              onFix={fixByHand}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size='lg'
        nativeButton={false}
        render={<a href='#' ref={startRef} />}
        className='mt-5 w-full'
      >
        <WordRoll text={`Start with ${planName}`} />
      </Button>
      <p className='text-muted-foreground mt-3 text-xs text-pretty'>
        {SECTION.footnote}
      </p>
    </section>
  );
}
