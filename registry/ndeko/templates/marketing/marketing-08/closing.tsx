import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { CLOSING, CLOSING_ANCHOR, FAQ_ANCHOR } from './data';

export function Closing() {
  return (
    <section
      id={CLOSING_ANCHOR}
      className='flex min-h-[70svh] items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto flex max-w-2xl flex-col items-center gap-6 text-center'>
        <h2 className='text-3xl font-semibold text-balance sm:text-4xl'>
          {CLOSING.title}
        </h2>
        <p className='text-muted-foreground max-w-lg text-base text-pretty'>
          {CLOSING.description}
        </p>
        <div className='flex flex-wrap justify-center gap-2 pt-1'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {CLOSING.action}
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<a href={`#${FAQ_ANCHOR}`} />}
          >
            {CLOSING.secondaryAction}
          </Button>
        </div>
      </div>
    </section>
  );
}
