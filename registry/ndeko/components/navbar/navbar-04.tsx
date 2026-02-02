'use client';

import { LogoLink } from '@/registry/ndeko/components/navbar/_parts/logo';
import {
  MobileNav,
  MobileNavLink,
  MobileNavLinks,
  MobileNavSeparator,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { ExpandableSearch } from '@/registry/ndeko/components/navbar/_parts/expandable-search';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import { Button } from '@/registry/ndeko/ui/button';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Products' },
  { href: '#', label: 'Categories' },
  { href: '#', label: 'Deals' },
];

const CART_COUNT = 2;

function cartLabelOf(count: number) {
  if (count === 1) {
    return 'Cart, 1 item';
  }
  return `Cart, ${count} items`;
}

function CartCount({ count }: { count: number }) {
  return (
    <span className='text-primary-foreground/60 text-xs tabular-nums'>
      {count}
    </span>
  );
}

export default function Navbar04() {
  const { activeLabel, navigate } = useActiveLink();
  const cartLabel = cartLabelOf(CART_COUNT);

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <MobileNav className='w-40'>
            <MobileNavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
            />
            <MobileNavSeparator />
            <ul className='flex flex-col'>
              <li>
                <MobileNavLink href='#'>Sign in</MobileNavLink>
              </li>
            </ul>
            <Button
              nativeButton={false}
              aria-label={cartLabel}
              className='mt-1 w-full'
              render={<a href='#' />}
            >
              Cart
              <CartCount count={CART_COUNT} />
            </Button>
          </MobileNav>
          <div className='flex flex-1 items-center gap-6 max-md:justify-between'>
            <LogoLink />
            <NavLinks
              links={LINKS}
              activeLabel={activeLabel}
              onNavigate={navigate}
              className='max-md:hidden'
            />
            <ExpandableSearch />
          </div>
        </div>
        <div className='flex items-center gap-2 max-md:hidden'>
          <Button variant='ghost' nativeButton={false} render={<a href='#' />}>
            Sign in
          </Button>
          <Button
            nativeButton={false}
            aria-label={cartLabel}
            render={<a href='#' />}
          >
            Cart
            <CartCount count={CART_COUNT} />
          </Button>
        </div>
      </div>
    </header>
  );
}
