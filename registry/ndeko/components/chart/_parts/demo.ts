import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { keyDelayOf } from '@/registry/ndeko/lib/demonstration';

type WalkOptions = {
  /** Milliseconds before the first position. */
  startAfter?: number;
  /** Milliseconds between two positions. */
  stepMs?: number;
};

/** One step per position, so a reading crosses a plot the way a pointer does. */
export function walkSteps<Position>(
  positions: readonly Position[],
  moveTo: (position: Position) => void,
  { startAfter = 700, stepMs = 240 }: WalkOptions = {}
): AutoplayStep[] {
  return positions.map((position, index) => {
    const after = keyDelayOf(index, startAfter, stepMs);
    return { after, run: () => moveTo(position) };
  });
}

/** What a demonstration points at lets go the moment a person takes over. */
export function whileDemonstrating<Value>(
  isDemonstrating: boolean,
  value: Value | null
) {
  if (isDemonstrating) {
    return value;
  }
  return null;
}
