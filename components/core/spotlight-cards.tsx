'use client';

import {
  motion,
  type MotionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { createContext, useContext, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type SpotlightTint = 'neutral' | 'primary';

type SpotlightContextValue = {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  tint: SpotlightTint;
};

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

function useSpotlight() {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error('SpotlightCard must be used inside SpotlightCards');
  }
  return context;
}

const FOLLOW_SPRING = { stiffness: 600, damping: 50 };

const EDGE_RADIUS = 220;

const FILL_RADIUS = 320;

const TINT_COLORS = {
  neutral: {
    edge: 'color-mix(in oklab, var(--foreground) 32%, transparent)',
    fill: 'color-mix(in oklab, var(--foreground) 3%, transparent)',
  },
  primary: {
    edge: 'color-mix(in oklab, var(--primary) 60%, transparent)',
    fill: 'color-mix(in oklab, var(--primary) 5%, transparent)',
  },
} satisfies Record<SpotlightTint, { edge: string; fill: string }>;

function isMouse(event: React.PointerEvent) {
  return event.pointerType === 'mouse';
}

type PointerValues = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

function followedPointerOf(
  prefersReducedMotion: boolean | null,
  raw: PointerValues,
  smooth: PointerValues
) {
  if (prefersReducedMotion) {
    return raw;
  }
  return smooth;
}

export type SpotlightCardsProps = React.ComponentProps<'div'> & {
  tint?: SpotlightTint;
};

export function SpotlightCards({
  tint = 'primary',
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: SpotlightCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isLit, setIsLit] = useState(false);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, FOLLOW_SPRING);
  const smoothY = useSpring(rawY, FOLLOW_SPRING);
  const followed = followedPointerOf(
    prefersReducedMotion,
    { x: rawX, y: rawY },
    { x: smoothX, y: smoothY }
  );

  function follow(event: React.PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);
    if (!isMouse(event)) {
      return;
    }
    rawX.set(event.clientX);
    rawY.set(event.clientY);
    if (isLit) {
      return;
    }
    smoothX.jump(event.clientX);
    smoothY.jump(event.clientY);
    setIsLit(true);
  }

  function dim(event: React.PointerEvent<HTMLDivElement>) {
    onPointerLeave?.(event);
    setIsLit(false);
  }

  return (
    <SpotlightContext.Provider
      value={{ pointerX: followed.x, pointerY: followed.y, tint }}
    >
      <div
        data-lit={isLit}
        className={cn('group/spotlight grid gap-3', className)}
        onPointerMove={follow}
        onPointerLeave={dim}
        {...props}
      >
        {children}
      </div>
    </SpotlightContext.Provider>
  );
}

function leftOf(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }
  return element.getBoundingClientRect().left;
}

function topOf(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }
  return element.getBoundingClientRect().top;
}

const LIGHT_LAYER = [
  'pointer-events-none absolute rounded-[inherit] opacity-0',
  'transition-opacity duration-150 ease-(--ease-out-strong)',
  'group-data-[lit=true]/spotlight:opacity-100 group-data-[lit=true]/spotlight:duration-300',
].join(' ');

const EDGE_SHAPE = {
  inset: 'calc(var(--hairline) * -1)',
  padding: 'var(--hairline)',
  mask: 'linear-gradient(black, black) content-box exclude, linear-gradient(black, black)',
  WebkitMask:
    'linear-gradient(black, black) content-box xor, linear-gradient(black, black)',
};

const CARD = [
  'group/card relative isolate block rounded-xl bg-card text-card-foreground',
  'hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
  'cursor-pointer outline-none transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
].join(' ');

export type SpotlightCardProps = React.ComponentProps<'a'>;

export function SpotlightCard({
  className,
  children,
  ...props
}: SpotlightCardProps) {
  const { pointerX, pointerY, tint } = useSpotlight();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const localX = useTransform(() => {
    const pointer = pointerX.get();
    const left = leftOf(cardRef.current);
    return pointer - left;
  });
  const localY = useTransform(() => {
    const pointer = pointerY.get();
    const top = topOf(cardRef.current);
    return pointer - top;
  });
  const colors = TINT_COLORS[tint];
  const edgeLight = useMotionTemplate`radial-gradient(${EDGE_RADIUS}px circle at ${localX}px ${localY}px, ${colors.edge}, transparent)`;
  const fillLight = useMotionTemplate`radial-gradient(${FILL_RADIUS}px circle at ${localX}px ${localY}px, ${colors.fill}, transparent)`;

  return (
    <a ref={cardRef} className={cn(CARD, className)} {...props}>
      <motion.span
        aria-hidden='true'
        className={cn(LIGHT_LAYER, 'inset-0')}
        style={{ background: fillLight }}
      />
      <motion.span
        aria-hidden='true'
        className={LIGHT_LAYER}
        style={{ background: edgeLight, ...EDGE_SHAPE }}
      />
      <div className='relative flex h-full flex-col'>{children}</div>
    </a>
  );
}
