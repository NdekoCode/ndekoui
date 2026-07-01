'use client';
import { useRef } from 'react';
import { HorizontalScroll } from '@/components/core/horizontal-scroll';

type Stop = {
  name: string;
  distance: string;
  note: string;
  image: string;
};

const STOPS: Stop[] = [
  {
    name: 'Gull Point',
    distance: '0 km',
    note: 'Start at the car park above the dunes',
    image: '/images/scenes/scene-01.svg',
  },
  {
    name: 'Saltmarsh Inlet',
    distance: '3.4 km',
    note: 'A boardwalk over the reed beds',
    image: '/images/scenes/scene-02.svg',
  },
  {
    name: 'Heron Cliffs',
    distance: '6.1 km',
    note: 'The steepest climb of the day',
    image: '/images/scenes/scene-03.svg',
  },
  {
    name: 'Old Signal House',
    distance: '8.8 km',
    note: 'Water tap and a bench facing west',
    image: '/images/scenes/scene-04.svg',
  },
  {
    name: 'Fernbay',
    distance: '11.2 km',
    note: 'Harbour café, open until four',
    image: '/images/scenes/scene-05.svg',
  },
  {
    name: 'Pine Ridge',
    distance: '14.0 km',
    note: 'A shaded path through the pines',
    image: '/images/scenes/scene-06.svg',
  },
  {
    name: 'Night ferry',
    distance: '16.5 km',
    note: 'The last crossing leaves at nine',
    image: '/images/scenes/scene-07.svg',
  },
  {
    name: 'Larkspur Sound',
    distance: '18.3 km',
    note: 'End of the path, bus back to town',
    image: '/images/scenes/scene-08.svg',
  },
];

function StopCard({ stop }: { stop: Stop }) {
  return (
    <article className='bg-foreground/[0.04] w-[248px] shrink-0 rounded-xl p-1.5 sm:w-[288px]'>
      {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
      <img
        src={stop.image}
        alt=''
        width={1200}
        height={800}
        loading='lazy'
        decoding='async'
        className='aspect-[3/2] w-full rounded-lg object-cover'
      />
      <div className='flex items-baseline justify-between gap-3 px-1.5 pt-2.5'>
        <h3 className='text-foreground text-sm font-medium'>{stop.name}</h3>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {stop.distance}
        </span>
      </div>
      <p className='text-muted-foreground px-1.5 pt-0.5 pb-1.5 text-xs'>
        {stop.note}
      </p>
    </article>
  );
}

export function HorizontalScrollScenes() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[480px] w-full overflow-y-auto rounded-xl'
    >
      <div className='flex h-[240px] flex-col items-center justify-center gap-1 px-6 text-center'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          Larkspur coast path
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Eight stops over 18 km, scroll down to walk the route
        </p>
      </div>
      <HorizontalScroll
        containerRef={containerRef}
        frameClassName='h-[480px]'
        aria-label='Stops on the Larkspur coast path'
      >
        {STOPS.map((stop) => (
          <StopCard key={stop.name} stop={stop} />
        ))}
      </HorizontalScroll>
      <div className='text-muted-foreground flex h-[240px] items-center justify-center text-[13px]'>
        End of the route
      </div>
    </div>
  );
}
