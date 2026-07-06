'use client';

import { useEffect, useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';

import { isRunDone, TICK_DELAYS_MS, type Run } from './run';

type Pending = {
  key: string;
  remaining: number;
  scheduledAt: number;
};

/** A run and the moment it waits for: a new run or a new moment starts a new wait. */
function waitKeyOf(run: Run | null) {
  if (!run) {
    return '';
  }
  return `${run.startedAt}:${run.tick}`;
}

function delayOf(run: Run | null) {
  if (!run) {
    return 0;
  }
  return TICK_DELAYS_MS[run.tick] ?? 0;
}

function hasMomentsLeft(run: Run | null) {
  if (!run) {
    return false;
  }
  return !isRunDone(run);
}

function remainingOf(saved: Pending | null, key: string, delay: number) {
  if (saved?.key === key) {
    return saved.remaining;
  }
  return delay;
}

/**
 * Plays a first run one moment at a time, for the demonstration and for a person alike: it asks for
 * the next moment once the one before had its time. Off screen and in a hidden tab it keeps what
 * was left of the wait, so a run never moves while nobody looks.
 */
export function useRunClock(
  run: Run | null,
  isOnScreen: boolean,
  onTick: () => void
) {
  const isVisible = useDocumentVisible();
  const pending = useRef<Pending | null>(null);
  const key = waitKeyOf(run);
  const delay = delayOf(run);
  const isDue = hasMomentsLeft(run);
  const isPlaying = isOnScreen && isVisible && isDue;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const remaining = remainingOf(pending.current, key, delay);
    pending.current = { key, remaining, scheduledAt: Date.now() };
    const timer = setTimeout(() => {
      pending.current = null;
      onTick();
    }, remaining);
    return () => {
      clearTimeout(timer);
      const saved = pending.current;
      if (!saved) {
        return;
      }
      const spent = Date.now() - saved.scheduledAt;
      const left = Math.max(0, saved.remaining - spent);
      pending.current = { ...saved, remaining: left };
    };
  }, [isPlaying, key, delay, onTick]);
}
