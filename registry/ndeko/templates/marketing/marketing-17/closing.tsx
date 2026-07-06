import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { Condensed } from './condensed';
import { CLOSING, START_ANCHOR } from './data';
import { Reveal } from './reveal';

export function Closing() {
  return (
    <section
      id={START_ANCHOR}
      className='px-4 pt-8 pb-20 @sm:px-6 @sm:pb-28 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='hairline-t border-border flex flex-col gap-10 pt-12'
      >
        <SettleItem>
          <h2 className='overflow-x-clip'>
            <Condensed className='text-[clamp(2.25rem,8.5cqw,7rem)]'>
              {CLOSING.headline}
            </Condensed>
          </h2>
        </SettleItem>
        <SettleItem className='flex flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between'>
          <p className='text-muted-foreground max-w-md text-base text-pretty'>
            {CLOSING.description}
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            <Button size='lg' nativeButton={false} render={<a href='#' />}>
              {CLOSING.primaryAction}
              <ArrowRightIcon />
            </Button>
            <a
              href={`mailto:${CLOSING.email}`}
              className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
            >
              {CLOSING.email}
            </a>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
