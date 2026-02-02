'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

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
const DIGIT_SHIFT_PX = 8;

const PAGE_SIZES = [
  { value: 10, label: '10 / page' },
  { value: 20, label: '20 / page' },
  { value: 50, label: '50 / page' },
  { value: 100, label: '100 / page' },
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

const TRAVEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const CURRENT_PILL =
  'bg-card hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] dark:ring-foreground/15 absolute inset-0 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)]';

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
  const [page, setPage] = useState<PageState>({
    current: FIRST_PAGE,
    direction: 1,
  });
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const travelTransition = travelTransitionOf(shouldReduceMotion);
  const layoutGroupId = useId();
  const totalPages = Math.ceil(TOTAL_RESULTS / pageSize);
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: page.current,
    totalPages,
    paginationItemsToDisplay: PAGES_TO_DISPLAY,
  });
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

  function changePageSize(size: number | null) {
    if (size === null) {
      return;
    }
    setPageSize(size);
    showPage(FIRST_PAGE);
  }

  return (
    <div className='flex items-center justify-between gap-3'>
      <p
        className='text-muted-foreground flex-1 text-[13px] whitespace-nowrap tabular-nums'
        aria-live='polite'
      >
        <span className='sr-only'>
          Page {page.current} of {totalPages}
        </span>
        <span className='inline-flex items-baseline' aria-hidden='true'>
          Page&nbsp;
          <span className='text-foreground relative inline-flex'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={page.direction}
            >
              <motion.span
                key={page.current}
                className='inline-flex'
                custom={page.direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {page.current}
              </motion.span>
            </AnimatePresence>
          </span>
          &nbsp;of&nbsp;
          <span className='text-foreground'>{totalPages}</span>
        </span>
      </p>
      <div className='grow'>
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
                const isCurrent = pageNumber === page.current;

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
