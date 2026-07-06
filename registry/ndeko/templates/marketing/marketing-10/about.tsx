import { ABOUT, ABOUT_ANCHOR } from './data';

export function About() {
  return (
    <section id={ABOUT_ANCHOR} className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16'>
        <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
          {ABOUT.title}
        </h2>
        <div className='flex flex-col gap-8'>
          <div className='text-muted-foreground flex max-w-2xl flex-col gap-4 text-base text-pretty'>
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl className='flex flex-col gap-3 text-[13px]'>
            {ABOUT.facts.map((fact) => (
              <div key={fact.label} className='flex gap-4'>
                <dt className='text-muted-foreground w-24 shrink-0'>
                  {fact.label}
                </dt>
                <dd className='font-medium'>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
