'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';

export type AutoplayStep = {
  /** Milliseconds after the previous step. */
  after: number;
  run: () => void;
};

export type AutoplayOptions = {
  /** Starts again this long after the last step. Without it the demonstration plays once. */
  loopAfter?: number;
  /** Puts the piece back in its first state before a new round. */
  onReset?: () => void;
  isEnabled?: boolean;
};

type Pending = {
  remaining: number;
  scheduledAt: number;
};

type Latest = {
  steps: readonly AutoplayStep[];
  onReset?: () => void;
};

/**
 * Plays a piece's own demonstration while it is on screen: each step calls a handler a person
 * would trigger. The first click or key inside the piece ends it for good, so the script never
 * fights the person. It holds its place off screen and in a hidden tab, and it does not play under
 * reduced motion. Steps must not move focus or open a layer outside the piece.
 */
export function useAutoplay<Element extends HTMLElement = HTMLDivElement>(
  steps: readonly AutoplayStep[],
  { loopAfter, onReset, isEnabled = true }: AutoplayOptions = {}
) {
  const ref = useRef<Element>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = useReducedMotion();
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [round, setRound] = useState(0);
  const latest = useRef<Latest>({ steps, onReset });
  const nextIndex = useRef(0);
  const pending = useRef<Pending | null>(null);
  const isAutoplaying = isEnabled && !isTakenOver && !shouldReduceMotion;
  const isOnScreen = isInView && isVisible;
  const shouldPlay = isAutoplaying && isOnScreen;

  useEffect(() => {
    latest.current = { steps, onReset };
  });

  useEffect(() => {
    if (!shouldPlay) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;

    function schedule(delay: number, run: () => void) {
      const saved = pending.current;
      const remaining = saved?.remaining ?? delay;
      pending.current = { remaining, scheduledAt: Date.now() };
      timer = setTimeout(() => {
        pending.current = null;
        run();
      }, remaining);
    }

    function finish() {
      if (loopAfter === undefined) {
        return;
      }
      schedule(loopAfter, () => {
        nextIndex.current = 0;
        latest.current.onReset?.();
        setRound((current) => current + 1);
      });
    }

    function playNext() {
      const index = nextIndex.current;
      const step = latest.current.steps[index];
      if (!step) {
        finish();
        return;
      }
      schedule(step.after, () => {
        latest.current.steps[index]?.run();
        nextIndex.current = index + 1;
        playNext();
      });
    }

    playNext();

    return () => {
      clearTimeout(timer);
      const saved = pending.current;
      if (!saved) {
        return;
      }
      const spent = Date.now() - saved.scheduledAt;
      const remaining = Math.max(0, saved.remaining - spent);
      pending.current = { remaining, scheduledAt: saved.scheduledAt };
    };
  }, [shouldPlay, loopAfter, round]);

  useEffect(() => {
    const element = ref.current;
    if (!element || isTakenOver) {
      return;
    }
    function takeOverFrom(event: Event) {
      if (event.isTrusted) {
        setIsTakenOver(true);
      }
    }
    element.addEventListener('pointerdown', takeOverFrom, true);
    element.addEventListener('keydown', takeOverFrom, true);
    return () => {
      element.removeEventListener('pointerdown', takeOverFrom, true);
      element.removeEventListener('keydown', takeOverFrom, true);
    };
  }, [isTakenOver]);

  const takeOver = useCallback(() => {
    setIsTakenOver(true);
  }, []);

  const restart = useCallback(() => {
    pending.current = null;
    nextIndex.current = 0;
    latest.current.onReset?.();
    setIsTakenOver(false);
    setRound((current) => current + 1);
  }, []);

  return { ref, isInView, isAutoplaying, takeOver, restart };
}

type TypingOptions = {
  /** Milliseconds before the first character. */
  startAfter?: number;
  /** Milliseconds between two characters. */
  characterMs?: number;
};

function delayOfCharacter(
  index: number,
  startAfter: number,
  characterMs: number
) {
  if (index === 0) {
    return startAfter;
  }
  return characterMs;
}

/** One step per character, so a field fills the way a person types into it. */
export function typingSteps(
  text: string,
  write: (typed: string) => void,
  { startAfter = 400, characterMs = 42 }: TypingOptions = {}
): AutoplayStep[] {
  const characters = Array.from(text);
  return characters.map((_, index) => {
    const end = index + 1;
    const typed = characters.slice(0, end).join('');
    const after = delayOfCharacter(index, startAfter, characterMs);
    return { after, run: () => write(typed) };
  });
}
