'use client';

import { useEffect, useState } from 'react';

import type { ScenePlay } from './use-scene-play';

export type SceneFrame<State> = {
  state: State;
  /** Milliseconds the scene stays in this state before the next one. */
  holdMs: number;
};

function nextIndexOf(index: number, count: number) {
  const next = index + 1;
  return next % count;
}

/**
 * A scene told as a flipbook: whole states, each held for a while, played in a loop. The first frame
 * is the resting picture: it shows before the scene plays and under reduced motion. While the scene
 * does not play the book stays on its page and no timer is left. `frames` holds at least one frame.
 */
export function useSceneFrames<State>(
  frames: readonly SceneFrame<State>[],
  { isPlaying, isStill }: ScenePlay
) {
  const [index, setIndex] = useState(0);
  const frameCount = frames.length;
  const shownIndex = index % frameCount;
  const frame = frames[shownIndex];
  const holdMs = frame.holdMs;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex(nextIndexOf(shownIndex, frameCount));
    }, holdMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, shownIndex, frameCount, holdMs]);

  if (isStill) {
    return frames[0].state;
  }
  return frame.state;
}
