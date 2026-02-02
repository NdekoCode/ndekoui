'use client';

import { LogoLink } from '@/registry/ndeko/components/navbar/_parts/logo';
import {
  MobileNav,
  MobileNavLinks,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { Button } from '@/registry/ndeko/ui/button';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Home' },
  { href: '#', label: 'Features' },
  { href: '#', label: 'Pricing' },
  { href: '#', label: 'About' },
];

export default function Navbar01() {
  const { activeLabel, navigate } = useActiveLink('Home');

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <MobileNav className='w-36'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
            />
          </MobileNav>
          <div className='flex items-center gap-6'>
            <LogoLink />
            <NavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              className='max-md:hidden'
            />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' nativeButton={false} render={<a href='#' />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<a href='#' />}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
