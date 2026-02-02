'use client';

import { ExpandableSearch } from '@/registry/ndeko/components/navbar/_parts/expandable-search';
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
import { HouseIcon, InboxIcon, ZapIcon } from '@/registry/ndeko/lib/icons';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Home', icon: HouseIcon },
  { href: '#', label: 'Inbox', icon: InboxIcon },
  { href: '#', label: 'Insights', icon: ZapIcon },
];

export default function Navbar11() {
  const { activeLabel, navigate } = useActiveLink('Home');

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <MobileNav className='w-40'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              showsIcons
            />
          </MobileNav>
          <LogoLink />
        </div>
        <NavLinks
          links={LINKS}
          activeLabel={activeLabel}
          onNavigate={navigate}
          display='icon-label'
          className='max-md:hidden'
        />
        <div className='flex flex-1 items-center justify-end gap-2'>
          <ExpandableSearch />
        </div>
      </div>
    </header>
  );
}
