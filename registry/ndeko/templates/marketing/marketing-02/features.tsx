import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { FEATURES_ANCHOR, FEATURES_SECTION, ROWS } from './data';
import { FeatureMedia } from './feature-media';

function isMediaFirst(index: number) {
  return index % 2 === 1;
}

export function Features() {
  return (
    <section
      id={FEATURES_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto flex max-w-6xl flex-col gap-14 sm:gap-20'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {FEATURES_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {FEATURES_SECTION.description}
          </p>
        </div>
        <ul className='flex flex-col gap-16 sm:gap-24'>
          {ROWS.map((row, index) => (
            <li
              key={row.id}
              className='grid items-center gap-8 lg:grid-cols-2 lg:gap-16'
            >
              <div className='flex flex-col items-start gap-4'>
                <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
                  <row.icon />
                </span>
                <h3 className='text-xl font-semibold text-balance'>
                  {row.title}
                </h3>
                <p className='text-muted-foreground max-w-md text-sm leading-relaxed text-pretty'>
                  {row.description}
                </p>
                <Button
                  variant='link'
                  className='h-auto px-0'
                  nativeButton={false}
                  render={<a href='#' />}
                >
                  {row.linkLabel}
                  <ChevronRightIcon className='size-3.5' />
                </Button>
              </div>
              <div className={cn(isMediaFirst(index) && 'lg:order-first')}>
                <FeatureMedia id={row.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
