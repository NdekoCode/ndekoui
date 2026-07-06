'use client';

import {
  useAutoplay,
  type AutoplayOptions,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';

/**
 * What every card demo shares: the demonstration, and the box that keeps its tallest height so a
 * round never moves the page.
 */
export function useCardDemo(
  steps: readonly AutoplayStep[],
  options?: AutoplayOptions
) {
  const demo = useAutoplay(steps, options);
  const { ref } = demo;

  useKeptHeight(ref);

  return demo;
}
