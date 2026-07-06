/** A frame that comes late, after a long task, moves the values no further than this would. */
const MAX_ELAPSED_S = 0.05;

/** The spring is worked out in steps this short, so a stiff spring stays steady on a slow frame. */
const STEP_S = 1 / 120;

export type FollowerOptions = {
  /** How hard each value is pulled to its target: about 120 glides, 700 trails a pointer closely. */
  stiffness: number;
  /** How close to its target a value counts as arrived, in its own unit. */
  precision: number;
};

export type Follower = {
  /** Sends the values towards new targets. Frames run until every value has arrived, then stop. */
  follow: (targets: readonly number[]) => void;
  /** Puts the values on new targets at once and draws them, with no movement. */
  place: (targets: readonly number[]) => void;
  setStiffness: (stiffness: number) => void;
  /** Asks for no more frames. The values stay where they are. */
  stop: () => void;
};

/**
 * Values that follow their targets like a spring that does not bounce. Each frame hands them to
 * `draw`, which writes them to the page; no frame is asked for once they have all arrived.
 */
export function createFollower(
  count: number,
  draw: (values: readonly number[]) => void,
  options: FollowerOptions
): Follower {
  const values = new Array<number>(count).fill(0);
  const speeds = new Array<number>(count).fill(0);
  const targets = new Array<number>(count).fill(0);
  const { precision } = options;
  let stiffness = options.stiffness;
  let frame = 0;
  let lastAt = 0;

  function hasArrived() {
    const settledSpeed = precision * Math.sqrt(stiffness) * 2;
    for (let index = 0; index < count; index += 1) {
      const gap = Math.abs(targets[index] - values[index]);
      const speed = Math.abs(speeds[index]);
      const isMoving = gap > precision || speed > settledSpeed;
      if (isMoving) {
        return false;
      }
    }
    return true;
  }

  function land() {
    for (let index = 0; index < count; index += 1) {
      values[index] = targets[index];
      speeds[index] = 0;
    }
  }

  function advance(seconds: number) {
    const damping = 2 * Math.sqrt(stiffness);
    for (let index = 0; index < count; index += 1) {
      const gap = targets[index] - values[index];
      const force = stiffness * gap - damping * speeds[index];
      speeds[index] += force * seconds;
      values[index] += speeds[index] * seconds;
    }
  }

  function tick(now: number) {
    frame = 0;
    const elapsedMs = now - lastAt;
    lastAt = now;
    const forward = Math.max(0, elapsedMs / 1000);
    let left = Math.min(forward, MAX_ELAPSED_S);
    while (left > 0) {
      const step = Math.min(left, STEP_S);
      advance(step);
      left -= step;
    }
    if (hasArrived()) {
      land();
      draw(values);
      return;
    }
    draw(values);
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame !== 0) {
      return;
    }
    lastAt = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function follow(next: readonly number[]) {
    for (let index = 0; index < count; index += 1) {
      targets[index] = next[index] ?? 0;
    }
    wake();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function place(next: readonly number[]) {
    stop();
    for (let index = 0; index < count; index += 1) {
      targets[index] = next[index] ?? 0;
    }
    land();
    draw(values);
  }

  function setStiffness(next: number) {
    stiffness = next;
  }

  return { follow, place, setStiffness, stop };
}
