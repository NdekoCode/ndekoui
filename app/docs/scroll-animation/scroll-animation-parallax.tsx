'use client';
import { useRef } from 'react';
import { ScrollParallax } from '@/components/core/scroll-animation';

const BEFORE = [
  'The ferry to Larkspur Sound leaves the harbour at nine. In summer the deck is full of walkers who finished the coast path that afternoon and want to see it again from the water.',
  'The crossing takes forty minutes. The cliffs pass on the left, then the old signal house, then the long beach where the path began in the morning.',
];

const AFTER = [
  'By the time the boat reaches the sound, the light is almost gone. The lamps of the village come on one by one along the quay.',
  'The last bus back to town waits for the ferry. Nobody has ever seen it leave without the walkers on board.',
];

export function ScrollAnimationParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[440px] w-full overflow-y-auto rounded-xl px-6 py-16 sm:px-10'
    >
      <article className='mx-auto flex max-w-md flex-col gap-4'>
        <h3 className='text-foreground text-xl font-semibold text-balance'>
          The night ferry
        </h3>
        {BEFORE.map((paragraph) => (
          <p key={paragraph} className='text-muted-foreground text-sm'>
            {paragraph}
          </p>
        ))}
        <ScrollParallax
          containerRef={containerRef}
          strength={32}
          className='my-4 aspect-[16/10] rounded-xl'
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
          <img
            src='/images/scenes/scene-07.svg'
            alt=''
            width={1200}
            height={800}
            loading='lazy'
            decoding='async'
            className='size-full object-cover'
          />
        </ScrollParallax>
        {AFTER.map((paragraph) => (
          <p key={paragraph} className='text-muted-foreground text-sm'>
            {paragraph}
          </p>
        ))}
      </article>
    </div>
  );
}
