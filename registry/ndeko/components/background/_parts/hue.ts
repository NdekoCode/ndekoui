'use client';

import { useState } from 'react';

/** A background wears one hue: the brand unless it is told otherwise. */
export const DEFAULT_HUE = 'var(--primary)';

/** The brand first, then the series hues that differ from it. */
const DEMO_HUES = [
  DEFAULT_HUE,
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
];

/** The hue of a demo, and the step to the next one, to show a background in each hue it accepts. */
export function useHueCycle() {
  const [index, setIndex] = useState(0);
  const hue = DEMO_HUES[index] ?? DEFAULT_HUE;

  function nextHue() {
    setIndex((current) => {
      const next = current + 1;
      return next % DEMO_HUES.length;
    });
  }

  return { hue, nextHue };
}
