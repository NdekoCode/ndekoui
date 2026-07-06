import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { SlidingHeadlines } from './condensed';
import { HERO, OFFICES_ANCHOR, PLANNER_ANCHOR } from './data';

export function Hero() {
  return (
    <section className='px-4 pt-12 pb-16 @sm:px-6 @sm:pt-20 @sm:pb-24 @5xl:px-8'>
      <Settle isShown className='mx-auto flex max-w-6xl flex-col gap-10'>
        <SettleItem>
          <p className='text-primary-ink text-xs font-medium'>{HERO.eyebrow}</p>
        </SettleItem>
        <SettleItem>
          <h1 className='sr-only'>{HERO.headlines.join(', ')}</h1>
          <div aria-hidden='true'>
            <SlidingHeadlines lines={HERO.headlines} />
          </div>
        </SettleItem>
        <div className='flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between'>
          <SettleItem>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem>
            <div className='flex flex-wrap gap-2'>
              <Button
                size='lg'
                nativeButton={false}
                render={<a href={`#${PLANNER_ANCHOR}`} />}
              >
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href={`#${OFFICES_ANCHOR}`} />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </SettleItem>
        </div>
      </Settle>
    </section>
  );
}
