import { speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';

/** The lap is never retimed more often than this: every retiming asks the browser to restart each bar's animation. */
export const POLL_MS = 125;

export const POLL_S = POLL_MS / 1000;

/** Until the first reading the lap runs at its base speed. */
export const BASE_PACE = 10;

export const START_LEVEL = 0.3;

const TENTHS = 10;

/** A pace counts tenths of the base speed: 0.6x when quiet, 2.2x at full level. */
const SLOWEST_PACE = 6;

const FASTEST_PACE = 22;

const HEARD_SEED = 0.9;

const WINDOW_SAMPLES = 4;

const SIMULATED_GAIN = 1.3;

export function rateOf(pace: number) {
  return pace / TENTHS;
}

export function paceOf(level: number) {
  const span = FASTEST_PACE - SLOWEST_PACE;
  const climb = span * level;
  const exact = SLOWEST_PACE + climb;
  return Math.round(exact);
}

function boundedLevelOf(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const atLeastZero = Math.max(0, value);
  return Math.min(1, atLeastZero);
}

/** The mean over the last poll: a syllable lasts about as long as one poll, so a single sample would catch it at random. */
function simulatedLevelAt(elapsed: number) {
  let total = 0;
  for (let sample = 0; sample < WINDOW_SAMPLES; sample += 1) {
    const share = sample / WINDOW_SAMPLES;
    const age = share * POLL_MS;
    const time = elapsed - age;
    total += speechLevelAt(time, HEARD_SEED);
  }
  const mean = total / WINDOW_SAMPLES;
  const gained = mean * SIMULATED_GAIN;
  return Math.min(1, gained);
}

export function heardLevelOf(
  provider: (() => number) | undefined,
  elapsed: number
) {
  if (provider) {
    const heard = provider();
    return boundedLevelOf(heard);
  }
  return simulatedLevelAt(elapsed);
}
