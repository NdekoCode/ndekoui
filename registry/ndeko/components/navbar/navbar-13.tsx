'use client';

import { GhostSelect } from '@/registry/ndeko/components/navbar/_parts/ghost-select';
import {
  MobileNav,
  MobileNavLinks,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { SettingsMenu } from '@/registry/ndeko/components/navbar/_parts/settings-menu';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Dashboard' },
  { href: '#', label: 'Docs' },
  { href: '#', label: 'API reference' },
];

const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'team', label: 'Team' },
  { value: 'business', label: 'Business' },
];

const PROJECTS = [
  { value: 'main', label: 'Main project' },
  { value: 'side', label: 'Side project' },
];

export default function Navbar13() {
  const { activeLabel, navigate } = useActiveLink();

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <MobileNav className='w-40'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
            />
          </MobileNav>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <GhostSelect
                  items={ACCOUNT_TYPES}
                  defaultValue='personal'
                  label='Select account type'
                  className='px-1.5'
                />
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <GhostSelect
                  items={PROJECTS}
                  defaultValue='main'
                  label='Select project'
                  className='px-1.5'
                />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <NavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              className='max-md:hidden'
            />
            <SettingsMenu />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
