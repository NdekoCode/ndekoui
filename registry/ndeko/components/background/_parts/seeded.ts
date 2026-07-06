const STREAM_STEP = 0x6d2b79f5;

const UINT32_RANGE = 4294967296;

const FIRST_PRIME = 73856093;

const SECOND_PRIME = 19349663;

/**
 * A stream of numbers from 0 to 1, the same for the same seed on the server and in the browser, so
 * a generated picture never changes between two renders.
 */
export function randomOf(seed: number) {
  let state = seed >>> 0;

  function next() {
    const stepped = state + STREAM_STEP;
    state = stepped >>> 0;
    const shifted = state >>> 15;
    const folded = state ^ shifted;
    const odd = state | 1;
    const first = Math.imul(folded, odd);
    const reshifted = first >>> 7;
    const refolded = first ^ reshifted;
    const salted = first | 61;
    const second = Math.imul(refolded, salted);
    const summed = first + second;
    const mixed = first ^ summed;
    const lastShift = mixed >>> 14;
    const settled = mixed ^ lastShift;
    const positive = settled >>> 0;
    return positive / UINT32_RANGE;
  }

  return next;
}

/** One seed out of two numbers, so each part of a picture draws from a stream of its own. */
export function seedOf(first: number, second: number) {
  const firstHash = Math.imul(first, FIRST_PRIME);
  const secondHash = Math.imul(second, SECOND_PRIME);
  const mixed = firstHash ^ secondHash;
  return mixed >>> 0;
}
