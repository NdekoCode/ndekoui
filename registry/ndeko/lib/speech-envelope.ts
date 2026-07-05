const TAU = Math.PI * 2;

const SYLLABLE_HERTZ = 4.7;

const WORD_HERTZ = 1.4;

const PHRASE_HERTZ = 0.31;

const GRAIN_HERTZ = 11.3;

function waveAt(seconds: number, hertz: number, offset: number) {
  const turns = seconds * hertz;
  const angle = turns * TAU + offset;
  const sine = Math.sin(angle);
  return (sine + 1) / 2;
}

function smoothStep(edgeStart: number, edgeEnd: number, value: number) {
  const span = edgeEnd - edgeStart;
  const progress = (value - edgeStart) / span;
  const bounded = Math.min(1, Math.max(0, progress));
  const easing = 3 - 2 * bounded;
  return bounded * bounded * easing;
}

/** Deterministic: the same time and seed always give the same level. */
export function speechLevelAt(time: number, seed = 0) {
  const seconds = time / 1000;
  const syllables = waveAt(seconds, SYLLABLE_HERTZ, seed);
  const words = waveAt(seconds, WORD_HERTZ, seed * 1.9);
  const phrases = waveAt(seconds, PHRASE_HERTZ, seed * 0.7);
  const grain = waveAt(seconds, GRAIN_HERTZ, seed * 3.1);
  const voiced = smoothStep(0.2, 0.45, phrases);
  const wordShape = 0.35 + words * 0.65;
  const syllableShape = syllables * syllables;
  const texture = 0.85 + grain * 0.15;
  const level = syllableShape * wordShape * voiced * texture;
  const lifted = level * 1.25;
  return Math.min(1, lifted);
}

/** A steady pseudo-random number between 0 and 1 for an index, so drawn shapes never flicker between renders. */
export function noiseAt(index: number, seed = 0) {
  const angle = index * 12.9898 + seed * 78.233;
  const sine = Math.sin(angle) * 43758.5453;
  return sine - Math.floor(sine);
}
