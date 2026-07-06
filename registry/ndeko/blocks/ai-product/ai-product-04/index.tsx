'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import {
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { TicketPercentIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { Countdown } from './countdown';
import {
  CLAIMED_AT_LOAD,
  DEMO_CLAIM,
  JOINS,
  OFFER,
  PERKS,
  perkOf,
  type Claimed,
  type PerkId,
} from './data';
import { PerkCard } from './perk-card';

const JOIN_EVERY_MS = 1300;

const LOOP_AFTER_MS = 3600;

function withJoin(claimed: Claimed, id: PerkId, count: number): Claimed {
  const perk = perkOf(id);
  const next = Math.min(perk.cap, claimed[id] + count);
  return { ...claimed, [id]: next };
}

function withClaim(mine: PerkId[], id: PerkId) {
  if (mine.includes(id)) {
    return mine;
  }
  return [...mine, id];
}

export default function AiProduct04() {
  const [claimed, setClaimed] = useState<Claimed>(CLAIMED_AT_LOAD);
  const [mine, setMine] = useState<PerkId[]>([]);
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<string>();

  function join(id: PerkId, count: number) {
    setClaimed((current) => withJoin(current, id, count));
  }

  function claim(id: PerkId) {
    const isMine = mine.includes(id);
    const perk = perkOf(id);
    const isFull = claimed[id] >= perk.cap;
    if (isMine || isFull) {
      return;
    }
    setClaimed((current) => withJoin(current, id, 1));
    setMine((current) => withClaim(current, id));
    setMessage(`${perk.title} claimed`);
  }

  function resetDemonstration() {
    setClaimed(CLAIMED_AT_LOAD);
    setMine([]);
    setMessage('');
  }

  const joinSteps = JOINS.map((entry) => ({
    after: JOIN_EVERY_MS,
    run: () => join(entry.id, entry.count),
  }));
  const steps = [
    ...joinSteps,
    { after: 1500, run: () => press(`claim-${DEMO_CLAIM}`) },
    { after: PRESS_LEAD_MS, run: () => claim(DEMO_CLAIM) },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: resetDemonstration,
  });
  const spoken = spokenUnless(isAutoplaying, message);

  return (
    <ClockGate isActive={isInView}>
      <section ref={ref} className='@container'>
        <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
          <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
            <div className='flex max-w-2xl flex-col gap-3'>
              <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
                <TicketPercentIcon className='size-4' />
                {OFFER.product} {OFFER.label}
              </p>
              <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
                {OFFER.title}
              </h2>
              <p className='text-muted-foreground text-base text-pretty'>
                {OFFER.lead}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Countdown />
              <Badge variant='secondary'>Illustrative</Badge>
            </div>
          </header>
          <div className='grid gap-3 @3xl:grid-cols-3'>
            {PERKS.map((perk) => (
              <PerkCard
                key={perk.id}
                perk={perk}
                claimed={claimed[perk.id]}
                hasClaimed={mine.includes(perk.id)}
                pressed={pressed}
                onClaim={claim}
              />
            ))}
          </div>
        </div>
        <LiveRegion message={spoken} />
      </section>
    </ClockGate>
  );
}
