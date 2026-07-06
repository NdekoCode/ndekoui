import { Button } from '@/registry/ndeko/ui/button';

import { RowmillMark } from './brand-mark';
import { BRAND, HEADER, NAV_LINKS } from './data';
import { MobileSheet } from './mobile-sheet';
import { NavLinks } from './nav-links';

export function SiteHeader() {
  return (
    <header className='px-4 pt-4 @sm:px-6'>
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-full ps-4 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <a
          href='#'
          aria-current='page'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-full text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <RowmillMark />
          {BRAND.name}
        </a>
        <div className='hidden flex-1 justify-center @3xl:flex'>
          <NavLinks links={NAV_LINKS} />
        </div>
        <div className='ms-auto flex items-center gap-1 @3xl:ms-0'>
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
