import type { CSSProperties } from 'react';

export type SoundRingSize = 'sm' | 'md' | 'lg';

export type RingSpec = {
  px: number;
  bars: number;
  inner: number;
  length: number;
  width: number;
};

/** A bar at full scale ends at the edge of the square: inner plus length is half of it. */
export const RING_SPEC: Record<SoundRingSize, RingSpec> = {
  sm: { px: 20, bars: 24, inner: 6, length: 4, width: 1 },
  md: { px: 40, bars: 24, inner: 12, length: 8, width: 2 },
  lg: { px: 96, bars: 32, inner: 28.8, length: 19.2, width: 4 },
};

/** One turn of the peak round the ring at its base speed: the level makes it shorter or longer. */
export const LAP_MS = 1800;

const REST_SCALE = 0.22;

const REST_OPACITY = 0.32;

/** A peak is a smooth hump that falls to nothing this many bars away on each side. */
const REACH_BARS = 5;

const PEAK_LIFT = 0.88;

const ECHO_LIFT = 0.36;

/** The echo comes half a lap after the peak, straight across the ring. */
const ECHO_SHARE_OF_LAP = 0.5;

/** Under reduced motion the peak stands this share of the ring clockwise from the top. */
const STILL_PEAK_SHARE = 0.15;

function wrappedGap(first: number, second: number, bars: number) {
  const difference = Math.abs(first - second);
  const gap = difference % bars;
  const other = bars - gap;
  return Math.min(gap, other);
}

function humpOf(distance: number) {
  if (distance >= REACH_BARS) {
    return 0;
  }
  const share = distance / REACH_BARS;
  const angle = Math.PI * share;
  const cosine = Math.cos(angle);
  const lifted = 1 + cosine;
  return lifted / 2;
}

/**
 * How high a bar stands, from 0 at rest to 1 at full height, at a place of its lap counted in bars.
 * A lap starts at rest, so a bar that has not begun its lap yet is already in the right pose.
 */
function liftAt(place: number, bars: number) {
  const echoOffset = bars * ECHO_SHARE_OF_LAP;
  const echoCenter = REACH_BARS + echoOffset;
  const peakGap = wrappedGap(place, REACH_BARS, bars);
  const echoGap = wrappedGap(place, echoCenter, bars);
  const peakHump = humpOf(peakGap);
  const echoHump = humpOf(echoGap);
  const peak = PEAK_LIFT * peakHump;
  const echo = ECHO_LIFT * echoHump;
  const total = peak + echo;
  return Math.min(1, total);
}

function roundedTo(value: number, digits: number) {
  const factor = 10 ** digits;
  const scaled = value * factor;
  const rounded = Math.round(scaled);
  return rounded / factor;
}

function liftedFrom(rest: number, lift: number) {
  const span = 1 - rest;
  const climb = span * lift;
  return rest + climb;
}

type BarPose = {
  transform: string;
  opacity: number;
};

function poseOf(spec: RingSpec, lift: number): BarPose {
  const scale = liftedFrom(REST_SCALE, lift);
  const opacity = liftedFrom(REST_OPACITY, lift);
  const scaleText = roundedTo(scale, 3);
  const shownOpacity = roundedTo(opacity, 3);
  const transform = `translateY(-${spec.inner}px) scaleY(${scaleText})`;
  return { transform, opacity: shownOpacity };
}

function lapLiftsOf(bars: number) {
  const lifts: number[] = [];
  for (let knot = 0; knot <= bars; knot += 1) {
    lifts.push(liftAt(knot, bars));
  }
  return lifts;
}

function isNeededKnot(lifts: number[], knot: number) {
  const isEdge = knot === 0 || knot === lifts.length - 1;
  const isLifted = lifts[knot] > 0;
  const followsLift = lifts[knot - 1] > 0;
  const precedesLift = lifts[knot + 1] > 0;
  return isEdge || isLifted || followsLift || precedesLift;
}

/**
 * The lap of one bar, shared by every bar of the ring: a knot per bar along the lap, where the
 * stretches of rest between the two humps need no knot of their own.
 */
export function lapKeyframesOf(spec: RingSpec) {
  const lifts = lapLiftsOf(spec.bars);
  const keyframes: Keyframe[] = [];
  for (let knot = 0; knot < lifts.length; knot += 1) {
    if (!isNeededKnot(lifts, knot)) {
      continue;
    }
    const pose = poseOf(spec, lifts[knot]);
    const offset = knot / spec.bars;
    keyframes.push({ offset, ...pose });
  }
  return keyframes;
}

/** Each bar starts its lap a bar later than the one before it, so the peak turns clockwise. */
export function lapDelayOf(index: number, bars: number) {
  const share = index / bars;
  return share * LAP_MS;
}

function barStyleOf(
  index: number,
  spec: RingSpec,
  lift: number
): CSSProperties {
  const share = index / spec.bars;
  const degrees = share * 360;
  const halfWidth = spec.width / 2;
  const pose = poseOf(spec, lift);
  return {
    width: spec.width,
    height: spec.length,
    marginLeft: -halfWidth,
    rotate: `${degrees}deg`,
    transform: pose.transform,
    opacity: pose.opacity,
  };
}

export function restStyleOf(index: number, spec: RingSpec) {
  return barStyleOf(index, spec, 0);
}

function stillLiftOf(index: number, bars: number) {
  const peakBar = STILL_PEAK_SHARE * bars;
  const fromPeak = index - peakBar;
  const place = REACH_BARS - fromPeak;
  return liftAt(place, bars);
}

/** The pose of a bar under reduced motion: the ring stands on one frame of its lap and stays there. */
export function stillStyleOf(index: number, spec: RingSpec) {
  const lift = stillLiftOf(index, spec.bars);
  return barStyleOf(index, spec, lift);
}
