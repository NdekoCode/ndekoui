import { CONTACT_ANCHOR, SUBSCRIBE } from './data';
import { NewsletterForm } from './newsletter-form';

export function Subscribe() {
  return (
    <section
      id={CONTACT_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='bg-foreground/[0.03] mx-auto grid max-w-6xl items-center gap-8 rounded-2xl p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16'>
        <div className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SUBSCRIBE.title}
          </h2>
          <p className='text-muted-foreground max-w-md text-base text-pretty'>
            {SUBSCRIBE.description}
          </p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}
