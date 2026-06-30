'use client';

import {
  MobileNav,
  MobileNavLinks,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { NotificationMenu } from '@/registry/ndeko/components/navbar/_parts/notification-menu';
import { TeamSwitcher } from '@/registry/ndeko/components/navbar/_parts/team-switcher';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import {
  CompassIcon,
  FeatherIcon,
  HouseIcon,
  PlusIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const TEAMS = ['Acme Inc.', 'Lumen Labs', 'Junon'];

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Dashboard', icon: HouseIcon },
  { href: '#', label: 'Explore', icon: CompassIcon },
  { href: '#', label: 'Write', icon: FeatherIcon },
  { href: '#', label: 'Search', icon: SearchIcon },
];

export default function Navbar14() {
  const { activeLabel, navigate } = useActiveLink();

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-2 sm:gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <MobileNav className='w-48'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              showsIcons
            />
          </MobileNav>
          <TeamSwitcher teams={TEAMS} defaultTeam={TEAMS[0]} />
        </div>
        <NavLinks
          links={LINKS}
          activeLabel={activeLabel}
          onNavigate={navigate}
          display='icon'
          className='max-md:hidden'
        />
        <div className='flex flex-1 items-center justify-end gap-2 sm:gap-4'>
          <Button className='max-sm:aspect-square max-sm:px-0'>
            <PlusIcon className='opacity-60' />
            <span className='max-sm:sr-only'>Post</span>
          </Button>
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
