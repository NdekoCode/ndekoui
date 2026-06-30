import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { Constellation } from './constellation';
import { AREAS, SECTION } from './data';

const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const ALL_BRANDS = AREAS.flatMap((area) => area.brands);

function toolCountOf(count: number) {
  if (count === 1) {
    return '1 tool';
  }
  return `${count} tools`;
}

function areaCountOf(count: number) {
  if (count === 1) {
    return '1 area';
  }
  return `${count} areas`;
}

const LEAD = `${toolCountOf(ALL_BRANDS.length)} in ${areaCountOf(AREAS.length)}. ${SECTION.description}`;

export default function Integrations03() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>{LEAD}</p>
        </div>
        <ul className='grid gap-4 lg:grid-cols-2'>
          {AREAS.map((area) => (
            <li
              key={area.id}
              className={cn(
                CARD_SURFACE,
                'flex flex-col gap-1.5 p-1.5 sm:flex-row'
              )}
            >
              <div className='flex flex-1 flex-col items-start p-3.5 sm:p-4'>
                <div className='flex w-full items-baseline justify-between gap-3'>
                  <h3 className='text-base font-semibold text-balance'>
                    {area.title}
                  </h3>
                  <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                    {toolCountOf(area.brands.length)}
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed text-pretty'>
                  {area.description}
                </p>
                <div className='mt-auto pt-4'>
                  <Button
                    variant='link'
                    className='h-auto px-0'
                    nativeButton={false}
                    render={<a href='#' />}
                  >
                    {area.linkLabel}
                    <ChevronRightIcon className='size-3.5' />
                  </Button>
                </div>
              </div>
              <div className='bg-foreground/[0.025] flex shrink-0 items-center justify-center rounded-[calc(var(--radius-xl)-0.375rem)] sm:w-60'>
                <Constellation
                  label={`${area.title} tools`}
                  brands={area.brands}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
