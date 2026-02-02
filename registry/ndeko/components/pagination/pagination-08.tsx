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
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button, buttonVariants } from '@/registry/ndeko/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';

const FIRST_PAGE = 1;
const TOTAL_PAGES = 10;
const PAGES_TO_DISPLAY = 5;

const SEGMENT = 'rounded-none tabular-nums focus-visible:z-10';

const CURRENT_FILL =
  'bg-foreground/[0.06] dark:bg-foreground/10 absolute inset-0';

const TRAVEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const EDGE_SEGMENT =
  'data-disabled:text-foreground/30 data-disabled:opacity-100';

const ELLIPSIS_SEGMENT = cn(
  buttonVariants({ variant: 'outline', size: 'icon' }),
  'text-muted-foreground pointer-events-none rounded-none'
);

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

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

export default function Pagination08() {
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
        <PaginationContent className='gap-0 -space-x-px'>
          <PaginationItem>
            <Button
              variant='outline'
              size='icon'
              nativeButton={false}
              disabled={isFirstPage}
              className={cn(SEGMENT, EDGE_SEGMENT, 'rounded-s-full')}
              render={
                <a
                  href={hrefOf(previousPage)}
                  aria-label='Go to previous page'
                  onClick={(event) => goToPage(event, previousPage)}
                />
              }
            >
              <ChevronLeftIcon />
            </Button>
          </PaginationItem>
          {showLeftEllipsis && (
            <PaginationItem>
              <span aria-hidden='true' className={ELLIPSIS_SEGMENT}>
                <EllipsisIcon />
              </span>
            </PaginationItem>
          )}
          {pages.map((page) => {
            const isCurrent = page === currentPage;

            return (
              <PaginationItem key={page}>
                <Button
                  variant='outline'
                  size='icon'
                  nativeButton={false}
                  className={SEGMENT}
                  render={
                    <a
                      href={hrefOf(page)}
                      aria-current={ariaCurrentOf(isCurrent)}
                      onClick={(event) => goToPage(event, page)}
                    />
                  }
                >
                  {isCurrent && (
                    <motion.span
                      layoutId='current-page'
                      transition={travelTransition}
                      className={CURRENT_FILL}
                    />
                  )}
                  <span className='relative'>{page}</span>
                </Button>
              </PaginationItem>
            );
          })}
          {showRightEllipsis && (
            <PaginationItem>
              <span aria-hidden='true' className={ELLIPSIS_SEGMENT}>
                <EllipsisIcon />
              </span>
            </PaginationItem>
          )}
          <PaginationItem>
            <Button
              variant='outline'
              size='icon'
              nativeButton={false}
              disabled={isLastPage}
              className={cn(SEGMENT, EDGE_SEGMENT, 'rounded-e-full')}
              render={
                <a
                  href={hrefOf(nextPage)}
                  aria-label='Go to next page'
                  onClick={(event) => goToPage(event, nextPage)}
                />
              }
            >
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </LayoutGroup>
  );
}
