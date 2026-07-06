'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * The width of a plot as it resizes, for what depends on the room it has: how many labels fit, how
 * many marks, which way the bars run. Shapes do not need it: they are drawn in shares of the plot.
 */
export function usePlotWidth(fallback: number) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
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

  return { plotRef: setTarget, width };
}
