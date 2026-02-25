'use client';
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/core/carousel';
import { cn } from '@/registry/ndeko/lib/utils';

const STEPS = [
  {
    title: 'Connect your calendar',
    meta: 'Two minutes',
    tile: 'bg-primary/10',
  },
  {
    title: 'Invite your team',
    meta: 'Up to 10 members on the free plan',
    tile: 'bg-success/10',
  },
  {
    title: 'Create a first board',
    meta: 'Start from a template',
    tile: 'bg-warning/10',
  },
  {
    title: 'Share the weekly view',
    meta: 'Read only for guests',
    tile: 'bg-info/10',
  },
];

export function CarouselCustomIndicator() {
  const [index, setIndex] = useState(0);

  return (
    <div className='relative w-full max-w-xs py-8'>
      <Carousel index={index} onIndexChange={setIndex}>
        <CarouselContent className='relative'>
          {STEPS.map((step, stepIndex) => {
            return (
              <CarouselItem key={step.title} className='p-4'>
                <div
                  className={cn(
                    'flex aspect-square flex-col justify-end rounded-xl p-4',
                    step.tile
                  )}
                >
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    Step {stepIndex + 1} of {STEPS.length}
                  </span>
                  <span className='text-foreground text-sm font-medium'>
                    {step.title}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {step.meta}
                  </span>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      <div className='flex w-full justify-center space-x-3 px-4'>
        {STEPS.map((step, stepIndex) => {
          const isActive = stepIndex === index;

          return (
            <button
              key={step.title}
              type='button'
              aria-label={`Go to step ${stepIndex + 1}`}
              aria-current={isActive}
              onClick={() => setIndex(stepIndex)}
              className={cn(
                'text-muted-foreground hairline-ring ring-border size-12 rounded-lg text-[13px] font-medium tabular-nums transition-colors',
                isActive && 'bg-foreground/[0.06] text-foreground'
              )}
            >
              {stepIndex + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
