import { ContactForm } from './contact-form';
import { CONTACT, CONTACT_ANCHOR, CONTACT_DETAILS } from './data';

export function Contact() {
  return (
    <section
      id={CONTACT_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16'>
        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-3'>
            <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
              {CONTACT.title}
            </h1>
            <p className='text-muted-foreground max-w-md text-base text-pretty'>
              {CONTACT.description}
            </p>
          </div>
          <dl className='flex flex-col gap-4'>
            {CONTACT_DETAILS.map((detail) => (
              <div key={detail.label} className='flex items-center gap-3'>
                <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
                  <detail.icon />
                </span>
                <div className='flex min-w-0 flex-col'>
                  <dt className='text-muted-foreground text-xs'>
                    {detail.label}
                  </dt>
                  <dd className='text-[13px] font-medium'>
                    {detail.href && (
                      <a
                        href={detail.href}
                        className='text-primary-ink focus-visible:ring-ring/25 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
                      >
                        {detail.value}
                      </a>
                    )}
                    {!detail.href && detail.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
