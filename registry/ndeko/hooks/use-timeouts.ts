'use client';

import { useCallback, useEffect, useRef } from 'react';

type Timer = ReturnType<typeof setTimeout>;

export function useTimeouts() {
  const timers = useRef<Set<Timer>>(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const schedule = useCallback((task: () => void, delay: number) => {
    const pending = timers.current;
    const timer = setTimeout(() => {
      pending.delete(timer);
      task();
    }, delay);
    pending.add(timer);
  }, []);

  const clearAll = useCallback(() => {
    const pending = timers.current;
    pending.forEach((timer) => clearTimeout(timer));
    pending.clear();
  }, []);

  return { schedule, clearAll };
}
