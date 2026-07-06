import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { CONTACT, CONTACT_ANCHOR } from './data';

export function Contact() {
  return (
    <section
      id={CONTACT_ANCHOR}
      className='px-4 py-24 pe-12 sm:px-6 sm:py-32 sm:pe-14 lg:px-8 lg:pe-16'
    >
      <div className='mx-auto flex max-w-6xl flex-col items-start gap-6'>
        <h2 className='max-w-2xl text-3xl font-semibold text-balance sm:text-5xl'>
          {CONTACT.title}
        </h2>
        <p className='text-muted-foreground max-w-lg text-base text-pretty'>
          {CONTACT.description}
        </p>
        <div className='flex flex-wrap gap-2 pt-1'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {CONTACT.action}
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<a href='#' />}
          >
            {CONTACT.secondaryAction}
          </Button>
        </div>
      </div>
    </section>
  );
}
