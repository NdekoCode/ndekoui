import { Kbd } from '@/registry/ndeko/ui/kbd';

import { FEATURES, SECTION } from './data';

export default function Features02() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-12 sm:gap-16'>
        <div className='grid gap-4 md:grid-cols-2 md:items-end md:gap-12'>
          <div className='flex flex-col gap-3'>
            <p className='text-primary-ink text-xs font-medium'>
              {SECTION.eyebrow}
            </p>
            <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
              {SECTION.title}
            </h2>
          </div>
          <p className='text-muted-foreground max-w-md text-base text-pretty md:justify-self-end'>
            {SECTION.description}
          </p>
        </div>
        <ul className='grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((feature) => (
            <li key={feature.title} className='flex flex-col gap-3'>
              <div className='flex items-center gap-3'>
                <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
                  <feature.icon />
                </span>
                <h3 className='text-sm font-medium'>{feature.title}</h3>
                {feature.shortcut && (
                  <Kbd className='ms-auto'>
                    <span className='sr-only'>Shortcut</span>
                    {feature.shortcut}
                  </Kbd>
                )}
              </div>
              <p className='text-muted-foreground text-[13px] leading-relaxed text-pretty'>
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
