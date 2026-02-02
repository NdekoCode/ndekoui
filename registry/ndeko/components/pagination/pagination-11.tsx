'use client';

import { useState } from 'react';

import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Pagination,
  PaginationContent,
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
const TOTAL_PAGES = 10;

const PAGE_OPTIONS = Array.from({ length: TOTAL_PAGES }, (_, index) => {
  const page = index + 1;
  return { value: page, label: `Page ${page}` };
});

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export default function Pagination11() {
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const isFirstPage = currentPage === FIRST_PAGE;
  const isLastPage = currentPage === TOTAL_PAGES;

  function showPage(page: number) {
    const target = clampPage(page);
    setCurrentPage(target);
  }

  function goToPage(event: React.MouseEvent<HTMLAnchorElement>, page: number) {
    event.preventDefault();
    showPage(page);
  }

  function selectPage(page: number | null) {
    if (page === null) {
      return;
    }
    showPage(page);
  }

  return (
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
        <PaginationItem>
          <Select
            items={PAGE_OPTIONS}
            value={currentPage}
            onValueChange={selectPage}
          >
            <SelectTrigger
              aria-label='Select page'
              className='w-fit whitespace-nowrap tabular-nums'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='tabular-nums'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>
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
  );
}
