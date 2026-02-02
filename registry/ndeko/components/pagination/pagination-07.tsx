'use client';

import {
  LayoutGroup,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { usePagination } from '@/registry/ndeko/hooks/use-pagination';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/registry/ndeko/ui/pagination';

const FIRST_PAGE = 1;
const TOTAL_PAGES = 10;
const PAGES_TO_DISPLAY = 5;

const TRAVEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const CURRENT_PILL =
  'bg-card hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] dark:ring-foreground/15 absolute inset-0 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)]';

function travelTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return TRAVEL_TRANSITION;
}

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export default function Pagination07() {
  const layoutGroupId = useId();
  const shouldReduceMotion = useReducedMotion();
  const travelTransition = travelTransitionOf(shouldReduceMotion);
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
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
    <LayoutGroup id={layoutGroupId}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href={hrefOf(FIRST_PAGE)}
              aria-label='Go to first page'
              isDisabled={isFirstPage}
              onClick={(event) => goToPage(event, FIRST_PAGE)}
              className='rounded-full'
            >
              <ChevronFirstIcon />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href={hrefOf(previousPage)}
              aria-label='Go to previous page'
              isDisabled={isFirstPage}
              onClick={(event) => goToPage(event, previousPage)}
              className='rounded-full'
            >
              <ChevronLeftIcon />
            </PaginationLink>
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
                  aria-current={ariaCurrentOf(isCurrent)}
                  onClick={(event) => goToPage(event, page)}
                  className='rounded-full'
                >
                  {isCurrent && (
                    <motion.span
                      layoutId='current-page'
                      transition={travelTransition}
                      className={CURRENT_PILL}
                    />
                  )}
                  <span className='relative'>{page}</span>
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
            <PaginationLink
              href={hrefOf(nextPage)}
              aria-label='Go to next page'
              isDisabled={isLastPage}
              onClick={(event) => goToPage(event, nextPage)}
              className='rounded-full'
            >
              <ChevronRightIcon />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href={hrefOf(TOTAL_PAGES)}
              aria-label='Go to last page'
              isDisabled={isLastPage}
              onClick={(event) => goToPage(event, TOTAL_PAGES)}
              className='rounded-full'
            >
              <ChevronLastIcon />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </LayoutGroup>
  );
}
