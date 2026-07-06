'use client';

import {
  useAutoplay,
  type AutoplayOptions,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';

/**
 * What every chart demo shares: the demonstration, the box that keeps its tallest height so a round
 * never moves the page, and a stop when the keyboard brings focus in. A person who tabs to a plot
 * reads it with the arrow keys from there, and has pressed no key inside the piece yet.
 */
export function useChartDemo(
  steps: readonly AutoplayStep[],
  options?: AutoplayOptions
) {
  const demo = useAutoplay(steps, options);
  const { ref, takeOver } = demo;

  useKeptHeight(ref);

  function stopOnKeyboardFocus(event: React.FocusEvent<HTMLElement>) {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isKeyboardFocus) {
      takeOver();
    }
  }

  return { ...demo, stopOnKeyboardFocus };
}
