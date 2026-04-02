'use client';

import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

import { FernpostMark } from './brand-mark';
import { DEFAULT_LINK_ID, NAV_LINKS } from './data';
import { MobileSheet } from './mobile-sheet';
import { NavLinks } from './nav-links';

export default function Headers02() {
  const [currentId, setCurrentId] = useState(DEFAULT_LINK_ID);

  return (
    <header className='px-4 pt-4 sm:px-6'>
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] mx-auto flex h-14 max-w-4xl items-center gap-3 rounded-full ps-4 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <a
          href='#'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-full text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <FernpostMark />
          Fernpost
        </a>
        <div className='flex flex-1 justify-center'>
          <NavLinks
            links={NAV_LINKS}
            currentId={currentId}
            onNavigate={setCurrentId}
          />
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            className='hidden md:inline-flex'
            nativeButton={false}
            render={<a href='#' />}
          >
            Sign in
          </Button>
          <Button nativeButton={false} render={<a href='#' />}>
            Start writing
          </Button>
          <MobileSheet
            links={NAV_LINKS}
            currentId={currentId}
            onNavigate={setCurrentId}
          />
        </div>
      </div>
    </header>
  );
}
