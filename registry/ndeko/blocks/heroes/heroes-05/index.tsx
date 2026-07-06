'use client';

import { useScroll } from 'motion/react';
import { type RefObject, useRef } from 'react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { HERO } from './data';
import { ProductView } from './product-view';
import { TiltFrame } from './tilt-frame';

export type Heroes05Props = {
  /** The element that scrolls the page when it is not the window, such as a preview frame of your own. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
};

export default function Heroes05({ scrollContainerRef }: Heroes05Props) {
  const sectionRef = useRef<HTMLElement>(null);
  /** Tilted while the top of the hero meets the top of the page, flat once the page scrolled 240px past it. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollContainerRef,
    offset: ['start start', '240px start'],
  });

  return (
    <section ref={sectionRef} className='@container overflow-x-clip'>
      <div className='mx-auto flex max-w-6xl flex-col items-center px-4 py-16 @2xl:px-6 @2xl:py-24'>
        <div className='flex max-w-3xl flex-col items-center gap-5 text-center'>
          <p className='text-primary-ink text-sm font-medium'>{HERO.eyebrow}</p>
          <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
            {HERO.title}
          </h1>
          <p className='text-muted-foreground max-w-xl text-base text-pretty'>
            {HERO.description}
          </p>
          <div className='flex flex-wrap justify-center gap-2 pt-1'>
            <Button size='lg' nativeButton={false} render={<a href='#' />}>
              {HERO.primaryAction}
              <ArrowRightIcon />
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<a href='#' />}
            >
              {HERO.secondaryAction}
            </Button>
          </div>
        </div>
        <div className='mt-12 w-full max-w-5xl @2xl:mt-16'>
          <TiltFrame progress={scrollYProgress}>
            <ProductView />
          </TiltFrame>
        </div>
      </div>
    </section>
  );
}
