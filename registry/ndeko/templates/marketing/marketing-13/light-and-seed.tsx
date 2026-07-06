'use client';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { SEED_ANCHOR, SEED_SECTION, type LightId } from './data';
import { LightChips } from './light-chips';
import {
  LOCK_PRESS_KEY,
  REPRODUCE_PRESS_KEY,
  SESSION,
  lightOf,
  lookOf,
  seedOf,
} from './light-session';
import { Reveal } from './reveal';
import { MugScene, TakeFrame } from './scenes';
import { SeedCard } from './seed-card';

export function LightAndSeed() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const seed = seedOf(state);
  const light = lightOf(state.light);
  const announcement = `${light.label} light, seed ${seed}`;
  const message = spokenUnless(isAutoplaying, announcement);
  useKeptHeight(ref);

  function pickLight(next: LightId) {
    act({ type: 'lightPicked', light: next });
  }

  function toggleLock() {
    act({ type: 'lockToggled' });
  }

  function shuffle() {
    act({ type: 'shuffled' });
  }

  function reproduce() {
    act({ type: 'reproduced' });
  }

  return (
    <section
      id={SEED_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SEED_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SEED_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] grid min-h-[44rem] grid-cols-1 gap-2 rounded-2xl p-2 @3xl:min-h-[26rem] @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:gap-3 @3xl:p-3'
          >
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-4 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <TakeFrame key={state.replay} state='ready' develops>
                <MugScene look={lookOf(state)} />
              </TakeFrame>
              <LightChips value={state.light} onValueChange={pickLight} />
            </div>
            <SeedCard
              light={state.light}
              seed={seed}
              isLocked={state.isLocked}
              isLockPressed={pressed === LOCK_PRESS_KEY}
              isReproducePressed={pressed === REPRODUCE_PRESS_KEY}
              onLockChange={toggleLock}
              onShuffle={shuffle}
              onReproduce={reproduce}
            />
            <LiveRegion message={message} />
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
