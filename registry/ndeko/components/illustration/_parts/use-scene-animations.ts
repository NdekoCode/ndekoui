'use client';

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

function playAll(animations: Animation[]) {
  for (const animation of animations) {
    animation.play();
  }
}

function pauseAll(animations: Animation[]) {
  for (const animation of animations) {
    animation.pause();
  }
}

function cancelAll(animations: Animation[]) {
  for (const animation of animations) {
    animation.cancel();
  }
}

/**
 * The looping animations of a scene, made on its stage the first time it plays. They pause while the
 * scene does not play and resume where they stopped, so nothing runs off screen or in a hidden tab.
 * A new `resetKey` drops them and makes them again, for a scene whose content changed.
 */
export function useSceneAnimations<Stage extends HTMLElement>(
  stageRef: RefObject<Stage | null>,
  isPlaying: boolean,
  create: (stage: Stage) => Animation[],
  resetKey = ''
) {
  const made = useRef<Animation[] | null>(null);

  const animationsOf = useEffectEvent((stage: Stage) => {
    made.current ??= create(stage);
    return made.current;
  });

  const dropAnimations = useEffectEvent(() => {
    const animations = made.current ?? [];
    cancelAll(animations);
    made.current = null;
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isPlaying) {
      return;
    }
    const animations = animationsOf(stage);
    playAll(animations);
    return () => pauseAll(animations);
  }, [stageRef, isPlaying, resetKey]);

  useEffect(() => {
    return () => dropAnimations();
  }, [resetKey]);
}
