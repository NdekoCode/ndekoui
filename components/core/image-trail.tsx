'use client';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ImageTrailImage = {
  src: string;
};

export type ImageTrailProps = {
  images: ImageTrailImage[];
  children?: ReactNode;
  className?: string;
  imageClassName?: string;
  distance?: number;
  maxVisible?: number;
  lifetime?: number;
  persist?: boolean;
};

type TrailState = {
  lastX: number;
  lastY: number;
  hasStarted: boolean;
  spawnCount: number;
};

const EASE_OUT_STRONG = 'cubic-bezier(0.23, 1, 0.32, 1)';

const ENTER_DURATION = 240;

const EXIT_DURATION = 200;

const ENTER_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.9)' },
  { opacity: 1, transform: 'scale(1)' },
];

const EXIT_KEYFRAMES: Keyframe[] = [{ opacity: 0, transform: 'scale(0.82)' }];

function slotCountOf(maxVisible: number) {
  return maxVisible * 2;
}

function hasMovedFarEnough(
  state: TrailState,
  x: number,
  y: number,
  distance: number
) {
  if (!state.hasStarted) {
    return true;
  }
  const travelled = Math.hypot(x - state.lastX, y - state.lastY);
  return travelled >= distance;
}

function retire(slot: HTMLElement | undefined) {
  if (!slot) {
    return;
  }
  slot.animate(EXIT_KEYFRAMES, {
    duration: EXIT_DURATION,
    easing: EASE_OUT_STRONG,
    fill: 'forwards',
  });
}

function swapSource(picture: HTMLImageElement, src: string) {
  const isSameSource = picture.getAttribute('src') === src;
  if (isSameSource) {
    return;
  }
  picture.src = src;
}

function settle(slot: HTMLElement) {
  slot.getAnimations().forEach((animation) => animation.cancel());
}

function ImageTrail({
  images,
  children,
  className,
  imageClassName,
  distance = 80,
  maxVisible = 5,
  lifetime = 900,
  persist = false,
}: ImageTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<Array<HTMLDivElement | null>>([]);
  const prefersReducedMotion = useReducedMotion();
  const slotCount = slotCountOf(maxVisible);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (prefersReducedMotion) {
      return;
    }
    const hasImages = images.length > 0;
    if (!hasImages) {
      return;
    }

    const state: TrailState = {
      lastX: 0,
      lastY: 0,
      hasStarted: false,
      spawnCount: 0,
    };
    const timers = new Set<number>();
    const slots = slotsRef.current;

    images.forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });

    const slotAt = (spawnIndex: number) => {
      const slotIndex = spawnIndex % slotCount;
      return slots[slotIndex] ?? undefined;
    };

    const scheduleRetire = (slot: HTMLElement, spawnIndex: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        const isSameSpawn = slot.dataset.spawn === String(spawnIndex);
        if (isSameSpawn) {
          retire(slot);
        }
      }, lifetime);
      timers.add(timer);
    };

    const spawn = (x: number, y: number) => {
      const spawnIndex = state.spawnCount;
      const slot = slotAt(spawnIndex);
      if (!slot) {
        return;
      }
      const image = images[spawnIndex % images.length];
      const picture = slot.firstElementChild;
      settle(slot);
      if (picture instanceof HTMLImageElement) {
        swapSource(picture, image.src);
      }
      slot.dataset.spawn = String(spawnIndex);
      slot.style.translate = `${x}px ${y}px`;
      slot.style.zIndex = String(spawnIndex + 1);
      slot.animate(ENTER_KEYFRAMES, {
        duration: ENTER_DURATION,
        easing: EASE_OUT_STRONG,
        fill: 'forwards',
      });
      const hasPushedOut = spawnIndex >= maxVisible;
      if (hasPushedOut) {
        const pushedOut = slotAt(spawnIndex - maxVisible);
        retire(pushedOut);
      }
      if (!persist) {
        scheduleRetire(slot, spawnIndex);
      }
      state.spawnCount = spawnIndex + 1;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }
      const bounds = container.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const shouldSpawn = hasMovedFarEnough(state, x, y, distance);
      if (!shouldSpawn) {
        return;
      }
      state.lastX = x;
      state.lastY = y;
      state.hasStarted = true;
      spawn(x, y);
    };

    const handlePointerLeave = () => {
      state.hasStarted = false;
    };

    container.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    container.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      timers.forEach((timer) => window.clearTimeout(timer));
      slots.forEach((slot) => {
        if (slot) {
          settle(slot);
        }
      });
    };
  }, [
    images,
    distance,
    maxVisible,
    lifetime,
    persist,
    slotCount,
    prefersReducedMotion,
  ]);

  const slotIndexes = Array.from({ length: slotCount }, (_, index) => index);

  return (
    <div
      ref={containerRef}
      className={cn('relative isolate overflow-hidden', className)}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 overflow-hidden'
      >
        {slotIndexes.map((slotIndex) => (
          <div
            key={slotIndex}
            ref={(element) => {
              slotsRef.current[slotIndex] = element;
            }}
            className='absolute top-0 left-0 opacity-0'
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist */}
            <img
              alt=''
              draggable={false}
              decoding='async'
              className={cn(
                'h-40 w-32 max-w-none -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover shadow-[0_1px_2px_rgb(0_0_0/0.08)]',
                imageClassName
              )}
            />
          </div>
        ))}
      </div>
      <div className='relative z-10'>{children}</div>
    </div>
  );
}

export { ImageTrail };
