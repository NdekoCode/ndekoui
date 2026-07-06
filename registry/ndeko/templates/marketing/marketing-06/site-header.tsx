import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { BRAND, HEADER, NAV_LINKS } from './data';
import { MobileSheet } from './mobile-sheet';
import { NavLinks } from './nav-links';

export function SiteHeader() {
  return (
    <header className='px-4 pt-4 @2xl:px-6'>
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] mx-auto flex h-14 max-w-5xl items-center gap-3 rounded-full ps-4 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <a
          href='#'
          aria-current='page'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-full text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <CompanyMark seed={BRAND.name} size='lg' />
          {BRAND.name}
        </a>
        <div className='flex flex-1 justify-center'>
          <NavLinks links={NAV_LINKS} currentId={null} />
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            className='hidden @2xl:inline-flex'
            nativeButton={false}
            render={<a href='#' />}
          >
            Sign in
          </Button>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={HEADER.actionHref} />}
          >
            {HEADER.action}
          </Button>
          <MobileSheet links={NAV_LINKS} currentId={null} />
        </div>
      </div>
    </header>
  );
}
