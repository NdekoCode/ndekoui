'use client';

import { useRef, useState } from 'react';

import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/registry/ndeko/ui/sheet';

import { DriftdeskMark } from './brand-mark';
import { HEADER, type NavLink } from './data';
import { scrollToSection, sectionHashOf } from './section-link';

function currentAttributeOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

type MobileSheetProps = {
  links: NavLink[];
  currentId: string | null;
};

export function MobileSheet({ links, currentId }: MobileSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldReturnFocus, setShouldReturnFocus] = useState(true);
  const pendingHashRef = useRef<string | null>(null);

  function changeOpen(open: boolean) {
    if (open) {
      setShouldReturnFocus(true);
    }
    setIsOpen(open);
  }

  function followLink(event: React.MouseEvent<HTMLElement>) {
    const href = event.currentTarget.getAttribute('href');
    const sectionHash = sectionHashOf(href);
    setShouldReturnFocus(false);
    setIsOpen(false);
    if (sectionHash === null) {
      return;
    }
    event.preventDefault();
    pendingHashRef.current = sectionHash;
  }

  function finishOpenChange(open: boolean) {
    const pendingHash = pendingHashRef.current;
    pendingHashRef.current = null;
    if (open) {
      return;
    }
    if (pendingHash === null) {
      return;
    }
    scrollToSection(pendingHash);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={changeOpen}
      onOpenChangeComplete={finishOpenChange}
    >
      <SheetTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            aria-label='Open menu'
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side='right' finalFocus={shouldReturnFocus}>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <DriftdeskMark />
            Driftdesk
          </SheetTitle>
          <SheetDescription>{HEADER.tagline}</SheetDescription>
        </SheetHeader>
        <nav aria-label='Main'>
          <ul className='flex flex-col gap-0.5'>
            {links.map((link) => {
              const isCurrent = currentId === link.id;

              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={currentAttributeOf(isCurrent)}
                    onClick={followLink}
                    className='text-foreground hover:bg-foreground/5 aria-[current=page]:bg-foreground/5 focus-visible:ring-ring/25 flex h-11 items-center justify-between rounded-md px-3 text-base font-medium transition-colors outline-none focus-visible:ring-[3px]'
                  >
                    {link.label}
                    {isCurrent && <SelectedMark />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <SheetFooter>
          <Button
            variant='outline'
            size='lg'
            nativeButton={false}
            render={<a href='#' />}
          >
            Sign in
          </Button>
          <Button
            size='lg'
            nativeButton={false}
            render={<a href={HEADER.actionHref} />}
            onClick={followLink}
          >
            {HEADER.action}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
