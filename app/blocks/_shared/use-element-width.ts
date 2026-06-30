'use client';

import { useLayoutEffect, useState } from 'react';

/** The rendered width of an element, followed while it resizes. */
export function useElementWidth(element: HTMLElement | null) {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0];
      setWidth(box.inlineSize);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return width;
}
