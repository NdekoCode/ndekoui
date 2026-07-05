'use client';
import {
  motion,
  type MotionValue,
  useMotionValue,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  type FocusEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const FOCUS_INSET = 24;

export type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
  trackClassName?: string;
  containerRef?: RefObject<HTMLElement | null>;
  showProgress?: boolean;
  'aria-label'?: string;
};

function trackOffsetOf(
  prefersReducedMotion: boolean | null,
  directedTravel: number
) {
  if (prefersReducedMotion) {
    return 0;
  }
  return -directedTravel;
}

function progressOf(
  prefersReducedMotion: boolean | null,
  rowProgress: MotionValue<number>,
  pinnedProgress: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return rowProgress;
  }
  return pinnedProgress;
}

function directionSignOf(element: HTMLElement) {
  const { direction } = getComputedStyle(element);
  const isRightToLeft = direction === 'rtl';
  if (isRightToLeft) {
    return -1;
  }
  return 1;
}

function startGapOf(cardRect: DOMRect, viewportRect: DOMRect, sign: number) {
  if (sign < 0) {
    return viewportRect.right - cardRect.right;
  }
  return cardRect.left - viewportRect.left;
}

function scrollerOf(containerRef?: RefObject<HTMLElement | null>) {
  const container = containerRef?.current;
  if (container) {
    return container;
  }
  return window;
}

function viewportHeightOf(containerRef?: RefObject<HTMLElement | null>) {
  const container = containerRef?.current;
  if (container) {
    return container.clientHeight;
  }
  return window.innerHeight;
}

function useTrackGeometry(
  viewportRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>
) {
  const distance = useMotionValue(0);
  const direction = useMotionValue(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) {
      return;
    }

    const measure = () => {
      const overflow = track.offsetWidth - viewport.clientWidth;
      const travel = Math.max(0, overflow);
      const sign = directionSignOf(viewport);
      distance.set(travel);
      direction.set(sign);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [distance, direction, viewportRef, trackRef]);

  return { distance, direction };
}

export function HorizontalScroll({
  children,
  className,
  frameClassName,
  trackClassName,
  containerRef,
  showProgress = false,
  'aria-label': ariaLabel,
}: HorizontalScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { distance, direction } = useTrackGeometry(viewportRef, trackRef);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: containerRef,
    offset: ['start start', 'end end'],
  });
  const { scrollXProgress } = useScroll({ container: viewportRef });

  const x = useTransform(() => {
    const pinnedProgress = scrollYProgress.get();
    const totalTravel = distance.get();
    const sign = direction.get();
    const travel = pinnedProgress * totalTravel;
    const directedTravel = travel * sign;
    return trackOffsetOf(prefersReducedMotion, directedTravel);
  });
  const progress = progressOf(
    prefersReducedMotion,
    scrollXProgress,
    scrollYProgress
  );

  // The track is clipped, not scrolled, so the browser cannot bring a focused card into view
  // by itself: the page scrolls by the distance that moves the card in.
  const revealFocusedElement = (event: FocusEvent<HTMLDivElement>) => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (prefersReducedMotion) {
      return;
    }
    if (!section || !viewport) {
      return;
    }

    const cardRect = event.target.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const startsBefore = cardRect.left < viewportRect.left;
    const endsAfter = cardRect.right > viewportRect.right;
    const isFullyVisible = !startsBefore && !endsAfter;
    const totalTravel = distance.get();
    if (isFullyVisible || totalTravel === 0) {
      return;
    }

    const currentOffset = x.get();
    const currentTravel = Math.abs(currentOffset);
    const sign = direction.get();
    const startGap = startGapOf(cardRect, viewportRect, sign);
    const shift = startGap - FOCUS_INSET;
    const unclampedTravel = currentTravel + shift;
    const travelFromStart = Math.max(0, unclampedTravel);
    const wantedTravel = Math.min(totalTravel, travelFromStart);
    const viewportHeight = viewportHeightOf(containerRef);
    const scrollRange = section.offsetHeight - viewportHeight;
    const pixelsPerTravel = scrollRange / totalTravel;
    const travelDelta = wantedTravel - currentTravel;
    const scrollDelta = travelDelta * pixelsPerTravel;
    const scroller = scrollerOf(containerRef);
    scroller.scrollBy({ top: scrollDelta, behavior: 'instant' });
  };

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'sticky top-0 flex h-svh flex-col justify-center gap-6',
          'motion-reduce:static motion-reduce:h-auto motion-reduce:py-8',
          frameClassName
        )}
      >
        <div
          ref={viewportRef}
          onFocus={revealFocusedElement}
          className='overflow-clip motion-reduce:overflow-x-auto'
        >
          <motion.div
            ref={trackRef}
            style={{ x }}
            className={cn('flex w-max gap-4 px-6', trackClassName)}
          >
            {children}
          </motion.div>
        </div>
        {showProgress && (
          <div
            aria-hidden='true'
            className='bg-foreground/10 mx-6 h-0.5 overflow-clip rounded-full'
          >
            <motion.div
              style={{ scaleX: progress }}
              className='bg-primary h-full origin-left rtl:origin-right'
            />
          </div>
        )}
      </div>
      <motion.div
        aria-hidden='true'
        style={{ height: distance }}
        className='motion-reduce:hidden'
      />
    </section>
  );
}
