import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { PLAN, PRICING, PRICING_ANCHOR } from './data';

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function Pricing() {
  const price = PRICE_FORMATTER.format(PLAN.price);

  return (
    <section
      id={PRICING_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16'>
        <div className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {PRICING.title}
          </h2>
          <p className='text-muted-foreground max-w-md text-base text-pretty'>
            {PRICING.description}
          </p>
        </div>
        <article className='bg-card hairline-ring ring-border flex flex-col gap-6 rounded-xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)] sm:p-7'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-sm font-medium'>{PLAN.name}</h3>
            <Badge variant='secondary' className='text-muted-foreground'>
              Illustrative
            </Badge>
          </div>
          <div className='flex flex-col gap-1'>
            <p className='flex items-baseline gap-1.5'>
              <span className='text-5xl font-semibold tabular-nums'>
                {price}
              </span>
              <span className='text-muted-foreground text-[13px]'>
                {PLAN.period}
              </span>
            </p>
            <p className='text-muted-foreground text-xs'>{PLAN.note}</p>
          </div>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {PLAN.action}
          </Button>
          <ul className='flex flex-col gap-2.5 text-[13px]'>
            {PLAN.features.map((feature) => (
              <li key={feature} className='flex items-center gap-2.5'>
                <span
                  aria-hidden='true'
                  className='bg-primary size-1.5 shrink-0 rounded-full'
                />
                {feature}
              </li>
            ))}
          </ul>
          <p className='text-muted-foreground text-xs'>{PLAN.footnote}</p>
        </article>
      </div>
    </section>
  );
}
