'use client';

import { Fragment, useState } from 'react';

import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { type FactId, FIRST_FACT, HERO, PHRASES } from './data';
import { FactPicker } from './fact-picker';

/** The display rule of the home page: tight tracking on the display title and on nothing else. */
const STATEMENT =
  'text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance @2xl:text-6xl @5xl:text-7xl @5xl:leading-[1.02]';

/** The demonstration walks the facts in this order and ends where the hero began. */
const DEMO_ORDER: FactId[] = ['hourly', 'restore', 'laptops'];

const PICK_EVERY_MS = 2600;

function litOf(isLit: boolean) {
  if (isLit) {
    return '';
  }
  return undefined;
}

export default function Heroes04() {
  const [picked, setPicked] = useState<FactId>(FIRST_FACT);
  const { pressed, press } = usePress<FactId>();

  function startOver() {
    setPicked(FIRST_FACT);
  }

  const steps: AutoplayStep[] = DEMO_ORDER.flatMap((fact) => [
    { after: PICK_EVERY_MS, run: () => press(fact) },
    { after: PRESS_LEAD_MS, run: () => setPicked(fact) },
  ]);
  const { ref } = useAutoplay(steps, { loopAfter: 0, onReset: startOver });

  return (
    <section className='@container'>
      <div ref={ref} className='relative isolate'>
        <Wash className='h-[30rem]' />
        <div className='mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 @2xl:gap-14 @2xl:px-6 @2xl:py-24'>
          <div className='flex flex-col items-start gap-6'>
            <p className='text-primary-ink text-sm font-medium'>
              {HERO.eyebrow}
            </p>
            <h1 className={cn(STATEMENT, 'max-w-5xl')}>
              {PHRASES.map((phrase, index) => (
                <Fragment key={phrase.fact}>
                  {index > 0 && ' '}
                  <span
                    data-lit={litOf(phrase.fact === picked)}
                    className='data-lit:text-primary-ink transition-colors duration-300'
                  >
                    {phrase.text}
                  </span>
                </Fragment>
              ))}
            </h1>
            <p className='text-muted-foreground max-w-2xl text-base text-pretty @2xl:text-lg'>
              {HERO.lead}
            </p>
            <div className='flex flex-wrap gap-2 pt-1'>
              <Button size='lg' nativeButton={false} render={<a href='#' />}>
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href='#' />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </div>
          <FactPicker picked={picked} pressed={pressed} onPick={setPicked} />
        </div>
      </div>
    </section>
  );
}
