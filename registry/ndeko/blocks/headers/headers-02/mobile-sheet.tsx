'use client';

import { useState } from 'react';

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

import { FernpostMark } from './brand-mark';
import { type NavLink } from './data';

function currentAttributeOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

type MobileSheetProps = {
  links: NavLink[];
  currentId: string;
  onNavigate: (id: string) => void;
};

export function MobileSheet({
  links,
  currentId,
  onNavigate,
}: MobileSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeSheet() {
    setIsOpen(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <FernpostMark />
            Fernpost
          </SheetTitle>
          <SheetDescription>
            Newsletters for people who write every week
          </SheetDescription>
        </SheetHeader>
        <nav aria-label='Main'>
          <ul className='flex flex-col gap-0.5'>
            {links.map((link) => {
              const isCurrent = currentId === link.id;

              function navigate() {
                onNavigate(link.id);
                closeSheet();
              }

              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={currentAttributeOf(isCurrent)}
                    onClick={navigate}
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
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            Start writing
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
