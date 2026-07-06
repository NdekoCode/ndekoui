'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { Segments } from '@/registry/ndeko/ui/segments';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  BANKS,
  BANKS_ANCHOR,
  BANKS_SECTION,
  DEFAULT_REGION,
  REGION_SEGMENTS,
  type Bank,
  type Region,
} from './data';
import { Reveal } from './reveal';

const REGION_TOUR: Region[] = ['central', 'east', 'west', 'europe', 'all'];

const TOUR_STEP_MS = 2400;

function isInRegion(bank: Bank, region: Region) {
  if (region === 'all') {
    return true;
  }
  return bank.region === region;
}

function toneOf(isShown: boolean) {
  if (isShown) {
    return 'opacity-100';
  }
  return 'opacity-35';
}

export function Banks() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const tourSteps = REGION_TOUR.map((value) => ({
    after: TOUR_STEP_MS,
    run: () => setRegion(value),
  }));
  const { ref } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
    onReset: () => setRegion(DEFAULT_REGION),
  });
  const shownCount = BANKS.filter((bank) => isInRegion(bank, region)).length;

  return (
    <section
      id={BANKS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {BANKS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {BANKS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div ref={ref} className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <Segments
                value={region}
                segments={REGION_SEGMENTS}
                onValueChange={setRegion}
                label='Region of the banks'
              />
              <p className='text-muted-foreground text-xs tabular-nums'>
                <MotionNumber value={shownCount} /> of {BANKS.length} banks
              </p>
            </div>
            <ul className='grid grid-cols-2 gap-2 @3xl:grid-cols-3 @5xl:grid-cols-4'>
              {BANKS.map((bank) => (
                <li
                  key={bank.name}
                  className={cn(
                    'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex min-h-28 flex-col justify-between gap-4 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 ease-(--ease-out-strong)',
                    toneOf(isInRegion(bank, region))
                  )}
                >
                  <CompanyMark seed={bank.name} size='lg' />
                  <div className='flex min-w-0 flex-col gap-0.5'>
                    <p className='text-[13px] leading-snug font-medium text-balance'>
                      {bank.name}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {bank.place}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </SettleItem>
        <SettleItem>
          <p className='text-muted-foreground text-xs'>
            {BANKS_SECTION.footnote}
          </p>
        </SettleItem>
      </Reveal>
    </section>
  );
}
