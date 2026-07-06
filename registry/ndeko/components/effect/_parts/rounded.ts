/**
 * Two engines can disagree on the last digit of a sine, and a frame writes many positions: a value
 * written into a style is rounded to the hundredth, so the server and the browser print the same
 * text and the style stays short.
 */
export function hundredthsOf(value: number) {
  const hundredths = Math.round(value * 100);
  return hundredths / 100;
}
