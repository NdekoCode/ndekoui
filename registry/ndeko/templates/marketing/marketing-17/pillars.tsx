'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { PILLARS, PILLARS_ANCHOR, PILLARS_SECTION } from './data';
import { Leaders } from './leaders';
import { Plate } from './plate';
import { turnedTo } from './plate-geometry';
import { Reveal } from './reveal';

const TOUR_INDEXES = [1, 2, 3, 4, 5, 0];

const TOUR_STEP_MS = 3400;

const KEY_STEPS: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function Pillars() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const pillar = PILLARS[activeIndex];

  function pick(index: number) {
    setActiveIndex(index);
    setTurn((current) => turnedTo(current, index));
  }

  const tourSteps = TOUR_INDEXES.map((index) => ({
    after: TOUR_STEP_MS,
    run: () => pick(index),
  }));
  const { ref, isAutoplaying } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
  });
  const announcement = `${pillar.name}: ${pillar.capabilities.join(', ')}`;
  const message = spokenUnless(isAutoplaying, announcement);

  function moveWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = KEY_STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const next = (activeIndex + step + PILLARS.length) % PILLARS.length;
    const group = event.currentTarget;
    pick(next);
    requestAnimationFrame(() => {
      const selector = `[data-pillar="${PILLARS[next].id}"]`;
      group.querySelector<HTMLElement>(selector)?.focus();
    });
  }

  return (
    <section
      id={PILLARS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='grid gap-12 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] @3xl:items-center @3xl:gap-12'
      >
        <SettleItem className='flex flex-col gap-8'>
          <div className='flex flex-col gap-3'>
            <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
              {PILLARS_SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {PILLARS_SECTION.description}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className='text-muted-foreground text-xs tabular-nums'>
              {pillar.number}
            </p>
            <p className='text-3xl font-semibold'>
              <Swap swapKey={pillar.id}>{pillar.name}</Swap>
            </p>
            <p className='text-muted-foreground text-[13px]'>{pillar.line}</p>
          </div>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] @3xl:items-center'
          >
            <div className='mx-auto w-full max-w-[19rem] @3xl:max-w-none'>
              <Plate
                activeIndex={activeIndex}
                turn={turn}
                onPick={pick}
                onKeyDown={moveWithKeys}
              />
            </div>
            <Leaders pillar={pillar} />
          </div>
          <LiveRegion message={message} />
        </SettleItem>
      </Reveal>
    </section>
  );
}
