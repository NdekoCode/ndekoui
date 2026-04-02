import { Chip } from '@/registry/ndeko/ui/chip';

import { HERO } from './data';
import { IssuePreview } from './issue-preview';
import { WaitlistForm } from './waitlist-form';

export default function Heroes03() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16'>
        <div className='flex max-w-xl flex-col items-start gap-6'>
          <Chip color='var(--muted-foreground)' className='h-6 px-2'>
            {HERO.eyebrow}
          </Chip>
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
