'use client';

import { GhostSelect } from '@/registry/ndeko/components/navbar/_parts/ghost-select';
import { LogoLink } from '@/registry/ndeko/components/navbar/_parts/logo';
import {
  MobileNav,
  MobileNavLinks,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { ThemeToggle } from '@/registry/ndeko/components/navbar/_parts/theme-toggle';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import {
  FileTextIcon,
  GlobeIcon,
  HomeIcon,
  LayersIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Dashboard', icon: HomeIcon },
  { href: '#', label: 'Projects', icon: LayersIcon },
  { href: '#', label: 'Documentation', icon: FileTextIcon },
  { href: '#', label: 'Team', icon: UsersIcon },
];

const LANGUAGES = [
  { value: 'en', label: 'En' },
  { value: 'es', label: 'Es' },
  { value: 'fr', label: 'Fr' },
  { value: 'de', label: 'De' },
  { value: 'ja', label: 'Ja' },
];

export default function Navbar06() {
  const { activeLabel, navigate } = useActiveLink('Dashboard');

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <MobileNav className='w-48'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              showsIcons
            />
          </MobileNav>
          <div className='flex items-center gap-6'>
            <LogoLink />
            <NavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              display='icon'
              className='max-md:hidden'
            />
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <ThemeToggle />
          <GhostSelect
            items={LANGUAGES}
            defaultValue='en'
            label='Select language'
            icon={<GlobeIcon className='text-muted-foreground' />}
            valueClassName='max-sm:hidden'
          />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
