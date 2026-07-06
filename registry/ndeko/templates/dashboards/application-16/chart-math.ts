export type Point = {
  x: number;
  y: number;
};

/** Paths are drawn in a box this wide and stretched to the plot, so a change of width never redraws them. */
export const VIEW_WIDTH = 1000;

/** Every chart draws this many gridlines above zero, so the lines stay put and only their figures change. */
export const GRID_STEPS = 4;

const NICE_FACTORS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export type Scale = {
  max: number;
  ticks: number[];
};

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

/** Four equal steps from zero that hold the largest value, so the plot keeps five lines whatever the data. */
export function niceScaleOf(largest: number): Scale {
  const safeLargest = Math.max(largest, 1);
  const roughStep = safeLargest / GRID_STEPS;
  const step = niceStepOf(roughStep);
  const ticks = Array.from({ length: GRID_STEPS + 1 }, (_, index) => {
    return index * step;
  });
  return { max: step * GRID_STEPS, ticks };
}

export function shareOf(value: number, max: number) {
  if (max === 0) {
    return 0;
  }
  return value / max;
}

export function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

function commandOf(point: Point, index: number) {
  const x = point.x.toFixed(1);
  const y = point.y.toFixed(1);
  if (index === 0) {
    return `M${x} ${y}`;
  }
  return `L${x} ${y}`;
}

export function linePathOf(points: readonly Point[]) {
  const commands = points.map((point, index) => commandOf(point, index));
  return commands.join(' ');
}

export function areaPathOf(points: readonly Point[], levelY: number) {
  if (points.length === 0) {
    return '';
  }
  const line = linePathOf(points);
  const lastIndex = points.length - 1;
  const firstX = points[0].x.toFixed(1);
  const lastX = points[lastIndex].x.toFixed(1);
  const level = levelY.toFixed(1);
  return `${line} L${lastX} ${level} L${firstX} ${level} Z`;
}

export function pointsOf(
  values: readonly number[],
  max: number,
  height: number
) {
  const lastIndex = Math.max(values.length - 1, 1);
  return values.map((value, index) => {
    const x = (index / lastIndex) * VIEW_WIDTH;
    const share = shareOf(value, max);
    const y = height - share * height;
    return { x, y };
  });
}
