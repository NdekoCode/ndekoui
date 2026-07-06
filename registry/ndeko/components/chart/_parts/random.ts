const UINT_RANGE = 4_294_967_296;

const MULTIPLIER = 1_664_525;

const INCREMENT = 1_013_904_223;

/**
 * Numbers between 0 and 1 drawn from a seed, the same on the server and in the browser, so sample
 * data never changes between two renders.
 */
export function seededRandom(seed: number) {
  let state = seed >>> 0;

  return function next() {
    const multiplied = Math.imul(state, MULTIPLIER);
    state = (multiplied + INCREMENT) >>> 0;
    return state / UINT_RANGE;
  };
}

/** A draw between -1 and 1 that favours small steps, from two flat draws. */
export function spreadOf(next: () => number) {
  const first = next();
  const second = next();
  return first + second - 1;
}
