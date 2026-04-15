'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { Collapsible } from '@/registry/ndeko/ui/collapsible';

import { LoomboardMark } from './brand-mark';
import { DesktopNav } from './desktop-nav';
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
    <header className='px-4 sm:px-6 lg:px-8'>
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
            <LoomboardMark />
            Loomboard
          </a>
          <DesktopNav />
          <div className='ms-auto hidden items-center gap-1 md:flex'>
            <Button
              variant='ghost'
              nativeButton={false}
              render={<a href='#' />}
            >
              Sign in
            </Button>
            <Button
              variant='outline'
              nativeButton={false}
              render={<a href='#' />}
            >
              Start free
            </Button>
          </div>
          <div className='ms-auto md:hidden'>
            <MobileMenuTrigger isOpen={isOpen} />
          </div>
        </div>
        <MobileMenuPanel onNavigate={navigateFromMenu} />
      </Collapsible>
    </header>
  );
}
