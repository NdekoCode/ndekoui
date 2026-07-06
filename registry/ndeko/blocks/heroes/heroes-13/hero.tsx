'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { HERO } from './data';

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const isShown = useInView(ref, { once: true });

  return (
    <section
      id='hero'
      className='flex min-h-[calc(100svh-5.5rem)] items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div ref={ref} className='mx-auto w-full max-w-3xl'>
        <Settle
          isShown={isShown}
          className='flex flex-col items-center gap-6 text-center'
        >
          <SettleItem>
            <Badge
              variant='secondary'
              className='text-muted-foreground h-6 px-2'
            >
              {HERO.eyebrow}
            </Badge>
          </SettleItem>
          <SettleItem>
            <h1 className='text-4xl font-semibold text-balance sm:text-5xl lg:text-6xl'>
              {HERO.title}
            </h1>
          </SettleItem>
          <SettleItem>
            <p className='text-muted-foreground mx-auto max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem className='flex flex-wrap justify-center gap-2 pt-1'>
            <Button
              size='lg'
              nativeButton={false}
              render={<a href={HERO.primaryHref} />}
            >
              {HERO.primaryAction}
              <ArrowRightIcon />
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<a href={HERO.secondaryHref} />}
            >
              {HERO.secondaryAction}
            </Button>
          </SettleItem>
        </Settle>
      </div>
    </section>
  );
}
