'use client';

import { useState } from 'react';

import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { HERO, ORDER } from './data';
import { GridLayer } from './grid-layer';

const SWAP_EVERY_MS = 1400;

export default function Heroes08() {
  const [step, setStep] = useState(0);

  function advance() {
    setStep((current) => (current + 1) % ORDER.length);
  }

  function startOver() {
    setStep(0);
  }

  const steps: AutoplayStep[] = ORDER.map(() => ({
    after: SWAP_EVERY_MS,
    run: advance,
  }));
  const { ref } = useAutoplay(steps, { loopAfter: 0, onReset: startOver });

  return (
    <section className='@container'>
      <div ref={ref} className='relative isolate min-h-[36rem] overflow-hidden'>
        <GridLayer step={step} />
        <div className='relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 @2xl:py-32'>
          <div className='bg-background flex flex-col items-center gap-6 rounded-2xl text-center shadow-[0_0_2.5rem_2rem_var(--background)]'>
            <p className='text-primary-ink text-sm font-medium'>
              {HERO.eyebrow}
            </p>
            <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
              {HERO.title}
            </h1>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
            <div className='flex flex-wrap justify-center gap-2 pt-1'>
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
        </div>
      </div>
    </section>
  );
}
