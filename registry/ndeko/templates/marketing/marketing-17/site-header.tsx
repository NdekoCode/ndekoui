'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { Collapsible } from '@/registry/ndeko/ui/collapsible';

import { PinemarshMark } from './brand-mark';
import { BRAND, HEADER, NAV_LINKS } from './data';
import { MobileMenuPanel, MobileMenuTrigger } from './mobile-menu';
import { scrollToSection, sectionHashOf } from './section-link';

const MENU_COLLAPSE_MS = 200;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHash === null) {
      return;
    }
    const timeout = window.setTimeout(() => {
      scrollToSection(pendingHash);
      setPendingHash(null);
    }, MENU_COLLAPSE_MS);
    return () => window.clearTimeout(timeout);
  }, [pendingHash]);

  function navigateFromMenu(event: React.MouseEvent<HTMLAnchorElement>) {
    const href = event.currentTarget.getAttribute('href');
    const sectionHash = sectionHashOf(href);
    setIsOpen(false);
    if (sectionHash === null) {
      return;
    }
    event.preventDefault();
    setPendingHash(sectionHash);
  }

  return (
    <header className='px-4 @sm:px-6 @5xl:px-8'>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className='mx-auto max-w-6xl'
      >
        <div className='flex h-16 items-center gap-6'>
          <a
            href='#'
            aria-current='page'
            className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
          >
            <PinemarshMark />
            {BRAND.name}
          </a>
          <nav aria-label='Main' className='hidden @3xl:block'>
            <ul className='flex items-center gap-1'>
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px]'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className='ms-auto hidden items-center @3xl:flex'>
            <Button
              variant='outline'
              nativeButton={false}
              render={<a href={HEADER.actionHref} />}
            >
              {HEADER.action}
            </Button>
          </div>
          <div className='ms-auto @3xl:hidden'>
            <MobileMenuTrigger isOpen={isOpen} />
          </div>
        </div>
        <MobileMenuPanel links={NAV_LINKS} onNavigate={navigateFromMenu} />
      </Collapsible>
    </header>
  );
}
