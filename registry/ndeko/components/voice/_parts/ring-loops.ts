import {
  LAP_MS,
  lapDelayOf,
  lapKeyframesOf,
  type RingSpec,
} from './ring-geometry';
import { BASE_PACE, rateOf } from './ring-pace';

const LAND_MS = 300;

const LAND_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const LAND_TIMING: KeyframeAnimationOptions = {
  duration: LAND_MS,
  easing: LAND_EASING,
};

export type RingLoops = {
  animations: Animation[];
  pace: number;
};

function barsOf(root: HTMLElement) {
  return Array.from(root.querySelectorAll('[data-bar]'));
}

/**
 * One animation per bar on transform and opacity, all with the same keyframes: the browser's own
 * animation engine plays them, so the page does no work per frame.
 */
export function startRingLoops(root: HTMLElement, spec: RingSpec): RingLoops {
  const keyframes = lapKeyframesOf(spec);
  const bars = barsOf(root);
  const animations = bars.map((bar, index) => {
    const delay = lapDelayOf(index, spec.bars);
    return bar.animate(keyframes, {
      duration: LAP_MS,
      delay,
      iterations: Infinity,
    });
  });
  return { animations, pace: BASE_PACE };
}

/** Every bar changes speed in the same task, so the peak keeps its shape while the lap gets faster or slower. */
export function setLapPace(loops: RingLoops, pace: number) {
  if (pace === loops.pace) {
    return;
  }
  loops.pace = pace;
  const rate = rateOf(pace);
  for (const animation of loops.animations) {
    animation.updatePlaybackRate(rate);
  }
}

/**
 * A cancelled animation is left alone: playing or even pausing it would bring it back and hold its
 * bar in a pose its ring has already left.
 */
function isCancelled(animation: Animation) {
  return animation.playState === 'idle';
}

export function playAll(animations: readonly Animation[]) {
  for (const animation of animations) {
    if (!isCancelled(animation)) {
      animation.play();
    }
  }
}

export function pauseAll(animations: readonly Animation[]) {
  for (const animation of animations) {
    if (!isCancelled(animation)) {
      animation.pause();
    }
  }
}

export function cancelAll(animations: readonly Animation[]) {
  for (const animation of animations) {
    animation.cancel();
  }
}

type Pose = {
  transform: string;
  opacity: string;
};

type Landing = {
  target: Element;
  shown: Pose;
};

function targetOf(animation: Animation) {
  const effect = animation.effect;
  if (effect instanceof KeyframeEffect) {
    return effect.target;
  }
  return null;
}

function poseOf(element: Element): Pose {
  const styles = getComputedStyle(element);
  return { transform: styles.transform, opacity: styles.opacity };
}

function landingsOf(animations: readonly Animation[]) {
  const landings: Landing[] = [];
  for (const animation of animations) {
    const target = targetOf(animation);
    if (target?.isConnected) {
      const shown = poseOf(target);
      landings.push({ target, shown });
    }
  }
  return landings;
}

/**
 * From the pose its lap left it in, each bar glides back to its resting style, then lets go. The
 * poses are read together, then the laps are dropped, then the resting poses are read together,
 * so the page restyles twice whatever the number of bars.
 */
export function landAll(animations: readonly Animation[]) {
  const landings = landingsOf(animations);
  cancelAll(animations);
  const rests = landings.map((landing) => poseOf(landing.target));
  landings.forEach((landing, index) => {
    const keyframes = [landing.shown, rests[index]];
    landing.target.animate(keyframes, LAND_TIMING);
  });
}
