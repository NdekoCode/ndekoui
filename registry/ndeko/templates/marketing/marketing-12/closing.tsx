import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { CLOSING, HOW_ANCHOR, START_ANCHOR } from './data';
import { Reveal } from './reveal';

export function Closing() {
  return (
    <section
      id={START_ANCHOR}
      className='px-4 pt-8 pb-16 @sm:px-6 @sm:pb-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='bg-foreground/[0.04] flex flex-col items-start gap-6 rounded-2xl p-6 @sm:p-10 @3xl:p-14'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
            {CLOSING.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {CLOSING.description}
          </p>
        </SettleItem>
        <SettleItem className='flex flex-wrap gap-2'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {CLOSING.primaryAction}
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<a href={`#${HOW_ANCHOR}`} />}
          >
            {CLOSING.secondaryAction}
          </Button>
        </SettleItem>
      </Reveal>
    </section>
  );
}
