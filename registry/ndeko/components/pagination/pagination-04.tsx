'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/registry/ndeko/ui/pagination';

const FIRST_PAGE = 1;
const TOTAL_PAGES = 10;
const DIGIT_SHIFT_PX = 8;

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

function clampPage(page: number) {
  const atLeastFirst = Math.max(FIRST_PAGE, page);
  return Math.min(TOTAL_PAGES, atLeastFirst);
}

function hrefOf(page: number) {
  return `#/page/${page}`;
}

export default function Pagination04() {
  const [page, setPage] = useState<PageState>({
    current: FIRST_PAGE,
    direction: 1,
  });
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const previousPage = page.current - 1;
  const nextPage = page.current + 1;
  const isFirstPage = page.current === FIRST_PAGE;
  const isLastPage = page.current === TOTAL_PAGES;

  function goToPage(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: number
  ) {
    event.preventDefault();
    const nextCurrent = clampPage(target);
    setPage((previous) => {
      const direction = Math.sign(nextCurrent - previous.current);
      return { current: nextCurrent, direction };
    });
  }

  return (
    <Pagination>
      <PaginationContent className='gap-3'>
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
          <p
            className='text-muted-foreground text-[13px] tabular-nums'
            aria-live='polite'
          >
            <span className='sr-only'>
              Page {page.current} of {TOTAL_PAGES}
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
              <span className='text-foreground'>{TOTAL_PAGES}</span>
            </span>
          </p>
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
      </PaginationContent>
    </Pagination>
  );
}
