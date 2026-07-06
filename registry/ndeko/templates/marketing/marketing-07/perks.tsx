'use client';

import { AnimatePresence } from 'motion/react';
import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Progress } from '@/registry/ndeko/ui/progress';
import { SettleItem } from '@/registry/ndeko/ui/settle';
import { Slider } from '@/registry/ndeko/ui/slider';

import {
  DEFAULT_SPEND,
  PERKS,
  PERKS_ANCHOR,
  PERKS_SECTION,
  SPEND_RANGE,
  type Perk,
} from './data';
import { moneyOf } from './money';
import { SPEND_PATH } from './perks-path';
import { PopShape } from './pop-shape';
import { Reveal } from './reveal';

function firstOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function shareOf(spend: number, perk: Perk) {
  return Math.min(spend / perk.threshold, 1);
}

function toneOf(isUnlocked: boolean) {
  if (isUnlocked) {
    return 'bg-card';
  }
  return 'bg-transparent';
}

function PerkStatus({ perk, spend }: { perk: Perk; spend: number }) {
  const isUnlocked = spend >= perk.threshold;
  const remaining = perk.threshold - spend;

  return (
    <div className='flex h-5 w-24 shrink-0 items-center justify-end gap-1.5 text-xs tabular-nums'>
      <AnimatePresence initial={false} mode='popLayout'>
        {isUnlocked && (
          <DrawnCheck key='check' tone='success' label='Reached' />
        )}
      </AnimatePresence>
      {isUnlocked && <span className='text-success-foreground'>Reached</span>}
      {!isUnlocked && (
        <span className='text-muted-foreground'>
          {moneyOf(remaining * 100)} to go
        </span>
      )}
    </div>
  );
}

function PerkRow({ perk, spend }: { perk: Perk; spend: number }) {
  const PerkIcon = perk.icon;
  const share = shareOf(spend, perk);
  const isUnlocked = spend >= perk.threshold;

  return (
    <li
      className={cn(
        'hairline-ring ring-border flex items-center gap-3 rounded-xl p-3 transition-colors duration-300',
        toneOf(isUnlocked)
      )}
    >
      <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <PerkIcon className='size-4' />
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-[13px] font-medium'>{perk.title}</p>
          <p className='text-muted-foreground text-xs text-pretty'>
            {perk.description}
          </p>
        </div>
        <Progress
          value={share * 100}
          aria-label={`Progress to ${perk.title}`}
          className='gap-0'
        />
      </div>
      <PerkStatus perk={perk} spend={spend} />
    </li>
  );
}

export function Perks() {
  const [spend, setSpend] = useState(DEFAULT_SPEND);
  const tourSteps = SPEND_PATH.map((step) => ({
    after: step.after,
    run: () => setSpend(step.value),
  }));
  const { ref } = useAutoplay(tourSteps, {
    loopAfter: 1800,
    onReset: () => setSpend(DEFAULT_SPEND),
  });

  function changeSpend(value: number | readonly number[]) {
    setSpend(firstOf(value));
  }

  return (
    <section
      id={PERKS_ANCHOR}
      className='relative overflow-x-clip px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <PopShape
        kind='ring'
        series={4}
        className='top-10 left-6 size-10 @3xl:top-16 @3xl:left-24 @3xl:size-16'
      />
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {PERKS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {PERKS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] grid gap-2 rounded-2xl p-2 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-3 @3xl:p-3'
          >
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col justify-between gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-xs'>
                  {PERKS_SECTION.spendLabel}
                </p>
                <p className='text-4xl font-semibold tabular-nums'>
                  {moneyOf(spend * 100)}
                </p>
              </div>
              <Slider
                value={[spend]}
                onValueChange={changeSpend}
                min={SPEND_RANGE.min}
                max={SPEND_RANGE.max}
                step={SPEND_RANGE.step}
                thumbLabels={[PERKS_SECTION.spendLabel]}
              />
              <p className='text-muted-foreground text-xs'>
                {PERKS_SECTION.note}
              </p>
            </div>
            <ul className='flex flex-col gap-2'>
              {PERKS.map((perk) => (
                <PerkRow key={perk.id} perk={perk} spend={spend} />
              ))}
            </ul>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
