'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/registry/ndeko/lib/icons';
import { Label } from '@/registry/ndeko/ui/label';
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
const TOTAL_ROWS = 100;

const ROWS_PER_PAGE = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

function hrefOf(page: number) {
  return `#/page/${page}`;
}

function rangeOf(page: number, rowsPerPage: number) {
  const pagesBefore = page - 1;
  const rowsBefore = pagesBefore * rowsPerPage;
  const firstRow = rowsBefore + 1;
  const lastRowOfPage = page * rowsPerPage;
  const lastRow = Math.min(TOTAL_ROWS, lastRowOfPage);
  return { firstRow, lastRow };
}

export default function Pagination10() {
  const id = useId();
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(FIRST_PAGE);
  const totalPages = Math.ceil(TOTAL_ROWS / rowsPerPage);
  const range = rangeOf(page, rowsPerPage);
  const rangeLabel = `${range.firstRow}-${range.lastRow}`;
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

  function changeRowsPerPage(rows: number | null) {
    if (rows === null) {
      return;
    }
    setRowsPerPage(rows);
    showPage(FIRST_PAGE);
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-8 gap-y-3'>
      <div className='flex items-center gap-3'>
        <Label htmlFor={id} className='whitespace-nowrap'>
          Rows per page
        </Label>
        <Select
          items={ROWS_PER_PAGE}
          value={rowsPerPage}
          onValueChange={changeRowsPerPage}
        >
          <SelectTrigger id={id} className='w-fit whitespace-nowrap'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p
        className='text-muted-foreground flex grow justify-end text-[13px] whitespace-nowrap tabular-nums'
        aria-live='polite'
      >
        <span className='sr-only'>
          Rows {rangeLabel} of {TOTAL_ROWS}
        </span>
        <span className='inline-flex items-baseline' aria-hidden='true'>
          <span className='text-foreground inline-flex items-baseline'>
            <MotionNumber value={range.firstRow} />
            -
            <MotionNumber value={range.lastRow} />
          </span>
          &nbsp;of&nbsp;
          <span className='text-foreground'>{TOTAL_ROWS}</span>
        </span>
      </p>
      <Pagination className='mx-0 w-auto'>
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
              href={hrefOf(totalPages)}
              aria-label='Go to last page'
              isDisabled={isLastPage}
              onClick={(event) => goToPage(event, totalPages)}
              className='rounded-full'
            >
              <ChevronLastIcon />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
