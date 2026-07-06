export type Point = {
  x: number;
  y: number;
};

export function clamp(value: number, low: number, high: number) {
  const raised = Math.max(low, value);
  return Math.min(high, raised);
}

/** How much of the way left is covered in `seconds`: the same glide whatever the frame rate. */
export function shareOf(seconds: number, easeSeconds: number) {
  const ratio = seconds / easeSeconds;
  const decay = Math.exp(-ratio);
  return 1 - decay;
}

export function towards(from: number, to: number, share: number) {
  const gap = to - from;
  const step = gap * share;
  return from + step;
}

/** From 0 at `low` to 1 at `high`, leaving and arriving without a corner. */
export function smoothstep(low: number, high: number, value: number) {
  const span = high - low;
  const offset = value - low;
  const raw = offset / span;
  const share = clamp(raw, 0, 1);
  const doubled = 2 * share;
  const curve = 3 - doubled;
  const squared = share * share;
  return squared * curve;
}

/** The damping that brings a spring of this stiffness to its target without passing it. */
export function dampingOf(stiffness: number) {
  const root = Math.sqrt(stiffness);
  return 2 * root;
}

/**
 * The speed of a spring one step later. The caller then moves the value by that speed over the
 * same step, so the value follows its target and settles on it.
 */
export function springSpeedOf(
  gap: number,
  speed: number,
  stiffness: number,
  damping: number,
  seconds: number
) {
  const pull = gap * stiffness;
  const drag = speed * damping;
  const push = pull - drag;
  const gain = push * seconds;
  return speed + gain;
}
