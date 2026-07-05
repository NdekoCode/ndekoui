'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * The width of an element as it resizes. A piece in a narrow column of a wide window switches layout
 * by the room it has, which the viewport cannot tell.
 */
export function useContainerWidth(
  target: HTMLElement | null,
  fallback: number
) {
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    if (!target) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize[0];
      setWidth(box.inlineSize);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return width;
}
