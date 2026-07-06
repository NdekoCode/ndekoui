import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { HERO, TOKENS } from './data';
import { delayOf, Headline, LANDING } from './headline';

/** The display rule of the home page: tight tracking on the display title and on nothing else. */
const DISPLAY =
  'text-[2.75rem] leading-[1.04] font-semibold tracking-[-0.03em] text-balance @2xl:text-7xl @5xl:text-8xl @5xl:leading-[1.02]';

export default function Heroes11() {
  const lastIndex = TOKENS.length;
  const leadIndex = lastIndex + 1;
  const actionsIndex = lastIndex + 2;

  return (
    <section className='@container'>
      <div className='relative isolate'>
        <Wash className='h-[30rem]' />
        <div className='mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center @2xl:gap-10 @2xl:px-6 @2xl:py-28'>
          <h1 className={cn(DISPLAY, 'max-w-5xl')}>
            <Headline />
          </h1>
          <p
            style={delayOf(leadIndex)}
            className={cn(
              'text-muted-foreground max-w-xl text-base text-pretty @2xl:text-lg',
              LANDING
            )}
          >
            {HERO.description}
          </p>
          <div
            style={delayOf(actionsIndex)}
            className={cn('flex flex-wrap justify-center gap-2', LANDING)}
          >
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
      </div>
    </section>
  );
}
