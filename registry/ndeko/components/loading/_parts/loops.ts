export type Loop = {
  element: Element;
  keyframes: Keyframe[];
  timing: KeyframeAnimationOptions;
};

const LAND_MS = 220;

const LAND_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

/**
 * Each loop runs in the browser's own animation engine on transform and opacity only, so the
 * compositor plays it and the page does no work per frame.
 */
export function startLoops(loops: readonly Loop[]) {
  return loops.map((loop) => loop.element.animate(loop.keyframes, loop.timing));
}

/**
 * A cancelled animation is left alone: playing or even pausing it would bring it back and hold its
 * element in a pose its mark has already left.
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

function targetOf(animation: Animation) {
  const effect = animation.effect;
  if (effect instanceof KeyframeEffect) {
    return effect.target;
  }
  return null;
}

function poseOf(element: Element): Keyframe {
  const styles = getComputedStyle(element);
  return { transform: styles.transform, opacity: styles.opacity };
}

/** From the pose its loop left it in, an element glides back to its own resting style, then lets go. */
function land(animation: Animation) {
  const target = targetOf(animation);
  if (!target?.isConnected) {
    animation.cancel();
    return;
  }
  const shown = poseOf(target);
  animation.cancel();
  const rest = poseOf(target);
  target.animate([shown, rest], { duration: LAND_MS, easing: LAND_EASING });
}

export function landAll(animations: readonly Animation[]) {
  for (const animation of animations) {
    land(animation);
  }
}
