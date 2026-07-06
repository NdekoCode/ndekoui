'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { DottedMap, type DottedMapMarker } from '@/components/core/dotted-map';
import { cn } from '@/registry/ndeko/lib/utils';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { MAP_SECTION, OFFICES } from './data';
import { isOpenAt, localTimeOf, statusOf } from './office-time';
import { Reveal } from './reveal';
import { useMinuteNow } from './use-minute-now';

const MAP_MARKERS: DottedMapMarker[] = OFFICES.map((office) => ({
  lat: office.location[0],
  lng: office.location[1],
  label: office.city,
}));

function dotToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-success';
  }
  return 'bg-muted-foreground/40';
}

export function OfficeMap() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const now = useMinuteNow(isInView);

  return (
    <section className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'>
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-10'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
            {MAP_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {MAP_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div ref={ref} className='flex flex-col gap-8'>
            <DottedMap
              markers={MAP_MARKERS}
              label='Map of the six Quillfield offices'
              dotClassName='text-foreground/25'
              markerSize={1.6}
            />
            <ul className='grid grid-cols-2 gap-3 @3xl:grid-cols-3 @5xl:grid-cols-6'>
              {OFFICES.map((office) => (
                <li
                  key={office.id}
                  className='bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-4'
                >
                  <p className='text-[13px] font-medium'>{office.city}</p>
                  <p className='text-2xl font-semibold tabular-nums'>
                    {localTimeOf(now, office)}
                  </p>
                  <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <span
                      aria-hidden='true'
                      className={cn(
                        'size-1.5 rounded-full',
                        dotToneOf(isOpenAt(now, office))
                      )}
                    />
                    {statusOf(now, office)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
