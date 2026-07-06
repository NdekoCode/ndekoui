'use client';

import { useRef, useState } from 'react';

import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/registry/ndeko/ui/sheet';

import { RowmillMark } from './brand-mark';
import { BRAND, HEADER, type NavLink } from './data';
import { scrollToSection, sectionHashOf } from './section-link';

type MobileSheetProps = {
  links: NavLink[];
};

export function MobileSheet({ links }: MobileSheetProps) {
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
            className='@3xl:hidden'
            aria-label='Open menu'
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side='right' finalFocus={shouldReturnFocus}>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <RowmillMark />
            {BRAND.name}
          </SheetTitle>
          <SheetDescription>{HEADER.tagline}</SheetDescription>
        </SheetHeader>
        <nav aria-label='Main'>
          <ul className='flex flex-col gap-0.5'>
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={followLink}
                  className='text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-11 items-center rounded-md px-3 text-base font-medium transition-colors outline-none focus-visible:ring-[3px]'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <SheetFooter>
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
