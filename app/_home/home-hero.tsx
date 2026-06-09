import Link from 'next/link';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export function HomeHero() {
  return (
    <section className='grid gap-8 md:grid-cols-2 md:items-end'>
      <div className='flex flex-col gap-3'>
        <p className='text-primary-ink text-xs font-medium'>
          Open source, MIT licensed
        </p>
        <h1 className='text-4xl font-semibold text-balance sm:text-5xl'>
          React components that animate every change of state
        </h1>
      </div>
      <div className='flex flex-col gap-5 md:justify-self-end'>
        <p className='text-muted-foreground max-w-md text-sm text-pretty'>
          Primitives, components, blocks and templates on one design language. A
          dialog grows to fit its next step, a tab indicator slides to the new
          choice. Copy any of them into your project with one command.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='lg'
            nativeButton={false}
            render={<Link href='/components' />}
          >
            Browse components
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<Link href='/docs/installation' />}
          >
            Install the theme
          </Button>
        </div>
      </div>
    </section>
  );
}
