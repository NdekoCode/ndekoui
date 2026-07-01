import { Badge } from '@/registry/ndeko/ui/badge';

import { HERO, WAITLIST_ANCHOR } from './data';
import { IssuePreview } from './issue-preview';
import { WaitlistForm } from './waitlist-form';

export function Hero() {
  return (
    <section
      id={WAITLIST_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16'>
        <div className='flex max-w-xl flex-col items-start gap-6'>
          <Badge variant='secondary' className='text-muted-foreground h-6 px-2'>
            {HERO.eyebrow}
          </Badge>
          <h1 className='text-4xl font-semibold text-balance sm:text-5xl'>
            {HERO.title}
          </h1>
          <p className='text-muted-foreground text-base text-pretty'>
            {HERO.description}
          </p>
          <WaitlistForm />
        </div>
        <div className='hidden lg:block'>
          <IssuePreview />
        </div>
      </div>
    </section>
  );
}
