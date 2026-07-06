import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';

import { TALKS, TALKS_ANCHOR, TALKS_SECTION } from './data';

export function Talks() {
  return (
    <section id={TALKS_ANCHOR} className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16'>
        <div className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {TALKS_SECTION.title}
          </h2>
          <p className='text-muted-foreground max-w-sm text-base text-pretty'>
            {TALKS_SECTION.description}
          </p>
        </div>
        <ul className='flex flex-col'>
          {TALKS.map((talk) => (
            <li key={talk.title}>
              <a
                href='#'
                className='group/talk hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl px-3 py-4 transition-colors outline-none focus-visible:ring-[3px] sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]'
              >
                <time
                  dateTime={talk.isoDate}
                  className='text-muted-foreground text-xs tabular-nums sm:text-[13px]'
                >
                  {talk.date}
                </time>
                <span className='order-3 col-span-2 flex flex-col gap-0.5 sm:order-none sm:col-span-1'>
                  <span className='text-sm font-medium text-balance'>
                    {talk.title}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {talk.venue}, {talk.city}
                  </span>
                </span>
                <ArrowUpRightIcon className='text-muted-foreground group-hover/talk:text-foreground size-4 transition-[translate,color] duration-150 group-hover/talk:translate-x-0.5 group-hover/talk:-translate-y-0.5' />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
