'use client';

import {
  animate,
  motion,
  type MotionValue,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'motion/react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type MagicCardTint = 'primary' | 'neutral';

const TINT_COLORS = {
  primary: {
    rim: 'color-mix(in oklab, var(--primary) 75%, transparent)',
    wash: 'color-mix(in oklab, var(--primary) 6%, transparent)',
  },
  neutral: {
    rim: 'color-mix(in oklab, var(--foreground) 40%, transparent)',
    wash: 'color-mix(in oklab, var(--foreground) 3%, transparent)',
  },
} satisfies Record<MagicCardTint, { rim: string; wash: string }>;

const ANGLE_SPRING = { stiffness: 320, damping: 40 };

const STRENGTH_SPRING = { stiffness: 260, damping: 36 };

const WASH_RADIUS = 280;

const WASH_IN = { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const };

const WASH_OUT = { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const };

const RIM_SHAPE: React.CSSProperties = {
  inset: 'calc(var(--hairline, 1px) * -1)',
  padding: 1,
  mask: 'linear-gradient(black, black) content-box exclude, linear-gradient(black, black)',
  WebkitMask:
    'linear-gradient(black, black) content-box xor, linear-gradient(black, black)',
};

const CARD = [
  'relative isolate rounded-xl bg-card text-card-foreground',
  'hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
].join(' ');

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

function distanceOutside(box: DOMRect, x: number, y: number) {
  const beforeLeft = box.left - x;
  const pastRight = x - box.right;
  const aboveTop = box.top - y;
  const belowBottom = y - box.bottom;
  const horizontal = Math.max(beforeLeft, 0, pastRight);
  const vertical = Math.max(aboveTop, 0, belowBottom);
  return Math.hypot(horizontal, vertical);
}

/** Conic gradients start at the top and turn clockwise, so the pointer angle is measured the same way. */
function pointerAngleOf(box: DOMRect, x: number, y: number) {
  const centreX = box.left + box.width / 2;
  const centreY = box.top + box.height / 2;
  const deltaX = x - centreX;
  const deltaY = y - centreY;
  const radians = Math.atan2(deltaY, deltaX);
  const degrees = (radians * 180) / Math.PI;
  return degrees + 90;
}

function continuousAngleOf(target: number, previous: number) {
  const difference = target - previous;
  const turns = Math.round(difference / 360);
  const wrapped = difference - turns * 360;
  return previous + wrapped;
}

function followedOf(
  prefersReducedMotion: boolean | null,
  raw: MotionValue<number>,
  smooth: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return raw;
  }
  return smooth;
}

function washTransitionOf(isInside: boolean) {
  if (isInside) {
    return WASH_IN;
  }
  return WASH_OUT;
}

function washOpacityOf(isInside: boolean) {
  if (isInside) {
    return 1;
  }
  return 0;
}

export type MagicCardProps = React.ComponentProps<'div'> & {
  tint?: MagicCardTint;
  proximity?: number;
  spread?: number;
};

export function MagicCard({
  tint = 'primary',
  proximity = 120,
  spread = 70,
  className,
  children,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const rawAngle = useMotionValue(0);
  const rawStrength = useMotionValue(0);
  const smoothAngle = useSpring(rawAngle, ANGLE_SPRING);
  const smoothStrength = useSpring(rawStrength, STRENGTH_SPRING);
  const localX = useMotionValue(0);
  const localY = useMotionValue(0);
  const washOpacity = useMotionValue(0);
  const colors = TINT_COLORS[tint];
  const angle = followedOf(prefersReducedMotion, rawAngle, smoothAngle);
  const strength = followedOf(
    prefersReducedMotion,
    rawStrength,
    smoothStrength
  );
  const spreadEnd = spread * 2;
  const rimLight = useMotionTemplate`conic-gradient(from ${angle}deg at 50% 50%, transparent 0deg, ${colors.rim} ${spread}deg, transparent ${spreadEnd}deg)`;
  const washLight = useMotionTemplate`radial-gradient(${WASH_RADIUS}px circle at ${localX}px ${localY}px, ${colors.wash}, transparent)`;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    let frame = 0;
    let isNear = false;
    let isInside = false;
    let pointerX = 0;
    let pointerY = 0;

    const setInside = (nextInside: boolean) => {
      if (nextInside === isInside) {
        return;
      }
      isInside = nextInside;
      const opacity = washOpacityOf(nextInside);
      const transition = washTransitionOf(nextInside);
      animate(washOpacity, opacity, transition);
    };

    const update = () => {
      frame = 0;
      const box = card.getBoundingClientRect();
      const distance = distanceOutside(box, pointerX, pointerY);
      const nearness = 1 - distance / proximity;
      const pointerAngle = pointerAngleOf(box, pointerX, pointerY);
      const startAngle = pointerAngle - spread;
      const previousAngle = rawAngle.get();
      const nextAngle = continuousAngleOf(startAngle, previousAngle);
      const wasDark = rawStrength.get() === 0;
      rawAngle.set(nextAngle);
      if (wasDark) {
        smoothAngle.jump(nextAngle);
      }
      const nextStrength = clamp(nearness, 0, 1);
      const cardX = pointerX - box.left;
      const cardY = pointerY - box.top;
      const isPointerInside = distance === 0;
      rawStrength.set(nextStrength);
      localX.set(cardX);
      localY.set(cardY);
      setInside(isPointerInside);
    };

    const track = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(update);
    };

    const fade = () => {
      rawStrength.set(0);
      setInside(false);
    };

    const startTracking = () => {
      window.addEventListener('pointermove', track, { passive: true });
      document.documentElement.addEventListener('pointerleave', fade);
    };

    const stopTracking = () => {
      window.removeEventListener('pointermove', track);
      document.documentElement.removeEventListener('pointerleave', fade);
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        const wasNear = isNear;
        isNear = entry.isIntersecting;
        if (isNear === wasNear) {
          return;
        }
        if (isNear) {
          startTracking();
          return;
        }
        stopTracking();
        fade();
      },
      { rootMargin: `${proximity}px` }
    );
    nearObserver.observe(card);

    return () => {
      nearObserver.disconnect();
      stopTracking();
    };
  }, [
    proximity,
    spread,
    rawAngle,
    rawStrength,
    smoothAngle,
    localX,
    localY,
    washOpacity,
  ]);

  return (
    <div ref={cardRef} className={cn(CARD, className)} {...props}>
      <motion.span
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 rounded-[inherit]'
        style={{ background: washLight, opacity: washOpacity }}
      />
      <motion.span
        aria-hidden='true'
        className='pointer-events-none absolute rounded-[inherit]'
        style={{ ...RIM_SHAPE, background: rimLight, opacity: strength }}
      />
      <div className='relative'>{children}</div>
    </div>
  );
}
