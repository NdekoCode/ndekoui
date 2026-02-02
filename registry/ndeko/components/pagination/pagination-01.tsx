'use client';

import { useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
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

export default function Pagination01() {
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
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
      <PaginationContent className='w-full justify-between gap-3'>
        <PaginationItem>
          <PaginationPrevious
            href={hrefOf(previousPage)}
            isDisabled={isFirstPage}
            onClick={(event) => goToPage(event, previousPage)}
            className='rounded-full'
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href={hrefOf(nextPage)}
            isDisabled={isLastPage}
            onClick={(event) => goToPage(event, nextPage)}
            className='rounded-full'
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
