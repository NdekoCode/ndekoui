import { Button } from '@/registry/ndeko/ui/button';

import { LisangaMark } from './brand-mark';
import { BRAND, HEADER, SECTIONS } from './data';

export function SiteHeader() {
  return (
    <header className='px-4 pe-12 pt-4 sm:px-6 sm:pe-14 lg:px-8 lg:pe-16'>
      <div className='mx-auto flex max-w-6xl flex-col gap-3'>
        <div className='flex h-14 items-center gap-4'>
          <a
            href='#studio'
            className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
          >
            <LisangaMark />
            {BRAND.name}
          </a>
          <p className='text-muted-foreground ms-auto hidden text-xs md:block'>
            {HEADER.meta}
          </p>
          <Button
            variant='outline'
            className='ms-auto md:ms-0'
            nativeButton={false}
            render={<a href={HEADER.actionHref} />}
          >
            {HEADER.action}
          </Button>
        </div>
        <nav aria-label='Index' className='hidden md:block'>
          <ol className='flex items-baseline gap-7 text-[13px]'>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex items-baseline gap-1.5 rounded-sm transition-colors outline-none focus-visible:ring-[3px]'
                >
                  <span className='text-xs tabular-nums'>{section.number}</span>
                  {section.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  );
}
