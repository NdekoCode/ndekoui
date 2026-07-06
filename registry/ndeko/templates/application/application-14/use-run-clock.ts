'use client';

import { useEffect } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';

import type { Workflow } from './model';
import { delayOf, type Run } from './run';

/**
 * Plays a run beat by beat, the way a backend would stream it: each beat is asked for once the one
 * before it has had its time. Nothing ticks off screen, in a hidden tab, or while the run waits.
 */
export function useRunClock(
  run: Run,
  workflow: Workflow,
  isOnScreen: boolean,
  onBeat: (token: number, beat: number) => void
) {
  const isVisible = useDocumentVisible();
  const delay = delayOf(run, workflow);
  const { token, beat } = run;
  const isPlaying = isOnScreen && isVisible;

  useEffect(() => {
    if (delay === null || !isPlaying) {
      return;
    }
    const timer = setTimeout(() => onBeat(token, beat), delay);
    return () => clearTimeout(timer);
  }, [delay, isPlaying, token, beat, onBeat]);
}
