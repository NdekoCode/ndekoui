import { ArrowRightIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { HERO } from './data';

export default function Heroes01() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-end md:gap-12'>
        <div className='flex flex-col items-start gap-5'>
          <a
            href={HERO.announcement.href}
            className='bg-card hairline-ring ring-border hover:bg-foreground/[0.03] focus-visible:ring-ring/25 dark:bg-foreground/[0.04] inline-flex max-w-full items-center gap-2 rounded-full py-1 ps-1 pe-3 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]'
          >
            <Badge
              variant='secondary'
              className='text-muted-foreground rounded-full'
            >
              {HERO.announcement.label}
            </Badge>
            <span className='truncate'>{HERO.announcement.text}</span>
            <ChevronRightIcon className='text-muted-foreground size-3.5 shrink-0' />
          </a>
          <h1 className='text-4xl font-semibold text-balance sm:text-5xl'>
            {HERO.title}
          </h1>
        </div>
        <div className='flex flex-col gap-6 md:pb-1.5'>
          <p className='text-muted-foreground max-w-md text-base text-pretty'>
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
          <p className='text-muted-foreground text-xs'>{HERO.note}</p>
        </div>
      </div>
    </section>
  );
}
