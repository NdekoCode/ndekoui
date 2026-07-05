'use client';
import {
  Children,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  MotionConfig,
  MotionValue,
  PanInfo,
  Transition,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
} from '@/registry/ndeko/lib/icons';

export type CarouselOrientation = 'horizontal' | 'vertical';

export type CarouselContextType = {
  index: number;
  setIndex: (newIndex: number) => void;
  itemsCount: number;
  setItemsCount: (newItemsCount: number) => void;
  disableDrag: boolean;
  orientation: CarouselOrientation;
  loop: boolean;
  slidesPerView: number | undefined;
  lastIndex: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  next: () => void;
  previous: () => void;
  autoplay: boolean;
  isAutoplayPaused: boolean;
  toggleAutoplay: () => void;
  autoplayProgress: MotionValue<number>;
};

type CarouselInteractionContextType = {
  carouselId: string;
  setHovered: (isHovered: boolean) => void;
  setKeyboardFocused: (isFocused: boolean) => void;
  setDragging: (isDragging: boolean) => void;
};

const CarouselContext = createContext<CarouselContextType | undefined>(
  undefined
);

const CarouselInteractionContext = createContext<
  CarouselInteractionContextType | undefined
>(undefined);

function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within an CarouselProvider');
  }
  return context;
}

function useCarouselInteraction() {
  const context = useContext(CarouselInteractionContext);
  if (!context) {
    throw new Error('Carousel parts must be used within a Carousel');
  }
  return context;
}

export type CarouselProviderProps = {
  children: ReactNode;
  initialIndex?: number;
  onIndexChange?: (newIndex: number) => void;
  disableDrag?: boolean;
  orientation?: CarouselOrientation;
  loop?: boolean;
  slidesPerView?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
};

const TRAVEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

function ReducedMotionConfig({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function lastIndexOf(itemsCount: number, slidesPerView: number | undefined) {
  if (slidesPerView === undefined) {
    return Math.max(0, itemsCount - 1);
  }
  const hiddenItems = itemsCount - slidesPerView;
  return Math.max(0, Math.ceil(hiddenItems));
}

function isDocumentVisible() {
  if (typeof document === 'undefined') {
    return true;
  }
  return document.visibilityState === 'visible';
}

function useDocumentVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(isDocumentVisible());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true,
    });
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

