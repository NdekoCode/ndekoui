'use client';
import { useRef } from 'react';
import { ScrollAnimation } from '@/components/core/scroll-animation';
import { Chip } from '@/registry/ndeko/ui/chip';

function PresetName({ name }: { name: string }) {
  return (
    <span className='text-muted-foreground mb-3 block font-mono text-xs'>
      {name}
    </span>
  );
}

export function ScrollAnimationPresets() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[440px] w-full overflow-y-auto rounded-xl px-6 sm:px-10'
    >
      <div className='text-muted-foreground flex h-[440px] items-center justify-center text-[13px]'>
        Scroll down, one element arrives at a time
      </div>

      <div className='mx-auto max-w-md'>
        <PresetName name='fade-up' />
        <ScrollAnimation containerRef={containerRef} preset='fade-up'>
          <h3 className='text-foreground text-xl font-semibold text-balance'>
            Every pitch on one map
          </h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            Traders see where they stand on Saturday, who their neighbours are
            and whether the pitch is covered.
          </p>
        </ScrollAnimation>
      </div>

      <div className='h-[320px]' />

      <div className='mx-auto max-w-md'>
        <PresetName name='scale-in' />
        <ScrollAnimation containerRef={containerRef} preset='scale-in'>
          <div className='bg-card hairline-ring ring-border flex items-center justify-between gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <div className='flex flex-col gap-0.5'>
              <span className='text-foreground text-sm font-medium'>
                Pitch 14
              </span>
              <span className='text-muted-foreground text-xs'>
                Covered, next to the bakery
              </span>
            </div>
            <Chip color='var(--success)'>Confirmed</Chip>
          </div>
        </ScrollAnimation>
      </div>

      <div className='h-[320px]' />

      <div className='mx-auto max-w-md'>
        <PresetName name='clip-reveal' />
        <ScrollAnimation containerRef={containerRef} preset='clip-reveal'>
          {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
          <img
            src='/images/scenes/scene-05.svg'
            alt=''
            width={1200}
            height={800}
            loading='lazy'
            decoding='async'
            className='aspect-[3/2] w-full rounded-xl object-cover'
          />
        </ScrollAnimation>
      </div>

      <div className='h-[200px]' />
    </div>
  );
}
