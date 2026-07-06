import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { CTA_BAND } from './data';

export function CallToAction() {
  return (
    <section className='px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='surface-brand relative isolate mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-2xl p-6 sm:p-10 md:flex-row md:items-center md:justify-between md:gap-10'>
        <Wash />
        <div className='flex max-w-xl flex-col gap-2'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {CTA_BAND.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {CTA_BAND.description}
          </p>
        </div>
        <Button
          size='lg'
          className='shrink-0'
          nativeButton={false}
          render={<a href='#' />}
        >
          {CTA_BAND.action}
          <ArrowRightIcon />
        </Button>
      </div>
    </section>
  );
}
