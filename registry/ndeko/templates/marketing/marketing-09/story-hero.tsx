'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { CLOSING_ANCHOR, HERO } from './data';

export function StoryHero() {
  const ref = useRef<HTMLDivElement>(null);
  const isShown = useInView(ref, { once: true });

  return (
    <section className='flex min-h-[80svh] items-center px-4 py-16 sm:px-6 lg:px-8'>
      <div ref={ref} className='mx-auto w-full max-w-6xl'>
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
            <h1 className='max-w-3xl text-4xl font-semibold text-balance sm:text-6xl lg:text-7xl'>
              {HERO.title}
            </h1>
          </SettleItem>
          <SettleItem>
            <div aria-hidden='true' className='flex flex-col gap-2'>
              <span className='bg-foreground/85 h-3 w-56 rounded-[2px]' />
              <span className='bg-foreground/85 h-3 w-72 max-w-full rounded-[2px]' />
              <span className='bg-foreground/85 h-3 w-36 rounded-[2px]' />
            </div>
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
              render={<a href={`#${CLOSING_ANCHOR}`} />}
            >
              {HERO.primaryAction}
              <ArrowRightIcon />
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<a href={`#${CLOSING_ANCHOR}`} />}
            >
              {HERO.secondaryAction}
            </Button>
          </SettleItem>
        </Settle>
      </div>
    </section>
  );
}
