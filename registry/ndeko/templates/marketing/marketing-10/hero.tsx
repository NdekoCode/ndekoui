'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { CONTACT_ANCHOR, HERO, WORK_ANCHOR } from './data';
import { DrawnAvatar } from './drawn-avatar';
import { QuietGrid } from './quiet-grid';

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const isShown = useInView(ref, { once: true });

  return (
    <section className='relative overflow-hidden px-4 py-14 sm:px-6 sm:py-24 lg:px-8'>
      <QuietGrid />
      <div
        ref={ref}
        className='relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16'
      >
        <div className='mx-auto aspect-[11/12] w-36 sm:w-44 lg:order-last lg:w-full'>
          <DrawnAvatar />
        </div>
        <Settle isShown={isShown} className='flex flex-col items-start gap-6'>
          <SettleItem>
            <Badge
              variant='secondary'
              className='text-muted-foreground h-6 px-2'
            >
              {HERO.eyebrow}
            </Badge>
          </SettleItem>
          <SettleItem>
            <h1 className='max-w-2xl text-4xl font-semibold text-balance sm:text-5xl lg:text-6xl'>
              {HERO.title}
            </h1>
          </SettleItem>
          <SettleItem>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem className='flex flex-wrap gap-2 pt-1'>
            <Button
              size='lg'
              nativeButton={false}
              render={<a href={`#${WORK_ANCHOR}`} />}
            >
              {HERO.primaryAction}
              <ArrowRightIcon />
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<a href={`#${CONTACT_ANCHOR}`} />}
            >
              {HERO.secondaryAction}
            </Button>
          </SettleItem>
        </Settle>
      </div>
    </section>
  );
}
