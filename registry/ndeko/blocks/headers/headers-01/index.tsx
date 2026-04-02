'use client';

import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { Collapsible } from '@/registry/ndeko/ui/collapsible';

import { LoomboardMark } from './brand-mark';
import { DesktopNav } from './desktop-nav';
import { MobileMenuPanel, MobileMenuTrigger } from './mobile-menu';

export default function Headers01() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
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
            <Button nativeButton={false} render={<a href='#' />}>
              Start free
            </Button>
          </div>
          <div className='ms-auto md:hidden'>
            <MobileMenuTrigger isOpen={isOpen} />
          </div>
        </div>
        <MobileMenuPanel onNavigate={closeMenu} />
      </Collapsible>
    </header>
  );
}
