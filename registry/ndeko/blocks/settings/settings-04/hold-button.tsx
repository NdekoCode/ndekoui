'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { HOLD_MS } from './session';

type Timer = ReturnType<typeof setTimeout>;

const HOLDING_LABEL = 'Keep holding';

/** The fill crosses the pill on a transform; reduced motion keeps the same two seconds as a fade. */
function fillClassOf(isFilling: boolean, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return cn(
      'opacity-0 transition-opacity duration-200',
      isFilling && 'opacity-100 duration-[2000ms] ease-linear'
    );
  }
  return cn(
    'origin-left scale-x-0 transition-[scale] duration-200 ease-(--ease-out-strong) rtl:origin-right',
    isFilling && 'scale-x-100 duration-[2000ms] ease-linear'
  );
}

function labelOf(isFilling: boolean, label: string) {
  if (isFilling) {
    return HOLDING_LABEL;
  }
  return label;
}

function isHoldKey(event: React.KeyboardEvent) {
  const isSpace = event.key === ' ';
  const isEnter = event.key === 'Enter';
  return isSpace || isEnter;
}

function demoPressOf(isDemoHolding: boolean) {
  if (isDemoHolding) {
    return 'scale-[0.97]';
  }
  return undefined;
}

type HoldButtonProps = {
  label: string;
  /** Read after the label: what holding does, and for how long. */
  hint: string;
  /** The demonstration holds the button down: the fill runs as it would under a finger. */
  isDemoHolding: boolean;
  onComplete: () => void;
};

/** A destructive action that asks for intent: two seconds pressed fill the pill, a release drains it in 200ms. */
export function HoldButton({
  label,
  hint,
  isDemoHolding,
  onComplete,
}: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timer = useRef<Timer | null>(null);
  const latestComplete = useRef(onComplete);
  const hintId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isFilling = isHolding || isDemoHolding;
  const fillClass = fillClassOf(isFilling, shouldReduceMotion);
  const shownLabel = labelOf(isFilling, label);

  useEffect(() => {
    latestComplete.current = onComplete;
  });

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function startHold() {
    if (timer.current) {
      return;
    }
    setIsHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setIsHolding(false);
      latestComplete.current();
    }, HOLD_MS);
  }

  function stopHold() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setIsHolding(false);
  }

  function pressPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const isMainButton = event.button === 0;
    if (isMainButton) {
      startHold();
    }
  }

  function pressKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(event)) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) {
      startHold();
    }
  }

  function releaseKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (isHoldKey(event)) {
      stopHold();
    }
  }

  function keepMenuAway(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return (
    <>
      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-describedby={hintId}
        onPointerDown={pressPointer}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={pressKey}
        onKeyUp={releaseKey}
        onBlur={stopHold}
        onContextMenu={keepMenuAway}
        className={cn(
          'text-destructive-ink touch-none overflow-hidden select-none [-webkit-touch-callout:none]',
          demoPressOf(isDemoHolding)
        )}
      >
        <span
          aria-hidden='true'
          className={cn('bg-destructive/15 absolute inset-0', fillClass)}
        />
        <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
          <Swap swapKey={shownLabel}>{shownLabel}</Swap>
        </AnimatedSize>
      </Button>
      <span id={hintId} className='sr-only'>
        {hint}
      </span>
    </>
  );
}
