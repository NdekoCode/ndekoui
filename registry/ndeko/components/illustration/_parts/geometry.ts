export type ScenePoint = {
  /** Share of the stage width, from 0 to 1. */
  x: number;
  /** Share of the stage height, from 0 to 1. */
  y: number;
};

export type SceneSpan = {
  /** Length of the line as a percentage of the stage width. */
  lengthPercent: number;
  /** Angle of the line in degrees, clockwise from the right, as CSS turns it. */
  angleDeg: number;
};

const HALF_TURN_DEG = 180;

const FULL_TURN_DEG = 360;

/**
 * Two engines can disagree on the last digit of a sine. A value written into a style is rounded, so
 * the server and the browser print the same text.
 */
export function rounded(value: number) {
  const hundredths = Math.round(value * 100);
  return hundredths / 100;
}

export function percentOf(share: number) {
  const percent = rounded(share * 100);
  return `${percent}%`;
}

export function degreesOf(radians: number) {
  return (radians * HALF_TURN_DEG) / Math.PI;
}

export function radiansOf(degrees: number) {
  return (degrees * Math.PI) / HALF_TURN_DEG;
}

/** The angle equal to `target` that is closest to `current`, so a turn towards it goes the short way round. */
export function nearestAngleOf(target: number, current: number) {
  const difference = target - current;
  const turns = Math.round(difference / FULL_TURN_DEG);
  const wrapped = difference - FULL_TURN_DEG * turns;
  return current + wrapped;
}

/** The line between two points of a stage that is `aspect` times wider than it is tall. */
export function spanBetween(
  from: ScenePoint,
  to: ScenePoint,
  aspect: number
): SceneSpan {
  const acrossShare = to.x - from.x;
  const downShare = to.y - from.y;
  const downInWidths = downShare / aspect;
  const lengthInWidths = Math.hypot(acrossShare, downInWidths);
  const angle = Math.atan2(downInWidths, acrossShare);
  const degrees = degreesOf(angle);
  return {
    lengthPercent: rounded(lengthInWidths * 100),
    angleDeg: rounded(degrees),
  };
}

/** Where a tile centred on a point of the stage goes: its `left` and `top`. */
export function placeOf(point: ScenePoint) {
  return { left: percentOf(point.x), top: percentOf(point.y) };
}
