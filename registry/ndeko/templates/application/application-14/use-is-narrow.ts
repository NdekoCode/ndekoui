'use client';

import { useEffect, useState, type RefObject } from 'react';

function pixelsOf(rem: number) {
  const rootStyle = getComputedStyle(document.documentElement);
  const rootFontSize = parseFloat(rootStyle.fontSize);
  return rem * rootFontSize;
}

/**
 * The layout folds with container variants in CSS. This tells the code the same thing, for what CSS
 * cannot do: mount one copy of a panel and make the page behind an open sheet inert.
 */
export function useIsNarrow(
  ref: RefObject<HTMLElement | null>,
  breakpointRem: number
) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const breakpoint = pixelsOf(breakpointRem);
      const isBelow = entry.contentRect.width < breakpoint;
      setIsNarrow(isBelow);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, breakpointRem]);

  return isNarrow;
}
