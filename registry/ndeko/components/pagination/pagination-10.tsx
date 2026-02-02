'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

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
const DIGIT_SHIFT_PX = 8;

const ROWS_PER_PAGE = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type PageState = { current: number; direction: number };

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

function rangeLabelOf(page: number, rowsPerPage: number) {
  const pagesBefore = page - 1;
  const rowsBefore = pagesBefore * rowsPerPage;
  const firstRow = rowsBefore + 1;
  const lastRowOfPage = page * rowsPerPage;
  const lastRow = Math.min(TOTAL_ROWS, lastRowOfPage);
  return `${firstRow}-${lastRow}`;
}

export default function Pagination10() {
  const id = useId();
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState<PageState>({
    current: FIRST_PAGE,
    direction: 1,
  });
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const totalPages = Math.ceil(TOTAL_ROWS / rowsPerPage);
  const rangeLabel = rangeLabelOf(page.current, rowsPerPage);
  const previousPage = page.current - 1;
  const nextPage = page.current + 1;
  const isFirstPage = page.current === FIRST_PAGE;
  const isLastPage = page.current === totalPages;

  function showPage(target: number) {
    const atLeastFirst = Math.max(FIRST_PAGE, target);
    const nextCurrent = Math.min(totalPages, atLeastFirst);
    setPage((previous) => {
      const direction = Math.sign(nextCurrent - previous.current);
      return { current: nextCurrent, direction };
    });
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
    <div className='flex items-center justify-between gap-8'>
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
          <span className='text-foreground relative inline-flex'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={page.direction}
            >
              <motion.span
                key={rangeLabel}
                className='inline-flex'
                custom={page.direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {rangeLabel}
              </motion.span>
            </AnimatePresence>
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
