'use client';

import { useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';

const FIRST_PAGE = 1;
const TOTAL_PAGES = 10;

export default function Pagination02() {
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
  const isFirstPage = currentPage === FIRST_PAGE;
  const isLastPage = currentPage === TOTAL_PAGES;

  function goToPreviousPage() {
    setCurrentPage((page) => {
      const previousPage = page - 1;
      return Math.max(FIRST_PAGE, previousPage);
    });
  }

  function goToNextPage() {
    setCurrentPage((page) => {
      const nextPage = page + 1;
      return Math.min(TOTAL_PAGES, nextPage);
    });
  }

  return (
    <Pagination>
      <PaginationContent className='w-full justify-between gap-3'>
        <PaginationItem>
          <Button
            variant='ghost'
            className='rounded-full ps-2.5'
            disabled={isFirstPage}
            onClick={goToPreviousPage}
          >
            <ArrowLeftIcon className='opacity-60 transition-transform duration-150 group-hover/button:-translate-x-0.5' />
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant='ghost'
            className='rounded-full pe-2.5'
            disabled={isLastPage}
            onClick={goToNextPage}
          >
            Next
            <ArrowRightIcon className='opacity-60 transition-transform duration-150 group-hover/button:translate-x-0.5' />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
