export type Domain = {
  min: number;
  max: number;
};

export type Scale = Domain & {
  step: number;
  ticks: number[];
};

const NICE_FACTORS = [1, 2, 5, 10];

const EMPTY_DOMAIN: Domain = { min: 0, max: 0 };

export function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

export function lerp(from: number, to: number, amount: number) {
  const span = to - from;
  return from + span * amount;
}

export function sumOf(values: readonly number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

export function extentOf(values: readonly number[]): Domain {
  if (values.length === 0) {
    return EMPTY_DOMAIN;
  }
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
}

/** Bars and areas are read from zero, so their domain always holds it. */
export function withZero(domain: Domain): Domain {
  const min = Math.min(domain.min, 0);
  const max = Math.max(domain.max, 0);
  return { min, max };
}

/** Where a value sits in a domain, from 0 at its lowest to 1 at its highest. */
export function ratioOf(value: number, domain: Domain) {
  const span = domain.max - domain.min;
  if (span === 0) {
    return 0;
  }
  const offset = value - domain.min;
  return offset / span;
}

/** A flat series still needs room above and below it to be drawn. */
function spanOf(domain: Domain) {
  const span = domain.max - domain.min;
  if (span > 0) {
    return span;
  }
  const size = Math.abs(domain.max);
  return Math.max(size, 1);
}

function niceStepOf(roughStep: number) {
  const logarithm = Math.log10(roughStep);
  const exponent = Math.floor(logarithm);
  const magnitude = 10 ** exponent;
  const factor = NICE_FACTORS.find((candidate) => {
    const candidateStep = candidate * magnitude;
    return candidateStep >= roughStep;
  });
  const safeFactor = factor ?? 10;
  return safeFactor * magnitude;
}

function decimalsOf(step: number) {
  const logarithm = Math.log10(step);
  const exponent = Math.floor(logarithm);
  return Math.max(0, -exponent);
}

/** Adding zero turns a negative zero into zero, which a number format would write as -0. */
function roundedTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  const scaled = Math.round(value * factor);
  const rounded = scaled / factor;
  return rounded + 0;
}

/** A scale with round ticks that holds the whole domain, in at most `maxLines` steps. */
export function niceScaleOf(domain: Domain, maxLines: number): Scale {
  const span = spanOf(domain);
  const roughStep = span / maxLines;
  const step = niceStepOf(roughStep);
  const decimals = decimalsOf(step);
  const stepsBelow = Math.floor(domain.min / step);
  const lowest = stepsBelow * step;
  const highestWanted = Math.max(domain.max, lowest + step);
  const stepsAbove = Math.ceil(highestWanted / step);
  const lineCount = stepsAbove - stepsBelow;
  const tickCount = lineCount + 1;
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const tick = lowest + index * step;
    return roundedTo(tick, decimals);
  });
  const lastIndex = ticks.length - 1;
  return { min: ticks[0], max: ticks[lastIndex], step, ticks };
}

/** Columns share the plot equally and a mark sits in the middle of its column. */
export function columnCenterOf(index: number, count: number) {
  const center = index + 0.5;
  return center / count;
}

export function columnIndexAt(ratio: number, count: number) {
  const rawIndex = Math.floor(ratio * count);
  const lastIndex = Math.max(count - 1, 0);
  return clamp(rawIndex, 0, lastIndex);
}

export function percentOf(share: number) {
  const percent = share * 100;
  return `${percent}%`;
}

/** The whole numbers that lead from one position to another: the start is left out, the end is kept. */
export function positionsTo(from: number, to: number) {
  const gap = to - from;
  const distance = Math.abs(gap);
  const direction = Math.sign(gap);
  return Array.from({ length: distance }, (_, index) => {
    const travelled = index + 1;
    const offset = travelled * direction;
    return from + offset;
  });
}