function CarouselProvider({
  children,
  initialIndex = 0,
  onIndexChange,
  disableDrag = false,
  orientation = 'horizontal',
  loop = false,
  slidesPerView,
  autoplay = false,
  autoplayDelay = 5000,
}: CarouselProviderProps) {
  const [index, setIndex] = useState<number>(initialIndex);
  const [syncedInitialIndex, setSyncedInitialIndex] =
    useState<number>(initialIndex);
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isHovered, setHovered] = useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const isPageVisible = useDocumentVisibility();
  const prefersReducedMotion = usePrefersReducedMotion();
  const autoplayProgress = useMotionValue(0);
  const carouselId = useId();

  const hasNewInitialIndex = initialIndex !== syncedInitialIndex;
  if (hasNewInitialIndex) {
    setSyncedInitialIndex(initialIndex);
    setIndex(initialIndex);
  }

  const handleSetIndex = (newIndex: number) => {
    setIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const lastIndex = lastIndexOf(itemsCount, slidesPerView);
  const hasPrevious = index > 0;
  const hasNext = index < lastIndex;
  const canGoPrevious = loop || hasPrevious;
  const canGoNext = loop || hasNext;

  const next = () => {
    if (hasNext) {
      handleSetIndex(index + 1);
      return;
    }
    if (loop) {
      handleSetIndex(0);
    }
  };

  const previous = () => {
    if (hasPrevious) {
      handleSetIndex(index - 1);
      return;
    }
    if (loop) {
      handleSetIndex(lastIndex);
    }
  };

  const hasSeveralPositions = lastIndex > 0;
  const isMotionAllowed = !prefersReducedMotion;
  const isAutoplayAvailable = autoplay && isMotionAllowed;
  const isAutoplayOn = isAutoplayAvailable && hasSeveralPositions;
  const isUserPlaying = !isAutoplayPaused;
  const isUndisturbed = !isHovered && !isKeyboardFocused;
  const isIdle = isUndisturbed && !isDragging;
  const isAutoplayRunning = isAutoplayOn && isUserPlaying && isIdle;
  const shouldAdvance = isAutoplayRunning && isPageVisible;

  useEffect(() => {
    autoplayProgress.jump(0);
  }, [index, autoplayProgress]);

  useEffect(() => {
    if (!shouldAdvance) {
      return;
    }
    const remaining = 1 - autoplayProgress.get();
    const advance = () => {
      if (index < lastIndex) {
        handleSetIndex(index + 1);
        return;
      }
      handleSetIndex(0);
    };
    const controls = animate(autoplayProgress, 1, {
      duration: (remaining * autoplayDelay) / 1000,
      ease: 'linear',
      onComplete: advance,
    });
    return () => controls.stop();
    // handleSetIndex is recreated on each render; the timer restarts only when its inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAdvance, index, lastIndex, autoplayDelay, autoplayProgress]);

  const toggleAutoplay = () => {
    setIsAutoplayPaused(!isAutoplayPaused);
  };

  return (
    <CarouselContext.Provider
      value={{
        index,
        setIndex: handleSetIndex,
        itemsCount,
        setItemsCount,
        disableDrag,
        orientation,
        loop,
        slidesPerView,
        lastIndex,
        canGoNext,
        canGoPrevious,
        next,
        previous,
        autoplay: isAutoplayAvailable,
        isAutoplayPaused,
        toggleAutoplay,
        autoplayProgress,
      }}
    >
      <CarouselInteractionContext.Provider
        value={{ carouselId, setHovered, setKeyboardFocused, setDragging }}
      >
        {children}
      </CarouselInteractionContext.Provider>
    </CarouselContext.Provider>
  );
}

export type CarouselProps = {
  children: ReactNode;
  className?: string;
  initialIndex?: number;
  index?: number;
  onIndexChange?: (newIndex: number) => void;
  disableDrag?: boolean;
  orientation?: CarouselOrientation;
  loop?: boolean;
  slidesPerView?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  'aria-label'?: string;
};

function isEditableTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const isField = target.matches('input, textarea, select');
  return isField || target.isContentEditable;
}

function stepOfKey(key: string, orientation: CarouselOrientation) {
  const isVertical = orientation === 'vertical';
  if (isVertical) {
    if (key === 'ArrowUp') {
      return -1;
    }
    if (key === 'ArrowDown') {
      return 1;
    }
    return 0;
  }
  if (key === 'ArrowLeft') {
    return -1;
  }
  if (key === 'ArrowRight') {
    return 1;
  }
  return 0;
}

type CarouselRootProps = {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
};

function CarouselRoot({
  children,
  className,
  'aria-label': ariaLabel,
}: CarouselRootProps) {
  const { orientation, next, previous } = useCarousel();
  const { setHovered, setKeyboardFocused } = useCarouselInteraction();

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    const isMouse = event.pointerType === 'mouse';
    if (isMouse) {
      setHovered(true);
    }
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isKeyboardFocus) {
      setKeyboardFocused(true);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    const staysInside = event.currentTarget.contains(nextTarget);
    if (!staysInside) {
      setKeyboardFocused(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(event.target)) {
      return;
    }
    const step = stepOfKey(event.key, orientation);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    if (step > 0) {
      next();
      return;
    }
    previous();
  };

  return (
    <div
      role='region'
      aria-roledescription='carousel'
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn('group/hover relative', className)}
    >
      <div className='overflow-hidden'>{children}</div>
    </div>
  );
}

