const ATTACK_S = 0.04;

const RELEASE_S = 0.2;

/** Rises fast and falls slowly, whatever the frame rate. */
export function followLevel(current: number, target: number, step: number) {
  const gap = target - current;
  const isRising = gap > 0;
  let constant = RELEASE_S;
  if (isRising) {
    constant = ATTACK_S;
  }
  const amount = 1 - Math.exp(-step / constant);
  return current + gap * amount;
}
