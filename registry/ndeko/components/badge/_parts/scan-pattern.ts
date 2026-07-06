import { hashOf } from '@/registry/ndeko/lib/seeded';

export const GRID = 15;

/** An eye is the mark at a corner of a code: a ring of modules round an empty ring and a dot. */
const EYE = 5;

const EYE_MARGIN = 1;

const DATA_DENSITY_PERCENT = 50;

/** The padding of the card round the code and the gap under it, in modules: the grains need them to know how far the badge is. */
export const CARD_PADDING = 1.25;

export const BADGE_GAP = 1.25;

/** A grain ends this far into the badge, where the badge hides it. */
const SINK = 0.9;

const LAND_AT = GRID + CARD_PADDING + BADGE_GAP + SINK;

/** The longest fall, from the top row, in milliseconds. A nearer grain falls for less, as under gravity. */
const FALL_MS = 700;

/** The bottom row sets off first and the top row this long after it. */
const POUR_SPAN_MS = 520;

const POUR_JITTER_MS = 140;

/** The cells grow back from the top left corner to the bottom right one in this span. */
const GROW_SPAN_MS = 600;

const GROW_JITTER_MS = 80;

/** How far to the middle of the code a grain drifts on its way down, so the cells gather into a stream. */
const FUNNEL = 0.6;

export type Grain = {
  col: number;
  row: number;
  /** How far the grain travels across, in modules, to reach the stream. */
  fallX: number;
  /** How far it travels down, in modules, to reach the badge. */
  fallY: number;
  fallMs: number;
  /** When it sets off, counted from the moment the code is scanned. */
  pourDelayMs: number;
  /** When it starts to grow back, counted from the moment the code is ready again. */
  growDelayMs: number;
};

type Spot = {
  col: number;
  row: number;
};

type Offsets = {
  across: number;
  down: number;
};

const EYE_CORNERS: readonly Spot[] = [
  { col: 0, row: 0 },
  { col: GRID - EYE, row: 0 },
  { col: 0, row: GRID - EYE },
];

function hundredthsOf(value: number) {
  return Math.round(value * 100) / 100;
}

function offsetsIn(corner: Spot, spot: Spot): Offsets {
  return { across: spot.col - corner.col, down: spot.row - corner.row };
}

function isInsideBox(offsets: Offsets, from: number, to: number) {
  const isInsideAcross = offsets.across >= from && offsets.across < to;
  const isInsideDown = offsets.down >= from && offsets.down < to;
  return isInsideAcross && isInsideDown;
}

function eyeHolding(spot: Spot, margin: number) {
  return EYE_CORNERS.find((corner) => {
    const offsets = offsetsIn(corner, spot);
    return isInsideBox(offsets, -margin, EYE + margin);
  });
}

function isOnEyeRing(offsets: Offsets) {
  const last = EYE - 1;
  const isEdgeAcross = offsets.across === 0 || offsets.across === last;
  const isEdgeDown = offsets.down === 0 || offsets.down === last;
  return isEdgeAcross || isEdgeDown;
}

function isEyeDot(offsets: Offsets) {
  const middle = (EYE - 1) / 2;
  const isMiddleAcross = offsets.across === middle;
  const isMiddleDown = offsets.down === middle;
  return isMiddleAcross && isMiddleDown;
}

function isDataModule(value: string, spot: Spot) {
  const hash = hashOf(`${value}:${spot.col}:${spot.row}`);
  const share = (hash >>> 11) % 100;
  return share < DATA_DENSITY_PERCENT;
}

function isFilled(value: string, spot: Spot) {
  const eye = eyeHolding(spot, 0);
  if (eye) {
    const offsets = offsetsIn(eye, spot);
    return isOnEyeRing(offsets) || isEyeDot(offsets);
  }
  const isBesideEye = eyeHolding(spot, EYE_MARGIN) !== undefined;
  if (isBesideEye) {
    return false;
  }
  return isDataModule(value, spot);
}

/** A steady number between 0 and 1 for a spot, so a grain never changes its mind between two renders. */
function jitterOf(value: string, spot: Spot) {
  const hash = hashOf(`${value}|${spot.col}|${spot.row}|grain`);
  const thousandths = (hash >>> 6) % 1000;
  return thousandths / 1000;
}

function grainOf(value: string, spot: Spot): Grain {
  const jitter = jitterOf(value, spot);
  const fallY = LAND_AT - spot.row;
  const towardsStream = GRID / 2 - (spot.col + 0.5);
  const nearness = fallY / LAND_AT;
  const fallMs = Math.round(FALL_MS * Math.sqrt(nearness));
  const rowsBelow = (GRID - 1 - spot.row) / (GRID - 1);
  const pourDelayMs = Math.round(
    rowsBelow * POUR_SPAN_MS + jitter * POUR_JITTER_MS
  );
  const diagonal = (spot.col + spot.row) / (2 * (GRID - 1));
  const growDelayMs = Math.round(
    diagonal * GROW_SPAN_MS + jitter * GROW_JITTER_MS
  );
  return {
    col: spot.col,
    row: spot.row,
    fallX: hundredthsOf(towardsStream * FUNNEL),
    fallY: hundredthsOf(fallY),
    fallMs,
    pourDelayMs,
    growDelayMs,
  };
}

/**
 * The cells of a code drawn from a text, each with the way it falls into the badge and the way it
 * grows back. The same text always gives the same code, on the server and in the browser.
 */
export function grainsOf(value: string): Grain[] {
  const grains: Grain[] = [];
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const spot: Spot = { col, row };
      if (isFilled(value, spot)) {
        grains.push(grainOf(value, spot));
      }
    }
  }
  return grains;
}
