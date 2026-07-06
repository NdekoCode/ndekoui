import { Button } from '@/registry/ndeko/ui/button';

import { HearthworkMark } from './brand-mark';
import { BRAND, HEADER, NAV_LINKS } from './data';
import { MobileSheet } from './mobile-sheet';

export function SiteHeader() {
  return (
    <header className='px-4 @sm:px-6 @5xl:px-8'>
      <div className='mx-auto flex h-16 max-w-6xl items-center gap-6'>
        <a
          href='#'
          aria-current='page'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <HearthworkMark />
          {BRAND.name}
        </a>
        <nav aria-label='Main' className='hidden @3xl:block'>
          <ul className='flex items-center gap-1'>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px]'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className='ms-auto flex items-center gap-1'>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={HEADER.actionHref} />}
          >
            <span className='@sm:hidden'>{HEADER.shortAction}</span>
            <span className='hidden @sm:inline'>{HEADER.action}</span>
          </Button>
          <MobileSheet links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
