import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';

const SHORTEST_STRETCH = 0.55;

const STRETCH_SPAN = 0.95;

/**
 * A person does not type at a steady pace: the wait after each key stretches or shrinks around
 * `characterMs`, the same way on every round. A scene picks its own `seed` so two scenes do not type
 * in step.
 */
export function keyHoldOf(index: number, characterMs: number, seed: number) {
  const noise = noiseAt(index, seed);
  const stretch = SHORTEST_STRETCH + noise * STRETCH_SPAN;
  return characterMs * stretch;
}
