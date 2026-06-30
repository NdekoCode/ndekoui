'use client';

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type LensPosition = { x: number; y: number };

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

const SHOW = { duration: 0.18, ease: EASE_OUT_STRONG };

const HIDE = { duration: 0.12, ease: EASE_OUT_STRONG };

const GLIDE = { duration: 0.16, ease: EASE_OUT_STRONG };

const RESTING_SCALE = 0.9;

const KEY_STEP = 12;

const LARGE_KEY_STEP = 48;

const KEY_DIRECTIONS: Record<string, LensPosition> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

function stepOf(isLarge: boolean) {
  if (isLarge) {
    return LARGE_KEY_STEP;
  }
  return KEY_STEP;
}

function transitionOf(isShown: boolean) {
  if (isShown) {
    return SHOW;
  }
  return HIDE;
}

function scaleOf(isShown: boolean) {
  if (isShown) {
    return 1;
  }
  return RESTING_SCALE;
}

function opennessOf(isShown: boolean) {
  if (isShown) {
    return 1;
  }
  return 0;
}

function isMouseLike(event: React.PointerEvent) {
  return event.pointerType !== 'touch';
}

function moveTo(
  value: MotionValue<number>,
  target: number,
  shouldGlide: boolean
) {
  if (shouldGlide) {
    animate(value, target, GLIDE);
    return;
  }
  value.jump(target);
}

export type LensProps = {
  children: React.ReactNode;
  zoom?: number;
  size?: number;
  defaultPosition?: LensPosition;
  alwaysVisible?: boolean;
  label?: string;
  className?: string;
};

export function Lens({
  children,
  zoom = 2,
  size = 160,
  defaultPosition,
  alwaysVisible = false,
  label = 'Magnifier',
  className,
}: LensProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const radius = size / 2;
  const x = useMotionValue(defaultPosition?.x ?? 0);
  const y = useMotionValue(defaultPosition?.y ?? 0);
  const hasPlacedRef = useRef(defaultPosition !== undefined);
  const openness = useMotionValue(opennessOf(alwaysVisible));
  const restingRadius = radius * scaleOf(alwaysVisible);
  const shownRadius = useMotionValue(restingRadius);
  const ringScale = useMotionValue(scaleOf(alwaysVisible));
  const ringX = useTransform(x, (value) => value - radius);
  const ringY = useTransform(y, (value) => value - radius);
  const clipPath = useMotionTemplate`circle(${shownRadius}px at ${x}px ${y}px)`;
  const transformOrigin = useMotionTemplate`${x}px ${y}px`;

  useEffect(() => {
    const root = rootRef.current;
    const hasPlaced = hasPlacedRef.current;
    if (hasPlaced || !root) {
      return;
    }
    const centreX = root.clientWidth / 2;
    const centreY = root.clientHeight / 2;
    hasPlacedRef.current = true;
    x.jump(centreX);
    y.jump(centreY);
  }, [x, y]);

  function setShown(isShown: boolean) {
    const transition = transitionOf(isShown);
    const scale = scaleOf(isShown);
    const targetRadius = radius * scale;
    const targetOpenness = opennessOf(isShown);
    animate(openness, targetOpenness, transition);
    if (prefersReducedMotion) {
      shownRadius.jump(radius);
      ringScale.jump(1);
      return;
    }
    animate(shownRadius, targetRadius, transition);
    animate(ringScale, scale, transition);
  }

  function followPointer(event: React.PointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const box = root.getBoundingClientRect();
    const pointerX = event.clientX - box.left;
    const pointerY = event.clientY - box.top;
    hasPlacedRef.current = true;
    x.jump(pointerX);
    y.jump(pointerY);
  }

  function enter(event: React.PointerEvent<HTMLDivElement>) {
    if (!isMouseLike(event)) {
      return;
    }
    followPointer(event);
    setIsPointerInside(true);
    setShown(true);
  }

  function leave() {
    setIsPointerInside(false);
    const staysShown = isKeyboardActive || alwaysVisible;
    if (!staysShown) {
      setShown(false);
    }
  }

  function press(event: React.PointerEvent<HTMLDivElement>) {
    followPointer(event);
    setIsPointerInside(true);
    setShown(true);
  }

  function showForKeyboard(event: React.FocusEvent<HTMLDivElement>) {
    const isKeyboardFocus = event.currentTarget.matches(':focus-visible');
    if (!isKeyboardFocus) {
      return;
    }
    setIsKeyboardActive(true);
    setShown(true);
  }

  function hideForKeyboard() {
    setIsKeyboardActive(false);
    const staysShown = isPointerInside || alwaysVisible;
    if (!staysShown) {
      setShown(false);
    }
  }

  function moveWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (event.key === 'Escape') {
      hideForKeyboard();
      return;
    }
    const direction = KEY_DIRECTIONS[event.key];
    if (!direction || !root) {
      return;
    }
    event.preventDefault();
    const step = stepOf(event.shiftKey);
    const movedX = x.get() + direction.x * step;
    const movedY = y.get() + direction.y * step;
    const nextX = clamp(movedX, 0, root.clientWidth);
    const nextY = clamp(movedY, 0, root.clientHeight);
    const shouldGlide = !prefersReducedMotion;
    moveTo(x, nextX, shouldGlide);
    moveTo(y, nextY, shouldGlide);
    if (!isKeyboardActive) {
      setIsKeyboardActive(true);
      setShown(true);
    }
  }

  return (
    <div
      ref={rootRef}
      role='group'
      aria-roledescription='magnifier'
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={0}
      onPointerEnter={enter}
      onPointerMove={followPointer}
      onPointerLeave={leave}
      onPointerDown={press}
      onFocus={showForKeyboard}
      onBlur={hideForKeyboard}
      onKeyDown={moveWithKeys}
      className={cn(
        'focus-visible:outline-ring relative cursor-zoom-in touch-pan-y overflow-hidden rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
    >
      {children}
      <motion.div
        aria-hidden='true'
        inert
        className='pointer-events-none absolute inset-0'
        style={{ clipPath, opacity: openness }}
      >
        <motion.div
          className='size-full'
          style={{ scale: zoom, transformOrigin }}
        >
          {children}
        </motion.div>
      </motion.div>
      <motion.div
        aria-hidden='true'
        className='hairline-ring ring-card/80 pointer-events-none absolute top-0 left-0 rounded-full shadow-[0_8px_24px_-6px_rgb(0_0_0/0.3)]'
        style={{
          x: ringX,
          y: ringY,
          width: size,
          height: size,
          opacity: openness,
          scale: ringScale,
        }}
      />
      <span id={hintId} className='sr-only'>
        Use the arrow keys to move the magnifier, and Escape to hide it
      </span>
    </div>
  );
}
