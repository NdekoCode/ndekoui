'use client';
import { useRef } from 'react';
import { StickySection, StickySections } from '@/components/core/sticky-scroll';
import { cn } from '@/registry/ndeko/lib/utils';

const MOMENTS = [
  {
    time: '06:30',
    title: 'Set up',
    text: 'Traders unload on the closed street. Each pitch is chalked on the ground with its number, and the covered stalls go up first.',
  },
  {
    time: '09:00',
    title: 'Doors open',
    text: 'The welcome desk hands out coffee and the printed map. Most questions are about the bakery, which sells out before eleven.',
  },
  {
    time: '14:00',
    title: 'Pack up',
    text: 'Stalls come down in reverse order. By three the street is swept and the tables are back in the hall for next Saturday.',
  },
];

export function StickyScrollSections() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[400px] w-full overflow-y-auto rounded-xl'
    >
      <StickySections>
        {MOMENTS.map((moment, index) => {
          const isFirst = index === 0;

          return (
            <StickySection
              key={moment.time}
              aria-label={moment.title}
              className={cn(
                'bg-card h-[400px] justify-center gap-3 px-8 sm:px-12',
                !isFirst && 'hairline-ring ring-border rounded-t-2xl'
              )}
            >
              <span className='text-muted-foreground text-[13px] tabular-nums'>
                {moment.time}
              </span>
              <h3 className='text-foreground text-2xl font-semibold text-balance'>
                {moment.title}
              </h3>
              <p className='text-muted-foreground max-w-md text-sm'>
                {moment.text}
              </p>
            </StickySection>
          );
        })}
      </StickySections>
      <div className='text-muted-foreground flex h-[200px] items-center justify-center text-[13px]'>
        See you next Saturday
      </div>
    </div>
  );
}
