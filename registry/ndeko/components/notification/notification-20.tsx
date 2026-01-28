'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const TOAST_DURATION_MS = 5000;
const TICK_MS = 100;

type ToastId = string | number;

function focusStaysInside(event: React.FocusEvent<HTMLDivElement>) {
  const nextTarget = event.relatedTarget;
  if (!(nextTarget instanceof Node)) {
    return false;
  }
  return event.currentTarget.contains(nextTarget);
}

function useRemainingTime(isPaused: boolean, onElapsed: () => void) {
  const [remainingMs, setRemainingMs] = useState(TOAST_DURATION_MS);
  const remainingRef = useRef(TOAST_DURATION_MS);
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const startedAt = Date.now();
    const remainingAtStart = remainingRef.current;
    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextRemaining = Math.max(0, remainingAtStart - elapsedMs);
      remainingRef.current = nextRemaining;
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) {
        window.clearInterval(interval);
        onElapsedRef.current();
      }
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  return remainingMs;
}

function TimedToast({ toastId }: { toastId: ToastId }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const isPaused = isHovered || isFocusWithin;

  function close() {
    toast.dismiss(toastId);
  }

  const remainingMs = useRemainingTime(isPaused, close);
  const remainingShare = remainingMs / TOAST_DURATION_MS;
  const barStyle = { transform: `scaleX(${remainingShare})` };

  function pauseOnHover() {
    setIsHovered(true);
  }

  function resumeAfterHover() {
    setIsHovered(false);
  }

  function pauseOnFocus() {
    setIsFocusWithin(true);
  }

  function resumeAfterFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (focusStaysInside(event)) {
      return;
    }
    setIsFocusWithin(false);
  }

  return (
    <div
      className='flex w-full gap-3 font-normal'
      onPointerEnter={pauseOnHover}
      onPointerLeave={resumeAfterHover}
      onFocus={pauseOnFocus}
      onBlur={resumeAfterFocus}
    >
      <StatusOrb tone='success' />
      <div className='flex grow flex-col gap-3 pt-1.5'>
        <div className='flex flex-col gap-0.5 text-[13px] leading-5'>
          <p className='text-foreground font-medium'>Homepage published</p>
          <p className='text-muted-foreground'>
            Everyone visiting Atlas Redesign now sees the new version.
          </p>
        </div>
        <div>
          <Button size='sm' onClick={close}>
            Undo changes
          </Button>
        </div>
        <div
          aria-hidden='true'
          className='bg-foreground/10 h-1 overflow-hidden rounded-full'
        >
          <div
            style={barStyle}
            className='bg-success h-full origin-left rounded-full transition-transform duration-100 ease-linear'
          />
        </div>
      </div>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Dismiss notification'
        className='text-muted-foreground -me-1.5 -mt-1.5'
        onClick={close}
      >
        <XIcon />
      </Button>
    </div>
  );
}

function renderTimedToast(toastId: ToastId) {
  return <TimedToast toastId={toastId} />;
}

function showTimedToast() {
  toast.custom(renderTimedToast, { duration: Infinity });
}

export default function Notification20() {
  return (
    <Button variant='outline' onClick={showTimedToast}>
      Show toast with timer
    </Button>
  );
}
