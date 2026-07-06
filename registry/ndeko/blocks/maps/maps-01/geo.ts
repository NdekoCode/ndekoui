import type { GlobeLocation } from '@/components/core/globe';

type Vector = [x: number, y: number, z: number];

/** Two places this close, or exactly opposite, have no single path between them to follow. */
const SAME_PLACE = 0.0001;

/**
 * How far to the south of a route the globe looks from. Seen from a point on the route, an arc runs
 * through the centre as a straight line; seen from here it bows over the surface, and both ends of a
 * route of sixty degrees sit about thirty-five degrees from the centre, well inside the disk.
 */
const ROUTE_VIEW_ASIDE_DEG = 20;

/** A picked region sits this far above the centre, so an arc that leaves it bows instead of running straight. */
const REGION_VIEW_SOUTH_DEG = 15;

/**
 * The globe draws its markers a little above the sphere and hides only those behind the disk, so a
 * marker near the rim, or just past it, is drawn outside the disk. One shows only this close to the
 * centre of a view, which keeps the largest dot inside the disk up to about sixty-eight degrees.
 */
const MARKER_REACH_DEG = 60;

function radiansOf(degrees: number) {
  const halfTurns = degrees / 180;
  return halfTurns * Math.PI;
}

function degreesOf(radians: number) {
  const halfTurns = radians / Math.PI;
  return halfTurns * 180;
}

function vectorOf([latitude, longitude]: GlobeLocation): Vector {
  const latitudeAngle = radiansOf(latitude);
  const longitudeAngle = radiansOf(longitude);
  const ring = Math.cos(latitudeAngle);
  const x = ring * Math.cos(longitudeAngle);
  const y = ring * Math.sin(longitudeAngle);
  const z = Math.sin(latitudeAngle);
  return [x, y, z];
}

/** Rounding can push a sine or a cosine a hair past 1, where the inverse functions give no answer. */
function withinUnit(value: number) {
  const atMostOne = Math.min(1, value);
  return Math.max(-1, atMostOne);
}

function locationOf([x, y, z]: Vector): GlobeLocation {
  const height = withinUnit(z);
  const latitudeAngle = Math.asin(height);
  const longitudeAngle = Math.atan2(y, x);
  const latitude = degreesOf(latitudeAngle);
  const longitude = degreesOf(longitudeAngle);
  return [latitude, longitude];
}

function alignmentOf(first: Vector, second: Vector) {
  const alongX = first[0] * second[0];
  const alongY = first[1] * second[1];
  const alongZ = first[2] * second[2];
  const flat = alongX + alongY;
  return flat + alongZ;
}

function sumOf(first: Vector, second: Vector): Vector {
  const x = first[0] + second[0];
  const y = first[1] + second[1];
  const z = first[2] + second[2];
  return [x, y, z];
}

function scaledOf([x, y, z]: Vector, factor: number): Vector {
  const scaledX = x * factor;
  const scaledY = y * factor;
  const scaledZ = z * factor;
  return [scaledX, scaledY, scaledZ];
}

/** A route with no length has no direction: it stays at zero instead of dividing by it. */
function unitOf(vector: Vector): Vector {
  const length = Math.hypot(...vector);
  if (length === 0) {
    return vector;
  }
  return scaledOf(vector, 1 / length);
}

function crossOf(first: Vector, second: Vector): Vector {
  const xUp = first[1] * second[2];
  const xDown = first[2] * second[1];
  const yUp = first[2] * second[0];
  const yDown = first[0] * second[2];
  const zUp = first[0] * second[1];
  const zDown = first[1] * second[0];
  const x = xUp - xDown;
  const y = yUp - yDown;
  const z = zUp - zDown;
  return [x, y, z];
}

function blend(
  start: number,
  end: number,
  startWeight: number,
  endWeight: number
) {
  const fromStart = start * startWeight;
  const fromEnd = end * endWeight;
  return fromStart + fromEnd;
}

/** The point a share of the way from one place to another, along the shortest path over the globe. */
export function pointAlong(
  from: GlobeLocation,
  to: GlobeLocation,
  share: number
): GlobeLocation {
  const start = vectorOf(from);
  const end = vectorOf(to);
  const alignment = alignmentOf(start, end);
  const bounded = withinUnit(alignment);
  const angle = Math.acos(bounded);
  const spread = Math.sin(angle);
  if (spread < SAME_PLACE) {
    return to;
  }
  const rest = 1 - share;
  const startAngle = rest * angle;
  const endAngle = share * angle;
  const startTurn = Math.sin(startAngle);
  const endTurn = Math.sin(endAngle);
  const startWeight = startTurn / spread;
  const endWeight = endTurn / spread;
  const x = blend(start[0], end[0], startWeight, endWeight);
  const y = blend(start[1], end[1], startWeight, endWeight);
  const z = blend(start[2], end[2], startWeight, endWeight);
  return locationOf([x, y, z]);
}

/** Fast at the start and slow at the end, the way a line is drawn by hand. */
export function drawnShareOf(progress: number) {
  const left = 1 - progress;
  const leftCubed = left ** 3;
  return 1 - leftCubed;
}

/** The pole of the circle a route runs along, taken on its southern side. */
function southSideOf(start: Vector, end: Vector): Vector {
  const across = crossOf(start, end);
  const pole = unitOf(across);
  const isNorthern = pole[2] > 0;
  if (isNorthern) {
    return scaledOf(pole, -1);
  }
  return pole;
}

/** Where the globe looks from to show a route: past its middle, a little to its south. */
export function routeViewOf(from: GlobeLocation, to: GlobeLocation) {
  const start = vectorOf(from);
  const end = vectorOf(to);
  const sum = sumOf(start, end);
  const middle = unitOf(sum);
  const side = southSideOf(start, end);
  const aside = radiansOf(ROUTE_VIEW_ASIDE_DEG);
  const middleShare = Math.cos(aside);
  const sideShare = Math.sin(aside);
  const fromMiddle = scaledOf(middle, middleShare);
  const fromSide = scaledOf(side, sideShare);
  const view = sumOf(fromMiddle, fromSide);
  return locationOf(view);
}

export function regionViewOf([latitude, longitude]: GlobeLocation) {
  const southern = latitude - REGION_VIEW_SOUTH_DEG;
  const view: GlobeLocation = [southern, longitude];
  return view;
}

/** The angle between two places, seen from the centre of the earth, in degrees. */
export function degreesApartOf(first: GlobeLocation, second: GlobeLocation) {
  const start = vectorOf(first);
  const end = vectorOf(second);
  const alignment = alignmentOf(start, end);
  const bounded = withinUnit(alignment);
  const angle = Math.acos(bounded);
  return degreesOf(angle);
}

export function isNearCentreOf(location: GlobeLocation, view: GlobeLocation) {
  const apart = degreesApartOf(location, view);
  return apart <= MARKER_REACH_DEG;
}
