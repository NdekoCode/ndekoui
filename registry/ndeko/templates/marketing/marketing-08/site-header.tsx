import { Button } from '@/registry/ndeko/ui/button';

import { MurmuraMark } from './brand-mark';
import { CURRENT_LINK_ID, HEADER, NAV_LINKS } from './data';
import { MobileSheet } from './mobile-sheet';
import { NavLinks } from './nav-links';

export function SiteHeader() {
  return (
    <header className='sticky top-0 z-30 px-4 pt-4 sm:px-6'>
      <div className='bg-card hairline-ring ring-border mx-auto flex h-14 max-w-4xl items-center gap-3 rounded-full ps-4 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <a
          href='#hero'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-full text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <MurmuraMark />
          Murmura
        </a>
        <div className='flex flex-1 justify-center'>
          <NavLinks links={NAV_LINKS} currentId={CURRENT_LINK_ID} />
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            className='hidden md:inline-flex'
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
          <MobileSheet links={NAV_LINKS} currentId={CURRENT_LINK_ID} />
        </div>
      </div>
    </header>
  );
}
