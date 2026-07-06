'use client';

import { WordRotate } from '@/components/core/word-rotate';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ArrowRightIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { HERO } from './data';
import { InstallChip } from './install-chip';
import { LiveRun } from './live-run';

/** How long each last word of the title stays before the next one turns in, in seconds. */
const WORD_INTERVAL_S = 2.8;

function AnnouncementLink() {
  return (
    <a
      href={HERO.announcement.href}
      className='group bg-foreground/[0.04] hover:bg-foreground/[0.07] focus-visible:ring-ring/25 inline-flex max-w-full items-center gap-2 rounded-full py-1 ps-1 pe-3 text-xs font-medium transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]'
    >
      <Badge className='rounded-full'>{HERO.announcement.label}</Badge>
      <span className='truncate'>{HERO.announcement.text}</span>
      <ChevronRightIcon className='text-muted-foreground size-3.5 shrink-0 transition-transform duration-150 ease-(--ease-out-strong) group-hover:translate-x-0.5' />
    </a>
  );
}

export default function Heroes06() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section className='@container'>
      <div className='mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 @2xl:px-6 @2xl:py-24 @4xl:grid-cols-[minmax(0,1fr)_24rem] @4xl:gap-16'>
        <div className='flex min-w-0 flex-col items-start gap-6'>
          <AnnouncementLink />
          <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
            {HERO.titleStart}{' '}
            <span className='text-primary-ink block'>
              <WordRotate
                words={HERO.titleWords}
                interval={WORD_INTERVAL_S}
                paused={shouldReduceMotion}
                accessibleText={HERO.titleSpoken}
              />
            </span>
          </h1>
          <p className='text-muted-foreground max-w-xl text-base text-pretty'>
            {HERO.description}
          </p>
          <div className='flex flex-wrap gap-2'>
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
          <InstallChip command={HERO.command} />
        </div>
        <LiveRun />
      </div>
    </section>
  );
}
