'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  createRunStore,
  type RunEvent,
  type RunSnapshot,
  type RunStore,
} from '@/registry/ndeko/lib/agent-run';

export function useRunSnapshot(store: RunStore) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
}

type Clock = {
  now: number;
  listeners: Set<() => void>;
  timer?: ReturnType<typeof setInterval>;
};

const CLOCKS = new Map<number, Clock>();

function clockOf(intervalMs: number) {
  const existing = CLOCKS.get(intervalMs);
  if (existing) {
    return existing;
  }
  const clock: Clock = { now: Date.now(), listeners: new Set() };
  CLOCKS.set(intervalMs, clock);
  return clock;
}

function tick(clock: Clock) {
  clock.now = Date.now();
  for (const listener of clock.listeners) {
    listener();
  }
}

function subscribeToClock(intervalMs: number, listener: () => void) {
  const clock = clockOf(intervalMs);
  clock.listeners.add(listener);
  const isFirstListener = clock.timer === undefined;
  if (isFirstListener) {
    clock.now = Date.now();
    clock.timer = setInterval(() => tick(clock), intervalMs);
  }
  return () => {
    clock.listeners.delete(listener);
    const hasListeners = clock.listeners.size > 0;
    if (hasListeners) {
      return;
    }
    clearInterval(clock.timer);
    clock.timer = undefined;
  };
}

function serverNow() {
  return 0;
}

function idleSubscription() {
  return () => {};
}

/** The current time, refreshed every `intervalMs` while `isActive`; it holds still otherwise. */
export function useNow(intervalMs = 1000, isActive = true) {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!isActive) {
        return idleSubscription();
      }
      return subscribeToClock(intervalMs, listener);
    },
    [intervalMs, isActive]
  );
  const getSnapshot = useCallback(() => clockOf(intervalMs).now, [intervalMs]);
  return useSyncExternalStore(subscribe, getSnapshot, serverNow);
}

function subscribeToVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

function isDocumentVisible() {
  return document.visibilityState === 'visible';
}

function visibleOnServer() {
  return true;
}

export function useDocumentVisible() {
  return useSyncExternalStore(
    subscribeToVisibility,
    isDocumentVisible,
    visibleOnServer
  );
}

export type RunScriptStep = {
  /** Milliseconds after the previous step. */
  after: number;
  event: RunEvent;
};

export type RunScriptOptions = {
  initial: RunSnapshot;
  /** False while the view is off screen: the script holds its place and picks up from there. */
  isActive?: boolean;
  /** Starts again from `initial` this long after the last step. Without it the run stays at its end. */
  loopAfter?: number;
};

type Pending = {
  remaining: number;
  scheduledAt: number;
};

/**
 * Plays a scripted run into a store, the way a backend would stream it, for previews and demos.
 * It pauses while inactive or while the tab is hidden, and loops when asked to.
 */
export function useRunScript(
  script: RunScriptStep[],
  { initial, isActive = true, loopAfter }: RunScriptOptions
) {
  const [store] = useState(() => createRunStore(initial));
  const [round, setRound] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const isVisible = useDocumentVisible();
  const nextIndex = useRef(0);
  const pending = useRef<Pending | null>(null);
  const shouldPlay = isActive && isVisible;

  useEffect(() => {
    if (!shouldPlay) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;

    function finish() {
      const canLoop = loopAfter !== undefined;
      if (!canLoop) {
        setIsFinished(true);
        return;
      }
      schedule(loopAfter, () => {
        store.dispatch({ type: 'reset', snapshot: initial });
        nextIndex.current = 0;
        setRound((current) => current + 1);
      });
    }

    function schedule(delay: number, run: () => void) {
      const saved = pending.current;
      const remaining = saved?.remaining ?? delay;
      pending.current = { remaining, scheduledAt: Date.now() };
      timer = setTimeout(() => {
        pending.current = null;
        run();
      }, remaining);
    }

    function playNext() {
      const step = script[nextIndex.current];
      if (!step) {
        finish();
        return;
      }
      schedule(step.after, () => {
        store.dispatch(step.event);
        nextIndex.current += 1;
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
  }, [shouldPlay, script, store, initial, loopAfter, round]);

  const restart = useCallback(() => {
    pending.current = null;
    nextIndex.current = 0;
    store.dispatch({ type: 'reset', snapshot: initial });
    setIsFinished(false);
    setRound((current) => current + 1);
  }, [store, initial]);

  const snapshot = useRunSnapshot(store);

  return { store, snapshot, restart, isFinished };
}
