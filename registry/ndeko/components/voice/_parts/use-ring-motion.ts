'use client';

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

import { followLevel } from './level';
import type { RingSpec } from './ring-geometry';
import {
  cancelAll,
  landAll,
  pauseAll,
  playAll,
  setLapPace,
  startRingLoops,
  type RingLoops,
} from './ring-loops';
import {
  heardLevelOf,
  paceOf,
  POLL_MS,
  POLL_S,
  START_LEVEL,
} from './ring-pace';

type RingMotionOptions = {
  spec: RingSpec;
  isActive: boolean;
  isStill: boolean;
  isOnScreen: boolean;
  level: (() => number) | undefined;
};

/**
 * The animations of a ring are made when it becomes active and paused whenever it is not seen, so
 * they ask for no frame off screen or in a hidden tab. While it is seen a timer reads the level a
 * few times a second and retimes the lap. When the ring goes quiet each bar glides back to rest and
 * the animations are gone. Under reduced motion none are made.
 */
export function useRingMotion(
  rootRef: RefObject<HTMLElement | null>,
  { spec, isActive, isStill, isOnScreen, level }: RingMotionOptions
) {
  const running = useRef<RingLoops | null>(null);
  const canLoop = isActive && !isStill;
  const isLive = canLoop && isOnScreen;

  const levelAt = useEffectEvent((elapsed: number) => {
    return heardLevelOf(level, elapsed);
  });

  /** Stopped by the reduced motion setting, a ring goes straight to rest instead of gliding there. */
  const finish = useEffectEvent(
    (animations: Animation[], root: HTMLElement) => {
      const canGlide = root.isConnected && !isStill;
      if (canGlide) {
        landAll(animations);
        return;
      }
      cancelAll(animations);
    }
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canLoop) {
      return;
    }
    const loops = startRingLoops(root, spec);
    pauseAll(loops.animations);
    running.current = loops;
    return () => {
      running.current = null;
      finish(loops.animations, root);
    };
  }, [rootRef, canLoop, spec]);

  useEffect(() => {
    const loops = running.current;
    if (!loops || !isLive) {
      return;
    }
    playAll(loops.animations);
    return () => pauseAll(loops.animations);
  }, [canLoop, isLive, spec]);

  useEffect(() => {
    if (!isLive) {
      return;
    }
    const startedAt = performance.now();
    let followed = START_LEVEL;

    function retime() {
      const loops = running.current;
      if (!loops) {
        return;
      }
      const now = performance.now();
      const elapsed = now - startedAt;
      const heard = levelAt(elapsed);
      followed = followLevel(followed, heard, POLL_S);
      const pace = paceOf(followed);
      setLapPace(loops, pace);
    }

    const timer = setInterval(retime, POLL_MS);
    return () => clearInterval(timer);
  }, [isLive]);
}
