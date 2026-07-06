import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { OFFER, PRICING_ANCHOR } from './data';
import { Reveal } from './reveal';

export function Offer() {
  return (
    <section
      id={PRICING_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal className='mx-auto max-w-4xl'>
        <SettleItem>
          <div className='bg-foreground/[0.03] grid gap-2 rounded-2xl p-2 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:p-3'>
            <div className='bg-card surface-brand flex flex-col justify-between gap-8 rounded-xl p-6 @3xl:p-8'>
              <div className='flex flex-col gap-4'>
                <h2 className='text-lg font-semibold'>{OFFER.name}</h2>
                <p className='flex items-baseline gap-2'>
                  <span className='text-5xl font-semibold tabular-nums'>
                    {OFFER.price}
                  </span>
                  <span className='text-muted-foreground text-sm'>
                    {OFFER.period}
                  </span>
                </p>
                <p className='text-muted-foreground text-[13px] text-pretty'>
                  {OFFER.description}
                </p>
              </div>
              <div className='flex flex-col gap-2'>
                <Button size='lg' nativeButton={false} render={<a href='#' />}>
                  {OFFER.action}
                </Button>
                <p className='text-muted-foreground text-xs'>{OFFER.after}</p>
              </div>
            </div>
            <div className='flex flex-col justify-between gap-6 p-4 @3xl:p-6'>
              <dl className='flex flex-col'>
                {OFFER.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className='flex items-baseline justify-between gap-4 py-3 text-[13px]'
                  >
                    <dt className='text-muted-foreground'>{fact.label}</dt>
                    <dd className='font-medium'>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className='text-muted-foreground text-xs'>{OFFER.note}</p>
            </div>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
