'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type ShineTrigger = 'loop' | 'hover';

const SWEEP_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';

const BEFORE_FRAME = 'translateX(-100%)';

const AFTER_FRAME = 'translateX(250%)';

function frameShapeOf(width: number): React.CSSProperties {
  return {
    inset: 'calc(var(--hairline, 1px) * -1)',
    padding: width,
    mask: 'linear-gradient(black, black) content-box exclude, linear-gradient(black, black)',
    WebkitMask:
      'linear-gradient(black, black) content-box xor, linear-gradient(black, black)',
  };
}

function loopSweep(band: HTMLElement, sweepMs: number, restMs: number) {
  const cycleMs = sweepMs + restMs;
  const sweepShare = sweepMs / cycleMs;
  return band.animate(
    [
      { transform: BEFORE_FRAME, offset: 0, easing: SWEEP_EASE },
      { transform: AFTER_FRAME, offset: sweepShare },
      { transform: AFTER_FRAME, offset: 1 },
    ],
    { duration: cycleMs, iterations: Infinity }
  );
}

function singleSweep(band: HTMLElement, sweepMs: number) {
  return band.animate(
    [{ transform: BEFORE_FRAME }, { transform: AFTER_FRAME }],
    {
      duration: sweepMs,
      easing: SWEEP_EASE,
    }
  );
}

function isRunning(animation: Animation | null) {
  if (!animation) {
    return false;
  }
  return animation.playState === 'running';
}

function isKeyboardFocus(event: FocusEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.matches(':focus-visible');
}

export type ShineBorderProps = {
  trigger?: ShineTrigger;
  duration?: number;
  interval?: number;
  width?: number;
  className?: string;
};

export function ShineBorder({
  trigger = 'loop',
  duration = 1.4,
  interval = 4,
  width = 1,
  className,
}: ShineBorderProps) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const bandRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const sweepMs = duration * 1000;
  const restMs = interval * 1000;

  useEffect(() => {
    const band = bandRef.current;
    const isLooping = trigger === 'loop';
    if (!band || !isLooping) {
      return;
    }
    if (prefersReducedMotion) {
      return;
    }
    const animation = loopSweep(band, sweepMs, restMs);
    return () => animation.cancel();
  }, [trigger, sweepMs, restMs, prefersReducedMotion]);

  useEffect(() => {
    const band = bandRef.current;
    const owner = frameRef.current?.parentElement;
    const isHover = trigger === 'hover';
    if (!band || !owner || !isHover) {
      return;
    }
    if (prefersReducedMotion) {
      return;
    }
    let current: Animation | null = null;
    const sweep = () => {
      if (isRunning(current)) {
        return;
      }
      current = singleSweep(band, sweepMs);
    };
    const sweepForMouse = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }
      sweep();
    };
    const sweepForKeyboard = (event: FocusEvent) => {
      if (!isKeyboardFocus(event)) {
        return;
      }
      sweep();
    };
    owner.addEventListener('pointerenter', sweepForMouse);
    owner.addEventListener('focusin', sweepForKeyboard);
    return () => {
      owner.removeEventListener('pointerenter', sweepForMouse);
      owner.removeEventListener('focusin', sweepForKeyboard);
      current?.cancel();
    };
  }, [trigger, sweepMs, prefersReducedMotion]);

  return (
    <span
      ref={frameRef}
      aria-hidden='true'
      style={frameShapeOf(width)}
      className={cn(
        'text-primary pointer-events-none absolute overflow-hidden rounded-[inherit]',
        className
      )}
    >
      <span
        ref={bandRef}
        style={{ transform: BEFORE_FRAME }}
        className='absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(110deg,transparent_25%,currentColor_50%,transparent_75%)]'
      />
    </span>
  );
}
