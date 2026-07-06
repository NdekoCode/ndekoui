import { columnCenterOf, lerp, ratioOf, type Domain } from './scale';

export type Point = {
  x: number;
  y: number;
};

/** Paths are drawn in a box this wide and stretched to the plot, so a change of width never redraws them. */
export const VIEW_WIDTH = 1000;

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

/** The line closed down (or up) to a level, for the wash under a line. */
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

/** The surface between two lines that share their x positions, for a range around a line. */
export function bandPathOf(upper: readonly Point[], lower: readonly Point[]) {
  if (upper.length === 0) {
    return '';
  }
  const backwards = [...lower].reverse();
  const outline = [...upper, ...backwards];
  const line = linePathOf(outline);
  return `${line} Z`;
}

/** The pixel height of a value in a plot: the top of the domain is 0, its bottom is the plot height. */
export function yOf(value: number, domain: Domain, height: number) {
  const ratio = ratioOf(value, domain);
  const fromBottom = ratio * height;
  return height - fromBottom;
}

/** One point per value, each in the middle of its column. */
export function plotPointsOf(
  values: readonly number[],
  domain: Domain,
  height: number
): Point[] {
  return values.map((value, index) => {
    const share = columnCenterOf(index, values.length);
    const x = share * VIEW_WIDTH;
    const y = yOf(value, domain, height);
    return { x, y };
  });
}

/** How many of the pieces lie before a segment when they are shared out evenly. */
function piecesBefore(
  segment: number,
  segmentCount: number,
  pieceCount: number
) {
  const share = segment / segmentCount;
  return Math.floor(share * pieceCount);
}

/**
 * The same line through exactly `count` points: each segment is cut into equal parts, so two lines
 * of different lengths share one structure and one can glide into the other.
 */
export function densifyOf(points: readonly Point[], count: number): Point[] {
  const segmentCount = points.length - 1;
  const hasSegments = segmentCount >= 1;
  const hasRoom = count > points.length;
  if (!hasSegments || !hasRoom) {
    return [...points];
  }
  const pieceCount = count - 1;
  const dense: Point[] = [points[0]];
  for (let segment = 0; segment < segmentCount; segment += 1) {
    const from = points[segment];
    const to = points[segment + 1];
    const start = piecesBefore(segment, segmentCount, pieceCount);
    const end = piecesBefore(segment + 1, segmentCount, pieceCount);
    const parts = end - start;
    for (let part = 1; part <= parts; part += 1) {
      const amount = part / parts;
      const x = lerp(from.x, to.x, amount);
      const y = lerp(from.y, to.y, amount);
      dense.push({ x, y });
    }
  }
  return dense;
}
