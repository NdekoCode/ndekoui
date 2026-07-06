import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { CLOSING, CLOSING_ANCHOR } from './data';

export function Closing() {
  return (
    <section
      id={CLOSING_ANCHOR}
      className='flex min-h-[70svh] items-center px-4 py-24 sm:px-6 lg:px-8'
    >
      <div className='mx-auto flex w-full max-w-6xl flex-col items-start gap-6'>
        <h2 className='max-w-3xl text-4xl font-semibold text-balance sm:text-6xl'>
          {CLOSING.title}
        </h2>
        <p className='text-muted-foreground max-w-xl text-base text-pretty'>
          {CLOSING.description}
        </p>
        <div className='flex flex-col items-start gap-3 pt-1'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {CLOSING.action}
            <ArrowRightIcon />
          </Button>
          <p className='text-muted-foreground text-xs'>{CLOSING.note}</p>
        </div>
      </div>
    </section>
  );
}
