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
import { NotificationMenu } from '@/registry/ndeko/components/navbar/_parts/notification-menu';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import {
  HashIcon,
  HouseIcon,
  MailIcon,
  UsersRoundIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Home', icon: HouseIcon },
  { href: '#', label: 'Channels', icon: HashIcon },
  { href: '#', label: 'Groups', icon: UsersRoundIcon },
];

export default function Navbar09() {
  const { activeLabel, navigate } = useActiveLink();

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
            <ExpandableSearch />
          </div>
        </div>
        <NavLinks
          links={LINKS}
          activeLabel={activeLabel}
          onNavigate={navigate}
          display='icon'
          className='max-md:hidden'
        />
        <div className='flex flex-1 items-center justify-end gap-4'>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Open messages, new messages'
              className='text-muted-foreground'
            >
              <MailIcon />
              <span
                aria-hidden='true'
                className='bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full'
              />
            </Button>
            <NotificationMenu />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
