'use client';

import { InfoMenu } from '@/registry/ndeko/components/navbar/_parts/info-menu';
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
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Home' },
  { href: '#', label: 'Features' },
  { href: '#', label: 'Pricing' },
  { href: '#', label: 'About' },
];

export default function Navbar05() {
  const { activeLabel, navigate } = useActiveLink();

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
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <InfoMenu />
            <NotificationMenu />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
