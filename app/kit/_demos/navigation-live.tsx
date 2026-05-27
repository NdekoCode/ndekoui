'use client';

import { useState } from 'react';

import { usePagination } from '@/registry/ndeko/hooks/use-pagination';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/registry/ndeko/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/registry/ndeko/ui/pagination';

const PRODUCT_LINKS = [
  {
    href: '#nav-boards',
    label: 'Boards',
    description: 'Plan work in columns you drag cards across.',
  },
  {
    href: '#nav-docs',
    label: 'Docs',
    description: 'Specs and notes next to the tasks they explain.',
  },
  {
    href: '#nav-automations',
    label: 'Automations',
    description: 'Rules that move, assign and remind for you.',
  },
];

const RESOURCE_LINKS = [
  { href: '#nav-guides', label: 'Guides' },
  { href: '#nav-changelog', label: 'Changelog' },
  { href: '#nav-status', label: 'Status' },
];

const TOP_LINK = cn(
  navigationMenuTriggerStyle,
  'flex-row py-0 data-active:bg-transparent'
);

const FIRST_PAGE = 1;
const INITIAL_PAGE = 4;
const TOTAL_PAGES = 12;
const PAGES_TO_DISPLAY = 5;

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export function NavigationMenuDemo() {
  return (
    <NavigationMenu aria-label='Product'>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent className='sm:min-w-80'>
            <ul className='flex flex-col'>
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <NavigationMenuLink href={link.href} closeOnClick>
                    <span className='font-medium'>{link.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {link.description}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent className='sm:min-w-48'>
            <ul className='flex flex-col'>
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <NavigationMenuLink
                    href={link.href}
                    closeOnClick
                    className='py-2'
                  >
                    {link.label}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href='#nav-pricing' className={TOP_LINK}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function PaginationDemo() {
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages: TOTAL_PAGES,
    paginationItemsToDisplay: PAGES_TO_DISPLAY,
  });
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const isFirstPage = currentPage === FIRST_PAGE;
  const isLastPage = currentPage === TOTAL_PAGES;

  function goToPage(event: React.MouseEvent<HTMLAnchorElement>, page: number) {
    event.preventDefault();
    const target = clampPage(page);
    setCurrentPage(target);
  }

  return (
    <Pagination>
      <PaginationContent className='flex-wrap justify-center'>
        <PaginationItem>
          <PaginationPrevious
            href={hrefOf(previousPage)}
            isDisabled={isFirstPage}
            onClick={(event) => goToPage(event, previousPage)}
          />
        </PaginationItem>
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pages.map((page) => {
          const isCurrent = page === currentPage;
          return (
            <PaginationItem key={page}>
              <PaginationLink
                href={hrefOf(page)}
                isActive={isCurrent}
                onClick={(event) => goToPage(event, page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            href={hrefOf(nextPage)}
            isDisabled={isLastPage}
            onClick={(event) => goToPage(event, nextPage)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
