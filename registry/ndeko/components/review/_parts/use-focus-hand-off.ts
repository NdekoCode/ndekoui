'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * When a card turns into another view, the control a person just used is gone and focus would fall
 * to the page. If focus was inside the card, it goes to the last element marked `data-hand-off`
 * once the new view is in place; a demonstration never had focus there, so it never moves it.
 */
export function useFocusHandOff(phase: string) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isPending = useRef(false);

  const markIfFocusInside = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    isPending.current = root.contains(document.activeElement);
  }, []);

  useEffect(() => {
    if (!isPending.current) {
      return;
    }
    isPending.current = false;
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const targets = root.querySelectorAll<HTMLElement>('[data-hand-off]');
    const target = targets[targets.length - 1];
    target?.focus();
  }, [phase]);

  return { rootRef, markIfFocusInside };
}
