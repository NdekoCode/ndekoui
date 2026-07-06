import { ScrollText } from '@/components/core/scroll-text';

import { MANIFESTO, MANIFESTO_LABEL } from './data';

export function Manifesto() {
  return (
    <section className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'>
      <div className='mx-auto flex max-w-4xl flex-col gap-6'>
        <p className='text-primary-ink text-xs font-medium'>
          {MANIFESTO_LABEL}
        </p>
        <ScrollText
          mode='word'
          as='p'
          className='text-3xl leading-tight font-semibold text-balance @2xl:text-4xl'
        >
          {MANIFESTO}
        </ScrollText>
      </div>
    </section>
  );
}
