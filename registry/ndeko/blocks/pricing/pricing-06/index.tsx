'use client';

import { useState } from 'react';

import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { filterSummaryOf } from './comparison';
import { ComparisonTable } from './comparison-table';
import { type PlanId, SECTION } from './data';
import { DifferencesSwitch } from './differences-switch';
import { PlanAccordions } from './plan-accordions';

/** On a narrow page the featured plan starts open, so its rows are there when the page is reached. */
const OPEN_AT_START: PlanId[] = ['studio'];

const LOOP_AFTER_MS = 2600;

export default function Pricing06() {
  const [isOnlyDifferences, setIsOnlyDifferences] = useState(false);
  const [openPlans, setOpenPlans] = useState<PlanId[]>(OPEN_AT_START);
  const [announcement, setAnnouncement] = useState('');

  /** Only a person's flip is said: the demonstration flips the same state in silence. */
  function changeOnlyDifferences(isOn: boolean) {
    setIsOnlyDifferences(isOn);
    setAnnouncement(filterSummaryOf(isOn));
  }

  function startOver() {
    setIsOnlyDifferences(false);
    setOpenPlans(OPEN_AT_START);
  }

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => setIsOnlyDifferences(true) },
    { after: 1700, run: () => setOpenPlans(['agency']) },
    { after: 2600, run: () => setIsOnlyDifferences(false) },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <section className='@container'>
      <div
        ref={ref}
        className='mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24'
      >
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
        </div>
        <div className='hidden @3xl:block'>
          <ComparisonTable
            isOnlyDifferences={isOnlyDifferences}
            onOnlyDifferencesChange={changeOnlyDifferences}
          />
        </div>
        <div className='flex flex-col gap-4 @3xl:hidden'>
          <DifferencesSwitch
            isOn={isOnlyDifferences}
            onChange={changeOnlyDifferences}
            className='bg-foreground/[0.04] rounded-xl px-4 py-3'
          />
          <PlanAccordions
            isOnlyDifferences={isOnlyDifferences}
            openPlans={openPlans}
            onOpenPlansChange={setOpenPlans}
          />
        </div>
        <p className='text-muted-foreground text-xs'>{SECTION.footnote}</p>
      </div>
      <LiveRegion message={announcement} />
    </section>
  );
}
