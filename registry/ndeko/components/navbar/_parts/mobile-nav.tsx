'use client';

import { createContext, useContext, useState } from 'react';

import {
  isPlaceholderHref,
  NavLinkIcon,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import {
  MENU_ITEM,
  MENU_LABEL,
  MENU_SEPARATOR,
} from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

const CloseMenuContext = createContext<() => void>(() => undefined);

const BAR =
  'origin-center transition-[translate,rotate] duration-300 ease-(--ease-out-strong)';

const LINK_ROW = cn(
  MENU_ITEM,
  'text-muted-foreground cursor-pointer transition-colors duration-150',
  'hover:bg-foreground/5 hover:text-foreground focus-visible:bg-foreground/5 focus-visible:text-foreground',
  'data-active:bg-foreground/[0.06] data-active:text-foreground dark:data-active:bg-foreground/10'
);

function menuLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Close menu';
  }
  return 'Open menu';
}

function ariaCurrentOf(isActive: boolean) {
  if (isActive) {
    return 'page' as const;
  }
  return undefined;
}

function MenuToggleIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className='pointer-events-none size-4'
    >
      <path
        d='M4 12H20'
        className={cn(
          BAR,
          '-translate-y-[7px] group-aria-expanded/button:translate-y-0 group-aria-expanded/button:rotate-[315deg]'
        )}
      />
      <path
        d='M4 12H20'
        className={cn(BAR, 'group-aria-expanded/button:rotate-45')}
      />
      <path
        d='M4 12H20'
        className={cn(
          BAR,
          'translate-y-[7px] group-aria-expanded/button:translate-y-0 group-aria-expanded/button:rotate-[135deg]'
        )}
      />
    </svg>
  );
}

type MobileNavProps = {
  children: React.ReactNode;
  className?: string;
};

function MobileNav({ children, className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  function changeOpen(open: boolean) {
    setIsOpen(open);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            aria-label={menuLabelOf(isOpen)}
            className='md:hidden'
          />
        }
      >
        <MenuToggleIcon />
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className={cn('w-44 p-1 md:hidden', className)}
      >
        <nav aria-label='Main'>
          <CloseMenuContext.Provider value={closeMenu}>
            {children}
          </CloseMenuContext.Provider>
        </nav>
      </PopoverContent>
    </Popover>
  );
}

type MobileNavLinkProps = {
  href: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

function MobileNavLink({
  href,
  isActive = false,
  onClick,
  className,
  children,
}: MobileNavLinkProps) {
  const closeMenu = useContext(CloseMenuContext);

  function follow(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isPlaceholderHref(href)) {
      event.preventDefault();
    }
    onClick?.();
    closeMenu();
  }

  return (
    <a
      href={href}
      aria-current={ariaCurrentOf(isActive)}
      data-active={isActive || undefined}
      onClick={follow}
      className={cn(LINK_ROW, className)}
    >
      {children}
    </a>
  );
}

type MobileNavLinksProps = {
  links: NavLinkItem[];
  activeLabel?: string;
  onNavigate?: (label: string) => void;
  showsIcons?: boolean;
};

function MobileNavLinks({
  links,
  activeLabel,
  onNavigate,
  showsIcons = false,
}: MobileNavLinksProps) {
  return (
    <ul className='flex flex-col'>
      {links.map((link) => (
        <li key={link.label}>
          <MobileNavLink
            href={link.href}
            isActive={link.label === activeLabel}
            onClick={() => onNavigate?.(link.label)}
          >
            {showsIcons && <NavLinkIcon icon={link.icon} />}
            {link.label}
          </MobileNavLink>
        </li>
      ))}
    </ul>
  );
}

function MobileNavHeading({ children }: { children: React.ReactNode }) {
  return <div className={MENU_LABEL}>{children}</div>;
}

function MobileNavSeparator() {
  return (
    <div
      role='separator'
      aria-orientation='horizontal'
      className={MENU_SEPARATOR}
    />
  );
}

export {
  MobileNav,
  MobileNavHeading,
  MobileNavLink,
  MobileNavLinks,
  MobileNavSeparator,
};
