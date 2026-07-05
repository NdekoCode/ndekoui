'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { GithubIcon, MenuIcon, StarIcon } from '@/registry/ndeko/lib/icons';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { REPOSITORY_URL } from './repository';
import { SiteSearch } from './site-search/site-search';
import { ThemeToggle } from './theme-toggle';

const NAVIGATION = [
  { href: '/kit', label: 'Primitives' },
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/docs', label: 'Motion' },
  { href: '/mcp/connect', label: 'MCP' },
];

const SCROLLED_AFTER_PX = 8;

const HIGHLIGHT_TRAVEL = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
} as const;

const NO_TRAVEL = { duration: 0 } as const;

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

function isCurrentSection(pathname: string, href: string) {
  const isExact = pathname === href;
  const isNested = pathname.startsWith(`${href}/`);
  return isExact || isNested;
}

function travelOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return NO_TRAVEL;
  }
  return HIGHLIGHT_TRAVEL;
}

function useIsScrolled() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function readScroll() {
      const hasLeftTop = window.scrollY > SCROLLED_AFTER_PX;
      setIsScrolled(hasLeftTop);
    }
    readScroll();
    window.addEventListener('scroll', readScroll, { passive: true });
    return () => window.removeEventListener('scroll', readScroll);
  }, []);

  return isScrolled;
}

function SectionMenu({ pathname }: { pathname: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Open the sections menu'
            className='md:hidden'
          />
        }
      >
        <MenuIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-40'>
        {NAVIGATION.map((item) => {
          const isCurrent = isCurrentSection(pathname, item.href);
          return (
            <MenuPrimitive.LinkItem
              key={item.href}
              aria-current={ariaCurrentOf(isCurrent)}
              className={MENU_ITEM}
              render={<Link href={item.href} />}
            >
              {item.label}
            </MenuPrimitive.LinkItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SectionNavigation({ pathname }: { pathname: string }) {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const travel = travelOf(prefersReducedMotion);

  function clearHover() {
    setHoveredHref(null);
  }

  return (
    <nav
      aria-label='Sections'
      className='hidden items-center md:flex'
      onPointerLeave={clearHover}
    >
      {NAVIGATION.map((item) => {
        const isCurrent = isCurrentSection(pathname, item.href);
        const isHovered = hoveredHref === item.href;

        function showHover() {
          setHoveredHref(item.href);
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ariaCurrentOf(isCurrent)}
            onPointerEnter={showHover}
            onFocus={showHover}
            onBlur={clearHover}
            className='text-muted-foreground aria-[current=page]:text-foreground hover:text-foreground focus-visible:ring-ring/25 relative rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px]'
          >
            {isHovered && (
              <motion.span
                layoutId='site-nav-hover'
                transition={travel}
                aria-hidden='true'
                className='bg-foreground/[0.06] absolute inset-0 rounded-full'
              />
            )}
            <span className='relative'>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function GithubStarLink() {
  return (
    <Button
      variant='outline'
      size='sm'
      nativeButton={false}
      aria-label='Star ndekoui on GitHub'
      className='hidden rounded-full sm:inline-flex'
      render={<a href={REPOSITORY_URL} />}
    >
      <GithubIcon />
      Star
      <StarIcon className='text-muted-foreground' />
    </Button>
  );
}

type SiteHeaderProps = {
  /** The home page runs wider than the catalogue, and its header lines up with it. */
  isWide?: boolean;
};

function containerWidthOf(isWide: boolean) {
  if (isWide) {
    return 'max-w-7xl md:px-8';
  }
  return 'max-w-6xl md:px-6';
}

export function SiteHeader({ isWide = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const isScrolled = useIsScrolled();

  return (
    <header
      data-scrolled={isScrolled}
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-200',
        isScrolled &&
          'bg-background/80 shadow-[0_1px_0_var(--border)] backdrop-blur-md'
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-16 w-full items-center gap-4 px-4 md:grid md:grid-cols-[1fr_auto_1fr]',
          containerWidthOf(isWide)
        )}
      >
        <Link
          href='/'
          className='focus-visible:ring-ring/25 flex w-fit items-center gap-2.5 rounded-lg text-[15px] font-semibold outline-none focus-visible:ring-[3px]'
        >
          <NdekoUILLogo aria-hidden className='size-7' />
          ndekoui
        </Link>
        <SectionNavigation pathname={pathname} />
        <div className='ml-auto flex items-center gap-1 md:justify-self-end'>
          <SiteSearch />
          <SectionMenu pathname={pathname} />
          <ThemeToggle />
          <GithubStarLink />
        </div>
      </div>
    </header>
  );
}
