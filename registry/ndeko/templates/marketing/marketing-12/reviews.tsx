'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { REVIEWS, REVIEWS_ANCHOR, REVIEWS_SECTION, type Review } from './data';
import { Reveal } from './reveal';
import { scrollByCard, scrollToCard, useScrollEdges } from './review-scroll';
import { useDragScroll } from './use-drag-scroll';

const TOUR_INDEXES = REVIEWS.slice(1).map((_, index) => index + 1);

const TOUR_STEP_MS = 3600;

function scrollerModeOf(isDragging: boolean) {
  if (isDragging) {
    return 'cursor-grabbing snap-none select-none';
  }
  return 'cursor-grab snap-x snap-mandatory';
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <li className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex w-[16.5rem] shrink-0 snap-start flex-col justify-between gap-6 rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @sm:w-[19rem]'>
      <div className='flex flex-col gap-3'>
        <Badge variant='secondary' className='w-fit'>
          Sample review
        </Badge>
        <p className='text-[15px] leading-relaxed text-pretty'>
          {`“${review.quote}”`}
        </p>
      </div>
      <div className='flex items-center gap-3'>
        <Avatar seed={review.name} role='img' aria-label={review.name} />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate text-[13px] font-medium'>{review.name}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {review.role}
          </p>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <CompanyMark seed={review.company} size='sm' />
            <span className='truncate'>{review.company}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

export function Reviews() {
  const {
    ref: scrollerRef,
    isDragging,
    handlers,
  } = useDragScroll<HTMLDivElement>();
  const edges = useScrollEdges(scrollerRef);

  function tourTo(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    scrollToCard(scroller, index);
  }

  function backToStart() {
    tourTo(0);
  }

  function step(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    scrollByCard(scroller, direction);
  }

  const tourSteps = TOUR_INDEXES.map((index) => ({
    after: TOUR_STEP_MS,
    run: () => tourTo(index),
  }));
  const { ref, takeOver } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
    onReset: backToStart,
  });

  return (
    <section
      id={REVIEWS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal className='mx-auto max-w-6xl'>
        <SettleItem>
          <div ref={ref} className='flex flex-col gap-8'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              <div className='flex max-w-2xl flex-col gap-3'>
                <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
                  {REVIEWS_SECTION.title}
                </h2>
                <p className='text-muted-foreground text-base text-pretty'>
                  {REVIEWS_SECTION.description}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <p className='text-muted-foreground me-1 text-xs tabular-nums'>
                  <MotionNumber value={edges.index + 1} /> of {REVIEWS.length}
                </p>
                <Button
                  variant='outline'
                  size='icon'
                  aria-label='Previous review'
                  disabled={!edges.canPrev}
                  onClick={() => step(-1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  aria-label='Next review'
                  disabled={!edges.canNext}
                  onClick={() => step(1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
            <div
              ref={scrollerRef}
              role='region'
              aria-label='Sample reviews'
              tabIndex={0}
              onWheel={takeOver}
              {...handlers}
              className={cn(
                'focus-visible:ring-ring/25 relative -mx-1 [scrollbar-width:none] overflow-x-auto rounded-2xl px-1 pb-2 outline-none focus-visible:ring-[3px] [&::-webkit-scrollbar]:hidden',
                scrollerModeOf(isDragging)
              )}
            >
              <ul className='flex w-max gap-3'>
                {REVIEWS.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </ul>
            </div>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
