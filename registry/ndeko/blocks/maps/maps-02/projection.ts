/**
 * The dotted map is equirectangular: 106 by 40 units over these bounds, drawn in a view box with
 * half a unit of edge. Its overlay places points the same way, so markers sit on the land dots.
 */
const MAP_WIDTH = 106;

const MAP_HEIGHT = 40;

const EDGE = 0.5;

const LONGITUDE_MIN = -180;

const LONGITUDE_SPAN = 360;

const LATITUDE_MAX = 80;

const LATITUDE_SPAN = 136;

const BOTH_EDGES = EDGE * 2;

export const VIEW_WIDTH = MAP_WIDTH + BOTH_EDGES;

const VIEW_HEIGHT = MAP_HEIGHT + BOTH_EDGES;

export const VIEW_BOX = `${-EDGE} ${-EDGE} ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

/** A route bows away from its chord by this share of its length, within these bounds, in map units. */
const BOW_SHARE = 0.15;

const BOW_MIN = 1;

const BOW_MAX = 5;

export type MapPoint = {
  x: number;
  y: number;
};

export type Share = {
  left: number;
  top: number;
};

function clamp(value: number, min: number, max: number) {
  const atLeast = Math.max(value, min);
  return Math.min(atLeast, max);
}

function scaled(point: MapPoint, factor: number): MapPoint {
  const x = point.x * factor;
  const y = point.y * factor;
  return { x, y };
}

function added(first: MapPoint, second: MapPoint): MapPoint {
  const x = first.x + second.x;
  const y = first.y + second.y;
  return { x, y };
}

export function pointOf(latitude: number, longitude: number): MapPoint {
  const fromWest = longitude - LONGITUDE_MIN;
  const fromNorth = LATITUDE_MAX - latitude;
  const westShare = fromWest / LONGITUDE_SPAN;
  const northShare = fromNorth / LATITUDE_SPAN;
  const x = westShare * MAP_WIDTH;
  const y = northShare * MAP_HEIGHT;
  return { x, y };
}

/** Where a point sits in the box of the map, from 0 to 1 on each side. */
export function shareOf(point: MapPoint): Share {
  const fromLeft = point.x + EDGE;
  const fromTop = point.y + EDGE;
  const left = fromLeft / VIEW_WIDTH;
  const top = fromTop / VIEW_HEIGHT;
  return { left, top };
}

function midpointOf(from: MapPoint, to: MapPoint): MapPoint {
  const sum = added(from, to);
  return scaled(sum, 0.5);
}

/** Of the two directions square to a chord, the one that points up the map, so routes bow north. */
function bowDirectionOf(from: MapPoint, to: MapPoint): MapPoint {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const across = { x: dy, y: -dx };
  const first = scaled(across, 1 / length);
  const second = scaled(first, -1);
  if (second.y < first.y) {
    return second;
  }
  return first;
}

/**
 * How far the middle of a route stands from its chord. A quadratic curve reaches half the distance
 * to its control point, so the control point stands twice as far. A light that travels the route
 * either way uses the bend of the route as it is listed, so it follows the drawn curve.
 */
export function bendOf(from: MapPoint, to: MapPoint): MapPoint {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const share = length * BOW_SHARE;
  const bow = clamp(share, BOW_MIN, BOW_MAX);
  const direction = bowDirectionOf(from, to);
  return scaled(direction, bow);
}

export function arcPathOf(from: MapPoint, to: MapPoint) {
  const middle = midpointOf(from, to);
  const bend = bendOf(from, to);
  const reach = scaled(bend, 2);
  const control = added(middle, reach);
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}
