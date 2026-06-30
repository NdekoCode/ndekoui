'use client';

import {
  LayoutGroup,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePagination } from '@/registry/ndeko/hooks/use-pagination';
import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/registry/ndeko/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const FIRST_PAGE = 1;
const TOTAL_RESULTS = 100;
const PAGES_TO_DISPLAY = 5;

const PAGE_SIZES = [
  { value: 10, label: '10 / page' },
  { value: 20, label: '20 / page' },
  { value: 50, label: '50 / page' },
  { value: 100, label: '100 / page' },
];

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

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export default function Pagination09() {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(FIRST_PAGE);
  const shouldReduceMotion = useReducedMotion();
  const travelTransition = travelTransitionOf(shouldReduceMotion);
  const layoutGroupId = useId();
  const totalPages = Math.ceil(TOTAL_RESULTS / pageSize);
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: page,
    totalPages,
    paginationItemsToDisplay: PAGES_TO_DISPLAY,
  });
  const previousPage = page - 1;
  const nextPage = page + 1;
  const isFirstPage = page === FIRST_PAGE;
  const isLastPage = page === totalPages;

  function showPage(target: number) {
    const atLeastFirst = Math.max(FIRST_PAGE, target);
    const nextCurrent = Math.min(totalPages, atLeastFirst);
    setPage(nextCurrent);
  }

  function goToPage(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: number
  ) {
    event.preventDefault();
    showPage(target);
  }

  function changePageSize(size: number | null) {
    if (size === null) {
      return;
    }
    setPageSize(size);
    showPage(FIRST_PAGE);
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <p
        className='text-muted-foreground flex-1 text-[13px] whitespace-nowrap tabular-nums'
        aria-live='polite'
      >
        <span className='sr-only'>
          Page {page} of {totalPages}
        </span>
        <span className='inline-flex items-baseline' aria-hidden='true'>
          Page&nbsp;
          <MotionNumber value={page} className='text-foreground' />
          &nbsp;of&nbsp;
          <MotionNumber value={totalPages} className='text-foreground' />
        </span>
      </p>
      <div className='grow max-sm:order-first max-sm:basis-full'>
        <LayoutGroup id={layoutGroupId}>
          <Pagination>
            <PaginationContent>
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
              {pages.map((pageNumber) => {
                const isCurrent = pageNumber === page;

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={hrefOf(pageNumber)}
                      aria-current={ariaCurrentOf(isCurrent)}
                      onClick={(event) => goToPage(event, pageNumber)}
                      className='rounded-full'
                    >
                      {isCurrent && (
                        <motion.span
                          layoutId='current-page'
                          transition={travelTransition}
                          className={CURRENT_PILL}
                        />
                      )}
                      <span className='relative'>{pageNumber}</span>
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
            </PaginationContent>
          </Pagination>
        </LayoutGroup>
      </div>
      <div className='flex flex-1 justify-end'>
        <Select
          items={PAGE_SIZES}
          value={pageSize}
          onValueChange={changePageSize}
        >
          <SelectTrigger
            aria-label='Results per page'
            className='w-fit whitespace-nowrap'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
