import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { BANKS_ANCHOR, CONVERT_ANCHOR, HERO, START_ANCHOR } from './data';
import { StatementReader } from './statement-reader';

export function Hero() {
  return (
    <section
      id={CONVERT_ANCHOR}
      className='px-4 pt-12 pb-10 @sm:px-6 @sm:pt-20 @5xl:px-8'
    >
      <Settle
        isShown
        className='mx-auto flex max-w-6xl flex-col gap-10 @sm:gap-12'
      >
        <div className='flex max-w-3xl flex-col items-start gap-5'>
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
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
          </SettleItem>
          <SettleItem>
            <div className='flex flex-wrap gap-2 pt-1'>
              <Button
                size='lg'
                nativeButton={false}
                render={<a href={`#${START_ANCHOR}`} />}
              >
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href={`#${BANKS_ANCHOR}`} />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </SettleItem>
        </div>
        <SettleItem>
          <StatementReader />
        </SettleItem>
      </Settle>
    </section>
  );
}
