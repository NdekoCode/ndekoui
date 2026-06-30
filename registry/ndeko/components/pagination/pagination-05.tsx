'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/registry/ndeko/ui/pagination';

const FIRST_PAGE = 1;
const TOTAL_PAGES = 10;

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export default function Pagination05() {
  const [page, setPage] = useState(FIRST_PAGE);
  const previousPage = page - 1;
  const nextPage = page + 1;
  const isFirstPage = page === FIRST_PAGE;
  const isLastPage = page === TOTAL_PAGES;

  function goToPage(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: number
  ) {
    event.preventDefault();
    const nextCurrent = clampPage(target);
    setPage(nextCurrent);
  }

  return (
    <div className='flex items-center justify-between gap-3'>
      <p
        className='text-muted-foreground grow text-[13px] tabular-nums'
        aria-live='polite'
      >
        <span className='sr-only'>
          Page {page} of {TOTAL_PAGES}
        </span>
        <span className='inline-flex items-baseline' aria-hidden='true'>
          Page&nbsp;
          <MotionNumber value={page} className='text-foreground' />
          &nbsp;of&nbsp;
          <span className='text-foreground'>{TOTAL_PAGES}</span>
        </span>
      </p>
      <Pagination className='mx-0 w-auto'>
        <PaginationContent className='gap-3'>
          <PaginationItem>
            <PaginationLink
              href={hrefOf(previousPage)}
              size='default'
              isDisabled={isFirstPage}
              onClick={(event) => goToPage(event, previousPage)}
              className='rounded-full'
            >
              Previous
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href={hrefOf(nextPage)}
              size='default'
              isDisabled={isLastPage}
              onClick={(event) => goToPage(event, nextPage)}
              className='rounded-full'
            >
              Next
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
