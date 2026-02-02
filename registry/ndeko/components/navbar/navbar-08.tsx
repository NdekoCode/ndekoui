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
import { NotificationMenu } from '@/registry/ndeko/components/navbar/_parts/notification-menu';
import { SearchField } from '@/registry/ndeko/components/navbar/_parts/search-field';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Home' },
  { href: '#', label: 'Features' },
  { href: '#', label: 'Pricing' },
  { href: '#', label: 'About' },
];

export default function Navbar08() {
  const { activeLabel, navigate } = useActiveLink('Home');

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <MobileNav className='w-36'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
            />
          </MobileNav>
          <LogoLink />
        </div>
        <div className='grow'>
          <SearchField
            containerClassName='mx-auto w-full max-w-xs'
            end={<Kbd>⌘K</Kbd>}
          />
        </div>
        <div className='flex flex-1 items-center justify-end gap-2'>
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
      <div className='pb-3 max-md:hidden'>
        <NavLinks
          links={LINKS}
          activeLabel={activeLabel}
          onNavigate={navigate}
          className='-ms-3'
        />
      </div>
    </header>
  );
}
