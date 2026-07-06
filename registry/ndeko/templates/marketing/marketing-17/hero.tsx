import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { Condensed } from './condensed';
import { HERO, PILLARS_ANCHOR, START_ANCHOR } from './data';
import { DriftField } from './drift-field';

const CELL = 'hairline-border border-border -mt-(--hairline) -ms-(--hairline)';

export function Hero() {
  return (
    <section className='px-4 pt-8 pb-12 @sm:px-6 @sm:pt-12 @sm:pb-20 @5xl:px-8'>
      <div className='relative mx-auto max-w-6xl'>
        <DriftField />
        <Settle
          isShown
          className='relative grid grid-cols-2 overflow-hidden ps-(--hairline) pt-(--hairline) @3xl:grid-cols-4'
        >
          <SettleItem
            className={cn(
              CELL,
              'col-span-2 flex flex-col gap-6 p-6 @3xl:col-span-4 @3xl:p-10'
            )}
          >
            <p className='text-primary-ink text-xs font-medium'>
              {HERO.eyebrow}
            </p>
            <h1>
              <Condensed className='text-[clamp(2.25rem,9.5cqw,8rem)]'>
                {HERO.headline}
              </Condensed>
            </h1>
          </SettleItem>
          <SettleItem
            className={cn(
              CELL,
              'col-span-2 flex flex-col justify-between gap-8 p-6 @3xl:row-span-2 @3xl:p-10'
            )}
          >
            <p className='text-muted-foreground max-w-md text-base text-pretty'>
              {HERO.description}
            </p>
            <div className='flex flex-wrap gap-2'>
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
                render={<a href={`#${PILLARS_ANCHOR}`} />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </SettleItem>
          {HERO.cells.map((cell) => (
            <SettleItem
              key={cell.label}
              className={cn(
                CELL,
                'flex flex-col justify-between gap-6 p-4 @3xl:p-6'
              )}
            >
              <p className='text-muted-foreground text-xs'>{cell.label}</p>
              <p className='text-[15px] font-medium text-balance'>
                {cell.value}
              </p>
            </SettleItem>
          ))}
        </Settle>
      </div>
    </section>
  );
}
