import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { Coverflow } from './coverflow';
import { FEED_ANCHOR, HERO, LAUNCH_ANCHOR } from './data';
import { PopShape } from './pop-shape';

export function Hero() {
  return (
    <section className='relative overflow-x-clip px-4 pt-12 pb-12 @sm:px-6 @sm:pt-20 @5xl:px-8'>
      <PopShape
        kind='circle'
        series={2}
        className='top-10 left-4 size-10 @3xl:top-16 @3xl:left-16 @3xl:size-16'
      />
      <PopShape
        kind='ring'
        series={3}
        delay={0.08}
        className='top-24 right-4 size-12 @3xl:top-32 @3xl:right-20 @3xl:size-20'
      />
      <PopShape
        kind='square'
        series={4}
        delay={0.16}
        className='bottom-48 left-6 size-8 rotate-12 @3xl:bottom-60 @3xl:left-24 @3xl:size-12'
      />
      <Settle
        isShown
        className='relative mx-auto flex max-w-6xl flex-col items-center gap-10'
      >
        <div className='flex max-w-2xl flex-col items-center gap-5 text-center'>
          <SettleItem>
            <p className='text-primary-ink text-xs font-medium'>
              {HERO.eyebrow}
            </p>
          </SettleItem>
          <SettleItem>
            <h1 className='text-4xl font-semibold text-balance @2xl:text-6xl'>
              {HERO.title}
            </h1>
          </SettleItem>
          <SettleItem>
            <p className='text-muted-foreground text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem>
            <div className='flex flex-wrap justify-center gap-2 pt-1'>
              <Button
                size='lg'
                nativeButton={false}
                render={<a href={`#${LAUNCH_ANCHOR}`} />}
              >
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href={`#${FEED_ANCHOR}`} />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </SettleItem>
        </div>
        <SettleItem className='w-full'>
          <Coverflow />
        </SettleItem>
      </Settle>
    </section>
  );
}