function Carousel({
  children,
  className,
  initialIndex = 0,
  index: externalIndex,
  onIndexChange,
  disableDrag = false,
  orientation = 'horizontal',
  loop = false,
  slidesPerView,
  autoplay = false,
  autoplayDelay = 5000,
  'aria-label': ariaLabel,
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState<number>(initialIndex);
  const isControlled = externalIndex !== undefined;
  const currentIndex = isControlled ? externalIndex : internalIndex;

  const handleIndexChange = (newIndex: number) => {
    if (!isControlled) {
      setInternalIndex(newIndex);
    }
    onIndexChange?.(newIndex);
  };

  return (
    <CarouselProvider
      initialIndex={currentIndex}
      onIndexChange={handleIndexChange}
      disableDrag={disableDrag}
      orientation={orientation}
      loop={loop}
      slidesPerView={slidesPerView}
      autoplay={autoplay}
      autoplayDelay={autoplayDelay}
    >
      <ReducedMotionConfig>
        <CarouselRoot className={className} aria-label={ariaLabel}>
          {children}
        </CarouselRoot>
      </ReducedMotionConfig>
    </CarouselProvider>
  );
}

const NAVIGATION_BUTTON =
  'bg-card hairline-ring ring-border pointer-events-auto h-fit w-fit rounded-full p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[opacity,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]';

const NAVIGATION_ICON = 'stroke-foreground';

const NAVIGATION_LAYOUT: Record<CarouselOrientation, string> = {
  horizontal:
    'pointer-events-none absolute top-1/2 left-[-12.5%] flex w-[125%] -translate-y-1/2 justify-between px-2',
  vertical:
    'pointer-events-none absolute inset-y-2 left-1/2 flex -translate-x-1/2 flex-col items-center justify-between',
};

function navigationVisibilityOf(alwaysShow?: boolean) {
  if (alwaysShow) {
    return 'opacity-100 disabled:opacity-40';
  }
  return 'opacity-0 group-hover/hover:opacity-100 group-hover/hover:disabled:opacity-40';
}

function indicatorToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground';
  }
  return 'bg-foreground/20';
}

export type CarouselNavigationProps = {
  className?: string;
  classNameButton?: string;
  alwaysShow?: boolean;
};

function CarouselNavigation({
  className,
  classNameButton,
  alwaysShow,
}: CarouselNavigationProps) {
  const { orientation, canGoNext, canGoPrevious, next, previous } =
    useCarousel();
  const visibility = navigationVisibilityOf(alwaysShow);
  const isVertical = orientation === 'vertical';

  return (
    <div className={cn(NAVIGATION_LAYOUT[orientation], className)}>
      <button
        type='button'
        aria-label='Previous slide'
        className={cn(NAVIGATION_BUTTON, visibility, classNameButton)}
        disabled={!canGoPrevious}
        onClick={previous}
      >
        {isVertical && <ChevronUpIcon className={NAVIGATION_ICON} size={16} />}
        {!isVertical && (
          <ChevronLeftIcon className={NAVIGATION_ICON} size={16} />
        )}
      </button>
      <button
        type='button'
        className={cn(NAVIGATION_BUTTON, visibility, classNameButton)}
        aria-label='Next slide'
        disabled={!canGoNext}
        onClick={next}
      >
        {isVertical && (
          <ChevronDownIcon className={NAVIGATION_ICON} size={16} />
        )}
        {!isVertical && (
          <ChevronRightIcon className={NAVIGATION_ICON} size={16} />
        )}
      </button>
    </div>
  );
}

export type CarouselIndicatorVariant = 'dots' | 'travel';

export type CarouselIndicatorProps = {
  className?: string;
  classNameButton?: string;
  variant?: CarouselIndicatorVariant;
};

function positionsOf(itemsCount: number, lastIndex: number) {
  if (itemsCount === 0) {
    return 0;
  }
  return lastIndex + 1;
}

const INDICATOR_LAYOUT: Record<CarouselOrientation, string> = {
  horizontal: 'absolute bottom-0 z-10 flex w-full items-center justify-center',
  vertical: 'absolute inset-y-0 right-0 z-10 flex items-center justify-center',
};

const INDICATOR_ROW: Record<CarouselOrientation, string> = {
  horizontal: 'flex space-x-2',
  vertical: 'flex flex-col space-y-2',
};

