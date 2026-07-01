'use client';
import { useRef } from 'react';
import {
  StickyScroll,
  type StickyScrollStep,
} from '@/components/core/sticky-scroll';

function SceneFrame({ image }: { image: string }) {
  return (
    <div className='bg-foreground/[0.04] rounded-2xl p-1.5'>
      {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
      <img
        src={image}
        alt=''
        width={1200}
        height={800}
        loading='lazy'
        decoding='async'
        className='aspect-[3/2] w-full rounded-[calc(var(--radius-2xl)-0.375rem)] object-cover'
      />
    </div>
  );
}

const STEPS: StickyScrollStep[] = [
  {
    id: 'plan',
    title: 'Plan the route at home',
    description:
      'Draw the walk on the map, see the climbs ahead of time and the places to refill water on the way.',
    media: <SceneFrame image='/images/scenes/scene-01.svg' />,
  },
  {
    id: 'download',
    title: 'Keep the map offline',
    description:
      'The route and twenty kilometres around it stay on the phone, for the valleys where the signal drops.',
    media: <SceneFrame image='/images/scenes/scene-03.svg' />,
  },
  {
    id: 'walk',
    title: 'Walk without looking down',
    description:
      'A short vibration before every turn, so the phone can stay in a pocket for most of the day.',
    media: <SceneFrame image='/images/scenes/scene-06.svg' />,
  },
  {
    id: 'share',
    title: 'Share the day',
    description:
      'Distance, time and the three photos you starred, in one card your friends can open without an account.',
    media: <SceneFrame image='/images/scenes/scene-07.svg' />,
  },
];

export function StickyScrollTour() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[480px] w-full overflow-y-auto rounded-xl px-6 sm:px-10'
    >
      <div className='flex h-[160px] flex-col justify-end gap-1 pb-4'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          A day out with Fernpath
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Four steps, one picture each
        </p>
      </div>
      <StickyScroll
        steps={STEPS}
        containerRef={containerRef}
        frameClassName='h-[480px]'
        stepClassName='min-h-[320px]'
      />
      <div className='h-[200px]' />
    </div>
  );
}
