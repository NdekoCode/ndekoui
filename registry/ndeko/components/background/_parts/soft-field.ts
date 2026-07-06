/** A fall from full to nothing with no visible edge: the share of the strength left at each quarter of the way out. */
const FALLOFF = [1, 0.85, 0.5, 0.15, 0];

const QUARTER = 25;

function stopOf(strength: number, share: number, index: number) {
  const exact = strength * share;
  const scaled = Math.round(exact * 100);
  const percent = scaled / 100;
  const position = index * QUARTER;
  return `color-mix(in oklab, currentColor ${percent}%, transparent) ${position}%`;
}

/**
 * A radial gradient of the current colour that fades to nothing with a soft edge, as a blur would
 * draw it, without a filter. `shape` is the shape and the place of the gradient, `strength` the
 * per cent of the colour at its heart.
 */
export function softFieldOf(shape: string, strength: number) {
  const stops = FALLOFF.map((share, index) => stopOf(strength, share, index));
  const ramp = stops.join(', ');
  return `radial-gradient(${shape}, ${ramp})`;
}