function CarouselIndicator({
  className,
  classNameButton,
  variant = 'dots',
}: CarouselIndicatorProps) {
  const { index, itemsCount, lastIndex, setIndex, orientation } = useCarousel();
  const { carouselId } = useCarouselInteraction();
  const positions = positionsOf(itemsCount, lastIndex);
  const isTravel = variant === 'travel';

  return (
    <div className={cn(INDICATOR_LAYOUT[orientation], className)}>
      <div className={INDICATOR_ROW[orientation]}>
        {Array.from({ length: positions }, (_, i) => {
          const isActive = index === i;
          const showsTravellingDot = isTravel && isActive;
          let tone = indicatorToneOf(isActive);
          if (isTravel) {
            tone = indicatorToneOf(false);
          }

          return (
            <button
              key={i}
              type='button'
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive}
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-2 w-2 rounded-full transition-opacity duration-300',
                tone,
                classNameButton
              )}
            >
              {showsTravellingDot && (
                <motion.span
                  layoutId={`carousel-indicator-${carouselId}`}
                  transition={TRAVEL_TRANSITION}
                  className='bg-foreground absolute inset-0 rounded-full'
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type CarouselProgressType = 'position' | 'autoplay';

export type CarouselProgressProps = {
  className?: string;
  classNameBar?: string;
  type?: CarouselProgressType;
};

const PROGRESS_TRACK =
  'bg-foreground/10 relative h-1 w-full overflow-hidden rounded-full';

const PROGRESS_BAR = 'bg-foreground absolute inset-0 rounded-full';

function positionShiftOf(index: number, lastIndex: number) {
  const positions = lastIndex + 1;
  const reached = (index + 1) / positions;
  return (reached - 1) * 100;
}

function progressShiftOf(progress: number) {
  return `${(progress - 1) * 100}%`;
}

function AutoplayProgress({ className, classNameBar }: CarouselProgressProps) {
  const { autoplayProgress } = useCarousel();
  const x = useTransform(autoplayProgress, progressShiftOf);

  return (
    <div aria-hidden className={cn(PROGRESS_TRACK, className)}>
      <motion.div style={{ x }} className={cn(PROGRESS_BAR, classNameBar)} />
    </div>
  );
}

function CarouselProgress({
  className,
  classNameBar,
  type = 'position',
}: CarouselProgressProps) {
  const { index, lastIndex, autoplay } = useCarousel();
  const isAutoplayType = type === 'autoplay';

  if (isAutoplayType) {
    if (!autoplay) {
      return null;
    }
    return (
      <AutoplayProgress className={className} classNameBar={classNameBar} />
    );
  }

  const shift = positionShiftOf(index, lastIndex);

  return (
    <div
      role='progressbar'
      aria-label='Slide position'
      aria-valuemin={1}
      aria-valuemax={lastIndex + 1}
      aria-valuenow={index + 1}
      className={cn(PROGRESS_TRACK, className)}
    >
      <div
        style={{ transform: `translateX(${shift}%)` }}
        className={cn(
          PROGRESS_BAR,
          'transition-transform duration-300 ease-(--ease-out-strong)',
          classNameBar
        )}
      />
    </div>
  );
}

const SWAP_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const SWAP_HIDDEN = { opacity: 0, scale: 0.6, filter: 'blur(2px)' };

const SWAP_SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' };

function autoplayLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Play slideshow';
  }
  return 'Pause slideshow';
}

export type CarouselAutoplayToggleProps = {
  className?: string;
};

function CarouselAutoplayToggle({ className }: CarouselAutoplayToggleProps) {
  const { autoplay, isAutoplayPaused, toggleAutoplay } = useCarousel();

  if (!autoplay) {
    return null;
  }

  return (
    <button
      type='button'
      aria-label={autoplayLabelOf(isAutoplayPaused)}
      onClick={toggleAutoplay}
      className={cn(
        'bg-card hairline-ring ring-border text-foreground focus-visible:ring-ring focus-visible:ring-offset-background grid size-8 place-items-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-transform duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]',
        className
      )}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={String(isAutoplayPaused)}
          initial={SWAP_HIDDEN}
          animate={SWAP_SHOWN}
          exit={SWAP_HIDDEN}
          transition={SWAP_TRANSITION}
          className='grid place-items-center'
        >
          {isAutoplayPaused && <PlayIcon className='size-4' />}
          {!isAutoplayPaused && <PauseIcon className='size-4' />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export type CarouselThumbnailsProps = {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
};

const THUMBNAILS_LAYOUT: Record<CarouselOrientation, string> = {
  horizontal: 'flex-row overflow-x-auto',
  vertical: 'flex-col overflow-y-auto',
};

function scrollBehaviorOf(
  prefersReducedMotion: boolean | null
): ScrollBehavior {
  if (prefersReducedMotion) {
    return 'auto';
  }
  return 'smooth';
}

function scrollTargetOf(
  start: number,
  size: number,
  viewStart: number,
  viewSize: number
) {
  const end = start + size;
  const viewEnd = viewStart + viewSize;
  if (start < viewStart) {
    return start;
  }
  if (end > viewEnd) {
    return end - viewSize;
  }
  return null;
}

function revealThumbnail(
  list: HTMLElement,
  thumbnail: HTMLElement,
  orientation: CarouselOrientation,
  behavior: ScrollBehavior
) {
  if (orientation === 'vertical') {
    const top = scrollTargetOf(
      thumbnail.offsetTop,
      thumbnail.offsetHeight,
      list.scrollTop,
      list.clientHeight
    );
    if (top !== null) {
      list.scrollTo({ top, behavior });
    }
    return;
  }
  const left = scrollTargetOf(
    thumbnail.offsetLeft,
    thumbnail.offsetWidth,
    list.scrollLeft,
    list.clientWidth
  );
  if (left !== null) {
    list.scrollTo({ left, behavior });
  }
}

function CarouselThumbnails({
  children,
  className,
  'aria-label': ariaLabel = 'Slides',
}: CarouselThumbnailsProps) {
  const { index, orientation } = useCarousel();
  const listRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const thumbnail = list.querySelector<HTMLElement>(
      `[data-thumbnail-index="${index}"]`
    );
    if (!thumbnail) {
      return;
    }
    const behavior = scrollBehaviorOf(prefersReducedMotion);
    revealThumbnail(list, thumbnail, orientation, behavior);
  }, [index, orientation, prefersReducedMotion]);

  return (
    <motion.div
      ref={listRef}
      layoutScroll
      role='group'
      aria-label={ariaLabel}
      className={cn(
        'relative flex [scrollbar-width:none] gap-2 p-1',
        THUMBNAILS_LAYOUT[orientation],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export type CarouselThumbnailProps = {
  index: number;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
};

function CarouselThumbnail({
  index: thumbnailIndex,
  children,
  className,
  'aria-label': ariaLabel,
}: CarouselThumbnailProps) {
  const { index, setIndex } = useCarousel();
  const { carouselId } = useCarouselInteraction();
  const isActive = thumbnailIndex === index;
  const label = ariaLabel ?? `Go to slide ${thumbnailIndex + 1}`;

  return (
    <button
      type='button'
      data-thumbnail-index={thumbnailIndex}
      data-active={isActive}
      aria-label={label}
      aria-current={isActive}
      onClick={() => setIndex(thumbnailIndex)}
      className={cn(
        'focus-visible:ring-ring/40 relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg opacity-60 transition-opacity duration-150 outline-none hover:opacity-100 focus-visible:ring-[3px] data-[active=true]:opacity-100',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.span
          aria-hidden
          layoutId={`carousel-thumbnail-${carouselId}`}
          transition={TRAVEL_TRANSITION}
          className='ring-primary pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset'
        />
      )}
    </button>
  );
}

export type CarouselContentProps = {
  children: ReactNode;
  className?: string;
  transition?: Transition;
};

const DEFAULT_TRANSITION: Transition = {
  damping: 18,
  stiffness: 90,
  type: 'spring',
  duration: 0.2,
};

const DRAG_THRESHOLD = 10;

const DRAG_CONSTRAINTS = { left: 0, right: 0, top: 0, bottom: 0 };

function trackTargetOf(orientation: CarouselOrientation, offset: number) {
  if (orientation === 'vertical') {
    return { translateY: `-${offset}%` };
  }
  return { translateX: `-${offset}%` };
}

function dragOffsetOf(info: PanInfo, orientation: CarouselOrientation) {
  if (orientation === 'vertical') {
    return info.offset.y;
  }
  return info.offset.x;
}

function CarouselContent({
  children,
  className,
  transition,
}: CarouselContentProps) {
  const {
    index,
    setItemsCount,
    disableDrag,
    orientation,
    slidesPerView,
    lastIndex,
    next,
    previous,
  } = useCarousel();
  const { setDragging } = useCarouselInteraction();
  const [visibleItemsCount, setVisibleItemsCount] = useState(1);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsLength = Children.count(children);
  const isVertical = orientation === 'vertical';
  const isDraggable = !disableDrag;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const options = {
      root: containerRef.current,
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleCount = entries.filter(
        (entry) => entry.isIntersecting
      ).length;
      setVisibleItemsCount(visibleCount);
    }, options);

    const childNodes = containerRef.current.children;
    Array.from(childNodes).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [children, setItemsCount]);

  useEffect(() => {
    if (!itemsLength) {
      return;
    }

    setItemsCount(itemsLength);
  }, [itemsLength, setItemsCount]);

  const onDragEnd = (
    _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
    info: PanInfo
  ) => {
    setDragging(false);
    const offset = dragOffsetOf(info, orientation);

    if (offset <= -DRAG_THRESHOLD) {
      next();
    } else if (offset >= DRAG_THRESHOLD) {
      previous();
    }
  };

  let offset = index * (100 / visibleItemsCount);
  if (slidesPerView !== undefined) {
    const containedIndex = Math.min(index, lastIndex);
    const furthestStart = Math.max(0, itemsLength - slidesPerView);
    const start = Math.min(containedIndex, furthestStart);
    offset = start * (100 / slidesPerView);
  }

  let dragAxis: 'x' | 'y' | false = false;
  if (isDraggable) {
    dragAxis = 'x';
  }
  if (isDraggable && isVertical) {
    dragAxis = 'y';
  }

  let dragStyle = {};
  if (dragAxis === 'x') {
    dragStyle = { x: dragX };
  }
  if (dragAxis === 'y') {
    dragStyle = { y: dragY };
  }

  let dragProps = {};
  if (isDraggable) {
    dragProps = {
      dragConstraints: DRAG_CONSTRAINTS,
      dragMomentum: false,
      onDragStart: () => setDragging(true),
      onDragEnd,
    };
  }

  return (
    <motion.div
      drag={dragAxis}
      {...dragProps}
      style={dragStyle}
      animate={trackTargetOf(orientation, offset)}
      transition={transition || DEFAULT_TRANSITION}
      className={cn(
        'flex items-center',
        isVertical && 'flex-col items-stretch',
        !disableDrag && 'cursor-grab active:cursor-grabbing',
        className
      )}
      ref={containerRef}
    >
      {children}
    </motion.div>
  );
}

export type CarouselItemProps = {
  children: ReactNode;
  className?: string;
};

function basisOf(slidesPerView: number | undefined) {
  if (slidesPerView === undefined) {
    return undefined;
  }
  return { flexBasis: `${100 / slidesPerView}%` };
}

function CarouselItem({ children, className }: CarouselItemProps) {
  const { slidesPerView, orientation } = useCarousel();
  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      style={basisOf(slidesPerView)}
      className={cn(
        'w-full min-w-0 shrink-0 grow-0 overflow-hidden',
        isVertical && 'min-h-0',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export {
  Carousel,
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselNavigation,
  CarouselIndicator,
  CarouselItem,
  CarouselProgress,
  CarouselThumbnail,
  CarouselThumbnails,
  useCarousel,
};
