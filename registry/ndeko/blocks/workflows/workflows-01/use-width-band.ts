'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * How wide the builder itself is, whatever the window: a phone gets the flow from top to bottom and
 * the inspector as a sheet, a compact width keeps the flow from top to bottom beside the inspector,
 * a wide one lays the flow from left to right.
 */
export type WidthBand = 'phone' | 'compact' | 'wide';

const PHONE_BELOW = 640;

const WIDE_FROM = 1100;

function bandOf(width: number): WidthBand {
  if (width < PHONE_BELOW) {
    return 'phone';
  }
  if (width < WIDE_FROM) {
    return 'compact';
  }
  return 'wide';
}

/** Null until the element has been measured, so nothing is laid out for the wrong width first. */
export function useWidthBand(ref: RefObject<HTMLElement | null>) {
  const [band, setBand] = useState<WidthBand | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setBand(bandOf(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return band;
}
