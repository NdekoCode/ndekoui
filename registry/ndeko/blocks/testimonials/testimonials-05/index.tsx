'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { CUSTOMERS, SECTION } from './data';
import { FeaturedResult } from './featured-result';
import { WallCard } from './wall-card';

/** Long enough to read a featured quote once it has written itself in. */
const FEATURE_MS = 6200;

function indexAfter(index: number) {
  const next = index + 1;
  return next % CUSTOMERS.length;
}

/** The next customer after each one, so a round ends on the first customer and the loop shows no seam. */
const ROTATION = CUSTOMERS.map((_, index) => indexAfter(index));

function spokenFeatureOf(index: number) {
  const { company, result } = CUSTOMERS[index];
  return `Featured: ${company}, ${result.percent}% ${result.label}`;
}

export default function Testimonials05() {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<string>();
  const featured = CUSTOMERS[featuredIndex];

  function feature(index: number) {
    setFeaturedIndex(index);
    setHasChanged(true);
  }

  const steps = ROTATION.flatMap((index) => [
    { after: FEATURE_MS, run: () => press(CUSTOMERS[index].id) },
    { after: PRESS_LEAD_MS, run: () => feature(index) },
  ]);
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: 0,
    isEnabled: !isReading,
  });

  function featureByPerson(customerId: string) {
    const index = CUSTOMERS.findIndex((customer) => customer.id === customerId);
    feature(index);
    setMessage(spokenFeatureOf(index));
  }

  /** The featured quote does not change under the pointer of someone reading it. */
  function holdWhileReading(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') {
      setIsReading(true);
    }
  }

  function stopReading() {
    setIsReading(false);
  }

  return (
    <section ref={ref} className='@container'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
          <div className='flex max-w-2xl flex-col gap-3'>
            <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
              <TrendingUpIcon className='size-4' />
              {SECTION.label}
            </p>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.lead}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>Sample quotes</Badge>
            <Badge variant='secondary'>Illustrative figures</Badge>
          </div>
        </header>
        <div className='flex flex-col gap-4'>
          <div onPointerEnter={holdWhileReading} onPointerLeave={stopReading}>
            <FeaturedResult
              customer={featured}
              position={featuredIndex}
              isStreamed={hasChanged}
            />
          </div>
          <ul className='grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3'>
            {CUSTOMERS.map((customer, index) => (
              <li key={customer.id}>
                <WallCard
                  customer={customer}
                  isFeatured={index === featuredIndex}
                  isPressed={pressed === customer.id}
                  onFeature={featureByPerson}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
