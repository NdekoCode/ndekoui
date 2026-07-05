'use client';

import { useEffect, type RefObject } from 'react';

/**
 * A piece that plays in a loop grows and shrinks as its states come and go, and what sits under it
 * on the page would move with every round. The box keeps the tallest height it reached at its
 * current width, so it can only grow, once. A change of width starts the measure again.
 */
export function useKeptHeight<Element extends HTMLElement>(
  ref: RefObject<Element | null>
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    let tallest = 0;
    let measuredWidth = element.offsetWidth;

    function keep() {
      if (!element) {
        return;
      }
      const width = element.offsetWidth;
      const hasNewWidth = width !== measuredWidth;
      if (hasNewWidth) {
        measuredWidth = width;
        tallest = 0;
        element.style.minHeight = '';
      }
      const height = element.offsetHeight;
      if (height <= tallest) {
        return;
      }
      tallest = height;
      element.style.minHeight = `${height}px`;
    }

    const observer = new ResizeObserver(keep);
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.style.minHeight = '';
    };
  }, [ref]);
}
