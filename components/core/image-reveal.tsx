'use client';
import { motion, useMotionValue, useSpring } from 'motion/react';
import {
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type ImageRevealItem = {
  id: string;
  title: string;
  meta?: ReactNode;
  src: string;
  href?: string;
};

export type ImageRevealProps = {
  items: ImageRevealItem[];
  onSelect?: (item: ImageRevealItem) => void;
  className?: string;
  rowClassName?: string;
  titleClassName?: string;
  imageClassName?: string;
};

type Preview = {
  id: string;
  source: 'pointer' | 'focus';
};

const FOLLOW_SPRING = { stiffness: 320, damping: 32, mass: 0.6 };

const FOCUS_GAP = 16;

const POINTER_GAP = 24;

const FRAME_SHOWN = { opacity: 1, scale: 1 };

const FRAME_HIDDEN = { opacity: 0, scale: 0.96 };

const FRAME_HIDDEN_STILL = { opacity: 0, scale: 1 };

const FRAME_ENTER = { duration: 0.18, ease: [0.23, 1, 0.32, 1] as const };

const FRAME_EXIT = { duration: 0.12, ease: [0.23, 1, 0.32, 1] as const };

const ROW_CLASS =
  'group/row text-foreground focus-visible:ring-ring/25 relative flex w-full items-baseline justify-between gap-6 rounded-lg px-2 py-3 text-left outline-none focus-visible:ring-[3px]';

function isKeyboardFocus(event: FocusEvent<HTMLElement>) {
  return event.currentTarget.matches(':focus-visible');
}

function frameStateOf(
  isVisible: boolean,
  prefersReducedMotion: boolean | null
) {
  if (isVisible) {
    return FRAME_SHOWN;
  }
  if (prefersReducedMotion) {
    return FRAME_HIDDEN_STILL;
  }
  return FRAME_HIDDEN;
}

/** Keeps the image beside the pointer so the hovered title stays readable, and flips it left near the right edge. */
function frameLeftOf(pointerX: number, frameWidth: number, listWidth: number) {
  const rightSide = pointerX + POINTER_GAP;
  const fitsOnTheRight = rightSide + frameWidth <= listWidth;
  if (fitsOnTheRight) {
    return rightSide;
  }
  return pointerX - POINTER_GAP - frameWidth;
}

function frameTransitionOf(isVisible: boolean) {
  if (isVisible) {
    return FRAME_ENTER;
  }
  return FRAME_EXIT;
}

function ImageReveal({
  items,
  onSelect,
  className,
  rowClassName,
  titleClassName,
  imageClassName,
}: ImageRevealProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, FOLLOW_SPRING);
  const springY = useSpring(targetY, FOLLOW_SPRING);

  const placeAt = (x: number, y: number, instantly: boolean) => {
    targetX.set(x);
    targetY.set(y);
    const shouldJump = instantly || prefersReducedMotion;
    if (shouldJump) {
      springX.jump(x);
      springY.jump(y);
    }
  };

  const followPointer = (event: PointerEvent<HTMLElement>) => {
    const list = listRef.current;
    const frame = frameRef.current;
    if (!list) {
      return;
    }
    if (!frame) {
      return;
    }
    const bounds = list.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const x = frameLeftOf(pointerX, frame.offsetWidth, bounds.width);
    const y = event.clientY - bounds.top - frame.offsetHeight / 2;
    const isHidden = preview === null;
    placeAt(x, y, isHidden);
  };

  const showForPointer = (
    item: ImageRevealItem,
    event: PointerEvent<HTMLElement>
  ) => {
    const isMouse = event.pointerType === 'mouse';
    if (!isMouse) {
      return;
    }
    followPointer(event);
    setPreview({ id: item.id, source: 'pointer' });
  };

  const moveWithPointer = (event: PointerEvent<HTMLElement>) => {
    const isFollowing = preview?.source === 'pointer';
    if (isFollowing) {
      followPointer(event);
    }
  };

  const showForFocus = (
    item: ImageRevealItem,
    event: FocusEvent<HTMLElement>
  ) => {
    if (!isKeyboardFocus(event)) {
      return;
    }
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const row = event.currentTarget;
    const x = row.offsetLeft + row.offsetWidth - frame.offsetWidth - FOCUS_GAP;
    const y = row.offsetTop + row.offsetHeight / 2 - frame.offsetHeight / 2;
    placeAt(x, y, true);
    setPreview({ id: item.id, source: 'focus' });
  };

  const hidePreview = () => {
    setPreview(null);
  };

  const isVisible = preview !== null;

  return (
    <div className={cn('relative', className)}>
      <ul
        ref={listRef}
        onPointerLeave={hidePreview}
        className='relative flex flex-col'
      >
        {items.map((item) => {
          const isPreviewed = preview?.id === item.id;
          const rowProps = {
            'data-previewed': isPreviewed,
            className: cn(ROW_CLASS, rowClassName),
            onPointerEnter: (event: PointerEvent<HTMLElement>) =>
              showForPointer(item, event),
            onPointerMove: moveWithPointer,
            onFocus: (event: FocusEvent<HTMLElement>) =>
              showForFocus(item, event),
            onBlur: hidePreview,
          };

          const content = (
            <>
              <span
                className={cn(
                  'text-2xl font-semibold text-balance sm:text-3xl',
                  titleClassName
                )}
              >
                {item.title}
              </span>
              {item.meta && (
                <span className='text-muted-foreground shrink-0 text-[13px] tabular-nums'>
                  {item.meta}
                </span>
              )}
            </>
          );

          return (
            <li key={item.id}>
              {item.href && (
                <a href={item.href} {...rowProps}>
                  {content}
                </a>
              )}
              {!item.href && (
                <button
                  type='button'
                  onClick={() => onSelect?.(item)}
                  {...rowProps}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <motion.div
        ref={frameRef}
        aria-hidden
        initial={false}
        animate={frameStateOf(isVisible, prefersReducedMotion)}
        transition={frameTransitionOf(isVisible)}
        style={{ x: springX, y: springY }}
        className={cn(
          'bg-foreground/[0.04] pointer-events-none absolute top-0 left-0 z-10 aspect-[3/2] w-60 overflow-hidden rounded-xl shadow-xl shadow-black/8 [@media(hover:none)]:hidden',
          imageClassName
        )}
      >
        {items.map((item) => {
          const isShown = preview?.id === item.id;

          return (
            // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
            <img
              key={item.id}
              src={item.src}
              alt=''
              draggable={false}
              decoding='async'
              data-shown={isShown}
              className='absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-150 data-[shown=true]:opacity-100'
            />
          );
        })}
      </motion.div>
    </div>
  );
}

export { ImageReveal };
