import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { HERO, PRICING_ANCHOR, STUDIO_ANCHOR, TRIAGE_ANCHOR } from './data';
import { StudioCard } from './studio-card';

export function Hero() {
  return (
    <section
      id={STUDIO_ANCHOR}
      className='px-4 pt-12 pb-12 @sm:px-6 @sm:pt-20 @5xl:px-8'
    >
      <Settle
        isShown
        className='mx-auto grid max-w-6xl items-center gap-12 @4xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] @4xl:gap-16'
      >
        <div className='flex max-w-xl flex-col items-start gap-5'>
          <SettleItem>
            <p className='text-primary-ink text-xs font-medium'>
              {HERO.eyebrow}
            </p>
          </SettleItem>
          <SettleItem>
            <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
              {HERO.title}
            </h1>
          </SettleItem>
          <SettleItem>
            <p className='text-muted-foreground text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem>
            <div className='flex flex-wrap gap-2 pt-1'>
              <Button
                size='lg'
                nativeButton={false}
                render={<a href={`#${PRICING_ANCHOR}`} />}
              >
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href={`#${TRIAGE_ANCHOR}`} />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </SettleItem>
        </div>
        <SettleItem>
          <StudioCard />
        </SettleItem>
      </Settle>
    </section>
  );
}
