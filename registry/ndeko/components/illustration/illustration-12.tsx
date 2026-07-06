'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import {
  DOTTED_MAP_BOUNDS,
  DOTTED_MAP_HEIGHT,
  DOTTED_MAP_PATH,
  DOTTED_MAP_WIDTH,
} from '@/components/core/dotted-map-points';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { penOf, tokenOf, watchTheme } from './_parts/canvas';
import { degreesOf, nearestAngleOf, radiansOf } from './_parts/geometry';
import { useScenePlay } from './_parts/use-scene-play';

export type HelloLanguage = {
  /** The language tag, also set on the greeting: `ru`. */
  tag: string;
  name: string;
  endonym: string;
  script: string;
  greeting: string;
  isRightToLeft?: boolean;
  /** Where its greeting stands on the globe, and where the globe turns to when it is picked. */
  centre: [latitude: number, longitude: number];
};

/** Another place of the globe, with the greeting written there. */
export type HelloPlace = {
  greeting: string;
  location: [latitude: number, longitude: number];
};

/** A run of points on one line of the map, in the units of its grid. */
type MapRun = {
  column: number;
  line: number;
  length: number;
};

/** A place on a sphere of radius one: towards the east, towards the north pole, towards longitude zero. */
type Vector = {
  east: number;
  north: number;
  front: number;
};

/** Every point of land as a place on the sphere. */
type Land = {
  count: number;
  east: Float32Array;
  north: Float32Array;
  front: Float32Array;
};

/** A greeting where it is written. `language` is its row in the list, or none for another place. */
type Word = {
  text: string;
  place: Vector;
  language: number;
};

/** How far the ink of a word reaches from its centre and from its baseline, at the reference size. */
type Ink = {
  left: number;
  right: number;
  ascent: number;
  descent: number;
};

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** Where a word stands in the frame being drawn. */
type WordFrame = {
  x: number;
  y: number;
  /** How much it faces the viewer: 0 near the rim and behind, 1 towards the middle. */
  facing: number;
  /** How much it is the picked greeting, from 0 to 1. */
  emphasis: number;
  size: number;
  box: Box;
  isPlaced: boolean;
};

type Turn = {
  fromLongitude: number;
  fromLatitude: number;
  toLongitude: number;
  toLatitude: number;
  startedAt: number;
};

/** How the globe is turned, as the sines and cosines a frame needs for every point. */
type Facing = {
  sinLongitude: number;
  cosLongitude: number;
  sinLatitude: number;
  cosLatitude: number;
};

/** Where a point of the sphere lands on the picture: across and up from its centre, and how far it faces the viewer. */
type Seen = {
  across: number;
  up: number;
  depth: number;
};

type GlobeState = {
  canvas: HTMLCanvasElement;
  pen: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  centreX: number;
  centreY: number;
  radius: number;
  land: Land;
  words: Word[];
  frames: WordFrame[];
  /** How far each word has faded in, from 0 to 1. */
  shown: Float32Array;
  areWordsSettled: boolean;
  inks: Map<string, Ink>;
  centres: HelloLanguage['centre'][];
  family: string;
  dotColor: string;
  wordColor: string;
  litColor: string;
  longitude: number;
  latitude: number;
  turn: Turn | null;
  lit: number;
  fading: number;
  /** How much of the light has passed from the language that fades to the one that is lit, from 0 to 1. */
  glow: number;
  spinLongitude: number;
  spinLatitude: number;
  grabbedBy: number | null;
  lastX: number;
  lastY: number;
  lastMoveAt: number;
  isLive: boolean;
  frame: number;
  lastTick: number;
  lastDrawAt: number;
};

type WordGlobe = {
  turnTo: (index: number) => void;
  setLive: (isLive: boolean) => void;
  grab: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  release: (event: PointerEvent) => void;
  dispose: () => void;
};

const NO_LANGUAGE = -1;

const TAU = Math.PI * 2;

const LONGITUDE_SPAN = DOTTED_MAP_BOUNDS.lngMax - DOTTED_MAP_BOUNDS.lngMin;

const LATITUDE_SPAN = DOTTED_MAP_BOUNDS.latMax - DOTTED_MAP_BOUNDS.latMin;

/** The globe stops this short of the canvas edge, so the dots on its rim are drawn whole. */
const RIM_PX = 2;

const BODY_ALPHA = 0.04;

/** Dots are sorted into a few steps by how much they face the viewer, and each step is filled at once. */
const DOT_STEPS = 5;

const DOT_RIM_PX = 0.7;

const DOT_FRONT_PX = 1.2;

const DOT_RIM_ALPHA = 0.1;

const DOT_FRONT_ALPHA = 0.34;

/** More greetings than this at once and the globe reads as a page of text. */
const MAX_WORDS = 8;

const WORD_PX = 13;

const PICKED_WORD_PX = 15;

const WORD_WEIGHT = 500;

const WORD_PAD_PX = 3;

const WORD_GAP_PX = 4;

/** A word fades in as it turns from the rim towards the viewer, between these depths. */
const WORD_FADE_FROM = 0.3;

const WORD_FADE_TO = 0.6;

const WORD_FADE_MS = 220;

const MIN_ALPHA = 0.01;

/** The picked greeting claims its room first, then the words already shown, so a word stays put while it can. */
const PICKED_PASS = 0;

const SHOWN_PASS = 1;

const NEW_PASS = 2;

const PASSES = [PICKED_PASS, SHOWN_PASS, NEW_PASS];

const NO_INK: Ink = { left: 0, right: 0, ascent: 0, descent: 0 };

const TURN_MS = 950;

/** A turn shorter than this, in degrees, is not worth a frame. */
const ALREADY_THERE = 0.01;

const MAX_LATITUDE = 70;

const MOMENTUM_DECAY_MS = 420;

const HELD_STILL_MS = 80;

/** Degrees per millisecond under which a spin counts as over. */
const MIN_SPIN = 0.002;

const MAX_SPIN = 0.6;

/** A frame that comes late, after a hidden tab, turns the globe no further than this long would. */
const MAX_STEP_MS = 50;

function shareOfStep(step: number) {
  return (step + 0.5) / DOT_STEPS;
}

function dotRadiusOf(step: number) {
  const share = shareOfStep(step);
  return DOT_RIM_PX + (DOT_FRONT_PX - DOT_RIM_PX) * share;
}

function dotAlphaOf(step: number) {
  const share = shareOfStep(step);
  return DOT_RIM_ALPHA + (DOT_FRONT_ALPHA - DOT_RIM_ALPHA) * share;
}

const DOT_STEP_INDEXES = Array.from({ length: DOT_STEPS }, (_, step) => step);

const DOT_RADII = DOT_STEP_INDEXES.map(dotRadiusOf);

const DOT_ALPHAS = DOT_STEP_INDEXES.map(dotAlphaOf);

function mapRunsOf() {
  const matches = DOTTED_MAP_PATH.matchAll(/M([\d.]+) ([\d.]+)h(\d+)/g);
  const runs: MapRun[] = [];
  for (const match of matches) {
    runs.push({
      column: Number(match[1]),
      line: Number(match[2]),
      length: Number(match[3]),
    });
  }
  return runs;
}

function longitudeOf(column: number) {
  const share = column / DOTTED_MAP_WIDTH;
  return DOTTED_MAP_BOUNDS.lngMin + share * LONGITUDE_SPAN;
}

function latitudeOf(line: number) {
  const share = line / DOTTED_MAP_HEIGHT;
  return DOTTED_MAP_BOUNDS.latMax - share * LATITUDE_SPAN;
}

function vectorOf(latitudeDeg: number, longitudeDeg: number): Vector {
  const latitude = radiansOf(latitudeDeg);
  const longitude = radiansOf(longitudeDeg);
  const ring = Math.cos(latitude);
  return {
    east: ring * Math.sin(longitude),
    north: Math.sin(latitude),
    front: ring * Math.cos(longitude),
  };
}

/** The points of the map as places of the sphere, line by line from north to south. */
function landOf(): Land {
  const vectors: Vector[] = [];
  for (const run of mapRunsOf()) {
    const latitude = latitudeOf(run.line);
    for (let step = 0; step <= run.length; step += 1) {
      const longitude = longitudeOf(run.column + step);
      vectors.push(vectorOf(latitude, longitude));
    }
  }
  const count = vectors.length;
  const land: Land = {
    count,
    east: new Float32Array(count),
    north: new Float32Array(count),
    front: new Float32Array(count),
  };
  vectors.forEach((vector, index) => {
    land.east[index] = vector.east;
    land.north[index] = vector.north;
    land.front[index] = vector.front;
  });
  return land;
}

/** The greetings of the list first, each at its centre, then the other places. */
function wordsOf(languages: HelloLanguage[], places: HelloPlace[]): Word[] {
  const spoken = languages.map((language, index) => ({
    text: language.greeting,
    place: vectorOf(language.centre[0], language.centre[1]),
    language: index,
  }));
  const written = places.map((place) => ({
    text: place.greeting,
    place: vectorOf(place.location[0], place.location[1]),
    language: NO_LANGUAGE,
  }));
  return [...spoken, ...written];
}

function blankFrameOf(): WordFrame {
  return {
    x: 0,
    y: 0,
    facing: 0,
    emphasis: 0,
    size: WORD_PX,
    box: { left: 0, top: 0, right: 0, bottom: 0 },
    isPlaced: false,
  };
}

function fontOf(sizePx: number, family: string) {
  return `${WORD_WEIGHT} ${sizePx}px ${family}`;
}

/** A word is measured once, at the reference size, from its real ink: scripts reach above and below the line differently. */
function inkOf(state: GlobeState, text: string) {
  const known = state.inks.get(text);
  if (known) {
    return known;
  }
  const { pen } = state;
  if (!pen) {
    return NO_INK;
  }
  pen.font = fontOf(WORD_PX, state.family);
  pen.textAlign = 'center';
  pen.textBaseline = 'alphabetic';
  const metrics = pen.measureText(text);
  const ink: Ink = {
    left: metrics.actualBoundingBoxLeft,
    right: metrics.actualBoundingBoxRight,
    ascent: metrics.actualBoundingBoxAscent,
    descent: metrics.actualBoundingBoxDescent,
  };
  state.inks.set(text, ink);
  return ink;
}

function ink(state: GlobeState) {
  const { canvas } = state;
  state.family = getComputedStyle(canvas).fontFamily;
  state.dotColor = tokenOf(canvas, '--foreground');
  state.wordColor = tokenOf(canvas, '--muted-foreground');
  state.litColor = tokenOf(canvas, '--primary-ink');
  state.inks.clear();
}

/** The dots and the words share this one centre and radius, so the globe sits in its disk whatever the box. */
function measure(state: GlobeState) {
  const { canvas } = state;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const shortSide = Math.min(width, height);
  const radius = shortSide / 2 - RIM_PX;
  state.width = width;
  state.height = height;
  state.centreX = width / 2;
  state.centreY = height / 2;
  state.radius = Math.max(radius, 0);
  state.pen = penOf(canvas, width, height);
}

function facingOf(state: GlobeState): Facing {
  const longitude = radiansOf(state.longitude);
  const latitude = radiansOf(state.latitude);
  return {
    sinLongitude: Math.sin(longitude),
    cosLongitude: Math.cos(longitude),
    sinLatitude: Math.sin(latitude),
    cosLatitude: Math.cos(latitude),
  };
}

/** Turns a point of the sphere to where the viewer sees it. The result is written into `seen`, so a frame makes no garbage. */
function see(
  facing: Facing,
  east: number,
  north: number,
  front: number,
  seen: Seen
) {
  const turnedFront = east * facing.sinLongitude + front * facing.cosLongitude;
  seen.across = east * facing.cosLongitude - front * facing.sinLongitude;
  seen.up = north * facing.cosLatitude - turnedFront * facing.sinLatitude;
  seen.depth = north * facing.sinLatitude + turnedFront * facing.cosLatitude;
}

function lightOf(state: GlobeState, language: number) {
  if (language === NO_LANGUAGE) {
    return 0;
  }
  if (language === state.lit) {
    return state.glow;
  }
  if (language === state.fading) {
    return 1 - state.glow;
  }
  return 0;
}

function rampOf(from: number, to: number, value: number) {
  const progress = (value - from) / (to - from);
  const atLeast = Math.max(0, progress);
  const bounded = Math.min(1, atLeast);
  const squared = bounded * bounded;
  const easing = 3 - 2 * bounded;
  return squared * easing;
}

function frameWord(
  state: GlobeState,
  index: number,
  facing: Facing,
  seen: Seen
) {
  const word = state.words[index];
  const frame = state.frames[index];
  const { place } = word;
  see(facing, place.east, place.north, place.front, seen);
  const emphasis = lightOf(state, word.language);
  const sizeGap = PICKED_WORD_PX - WORD_PX;
  const size = WORD_PX + sizeGap * emphasis;
  const scale = size / WORD_PX;
  const wordInk = inkOf(state, word.text);
  const halfHeight = ((wordInk.ascent + wordInk.descent) * scale) / 2;
  const reachLeft = wordInk.left * scale + WORD_PAD_PX;
  const reachRight = wordInk.right * scale + WORD_PAD_PX;
  const reachUp = halfHeight + WORD_PAD_PX;
  const x = state.centreX + seen.across * state.radius;
  const y = state.centreY - seen.up * state.radius;
  frame.x = x;
  frame.y = y;
  frame.facing = rampOf(WORD_FADE_FROM, WORD_FADE_TO, seen.depth);
  frame.emphasis = emphasis;
  frame.size = size;
  frame.isPlaced = false;
  frame.box.left = x - reachLeft;
  frame.box.right = x + reachRight;
  frame.box.top = y - reachUp;
  frame.box.bottom = y + reachUp;
}

function isWithinDisk(state: GlobeState, x: number, y: number) {
  const across = x - state.centreX;
  const down = y - state.centreY;
  const reach = state.radius - 1;
  const distanceSquared = across * across + down * down;
  return distanceSquared <= reach * reach;
}

function isInsideDisk(state: GlobeState, box: Box) {
  const isTopLeftIn = isWithinDisk(state, box.left, box.top);
  const isTopRightIn = isWithinDisk(state, box.right, box.top);
  const isBottomLeftIn = isWithinDisk(state, box.left, box.bottom);
  const isBottomRightIn = isWithinDisk(state, box.right, box.bottom);
  const isTopIn = isTopLeftIn && isTopRightIn;
  const isBottomIn = isBottomLeftIn && isBottomRightIn;
  return isTopIn && isBottomIn;
}

function boxesOverlap(first: Box, second: Box) {
  const isLeftOf = first.right + WORD_GAP_PX <= second.left;
  const isRightOf = second.right + WORD_GAP_PX <= first.left;
  const isAbove = first.bottom + WORD_GAP_PX <= second.top;
  const isBelow = second.bottom + WORD_GAP_PX <= first.top;
  const isApartAcross = isLeftOf || isRightOf;
  const isApartDown = isAbove || isBelow;
  return !isApartAcross && !isApartDown;
}

function passOf(state: GlobeState, index: number) {
  const word = state.words[index];
  const isPicked = word.language === state.lit;
  if (isPicked) {
    return PICKED_PASS;
  }
  const isShown = state.shown[index] > 0.5;
  if (isShown) {
    return SHOWN_PASS;
  }
  return NEW_PASS;
}

/** A placed word is in the way of every other one. A word still fading out is in the way of a newcomer only, so two never cross. */
function isInTheWay(
  state: GlobeState,
  otherIndex: number,
  isNewcomer: boolean
) {
  const other = state.frames[otherIndex];
  const isVisible = state.shown[otherIndex] > MIN_ALPHA;
  const isLeaving = isNewcomer && isVisible;
  return other.isPlaced || isLeaving;
}

function collides(state: GlobeState, index: number, isNewcomer: boolean) {
  const { box } = state.frames[index];
  return state.frames.some((other, otherIndex) => {
    if (otherIndex === index) {
      return false;
    }
    if (!isInTheWay(state, otherIndex, isNewcomer)) {
      return false;
    }
    return boxesOverlap(other.box, box);
  });
}

function fits(state: GlobeState, index: number, placedCount: number) {
  const frame = state.frames[index];
  const hasRoom = placedCount < MAX_WORDS;
  const isFacing = frame.facing > 0;
  if (!hasRoom || !isFacing) {
    return false;
  }
  if (!isInsideDisk(state, frame.box)) {
    return false;
  }
  const isNewcomer = passOf(state, index) === NEW_PASS;
  return !collides(state, index, isNewcomer);
}

/** Words claim their room in turn: a word that would cover one already placed, or leave the disk, is left out. */
function placeWords(state: GlobeState) {
  let placedCount = 0;
  for (const pass of PASSES) {
    state.frames.forEach((frame, index) => {
      const isItsPass = passOf(state, index) === pass;
      if (!isItsPass) {
        return;
      }
      if (fits(state, index, placedCount)) {
        frame.isPlaced = true;
        placedCount += 1;
      }
    });
  }
}

function movedTowards(current: number, target: number, step: number) {
  if (current < target) {
    const raised = current + step;
    return Math.min(target, raised);
  }
  const lowered = current - step;
  return Math.max(target, lowered);
}

/** Words fade in and out over a few frames while the globe plays. Without motion they are where they belong at once. */
function fadeWords(state: GlobeState, elapsed: number) {
  const step = elapsed / WORD_FADE_MS;
  let isSettled = true;
  state.frames.forEach((frame, index) => {
    const target = Number(frame.isPlaced);
    let next = target;
    if (state.isLive) {
      next = movedTowards(state.shown[index], target, step);
    }
    state.shown[index] = next;
    if (next !== target) {
      isSettled = false;
    }
  });
  return isSettled;
}

function wordAlphaOf(state: GlobeState, index: number) {
  const frame = state.frames[index];
  return state.shown[index] * frame.facing;
}

function stepOfDepth(depth: number) {
  const step = Math.floor(depth * DOT_STEPS);
  return Math.min(DOT_STEPS - 1, step);
}

function drawDots(
  state: GlobeState,
  pen: CanvasRenderingContext2D,
  facing: Facing,
  seen: Seen
) {
  const { land } = state;
  const layers = DOT_STEP_INDEXES.map(() => new Path2D());
  for (let index = 0; index < land.count; index += 1) {
    see(facing, land.east[index], land.north[index], land.front[index], seen);
    if (seen.depth <= 0) {
      continue;
    }
    const step = stepOfDepth(seen.depth);
    const dotRadius = DOT_RADII[step];
    const x = state.centreX + seen.across * state.radius;
    const y = state.centreY - seen.up * state.radius;
    const layer = layers[step];
    layer.moveTo(x + dotRadius, y);
    layer.arc(x, y, dotRadius, 0, TAU);
  }
  pen.fillStyle = state.dotColor;
  layers.forEach((layer, step) => {
    pen.globalAlpha = DOT_ALPHAS[step];
    pen.fill(layer);
  });
}

/** Each word sits on a clear patch: the dots under it fade out as the word fades in. */
function clearUnderWords(state: GlobeState, pen: CanvasRenderingContext2D) {
  pen.globalCompositeOperation = 'destination-out';
  pen.fillStyle = state.dotColor;
  state.frames.forEach((frame, index) => {
    const alpha = wordAlphaOf(state, index);
    if (alpha < MIN_ALPHA) {
      return;
    }
    const { box } = frame;
    const width = box.right - box.left;
    const height = box.bottom - box.top;
    pen.globalAlpha = alpha;
    pen.fillRect(box.left, box.top, width, height);
  });
  pen.globalCompositeOperation = 'source-over';
}

/** The body goes under what is drawn, so the patches cleared for the words keep its tint. */
function drawBody(state: GlobeState, pen: CanvasRenderingContext2D) {
  pen.globalCompositeOperation = 'destination-over';
  pen.globalAlpha = BODY_ALPHA;
  pen.fillStyle = state.dotColor;
  pen.beginPath();
  pen.arc(state.centreX, state.centreY, state.radius, 0, TAU);
  pen.fill();
  pen.globalCompositeOperation = 'source-over';
}

function writeWord(
  pen: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  alpha: number
) {
  if (alpha < MIN_ALPHA) {
    return;
  }
  pen.globalAlpha = alpha;
  pen.fillStyle = color;
  pen.fillText(text, x, y);
}

/** The picked greeting passes from the quiet ink to the brand ink on the same letters, so its colour changes without a jump. */
function drawWords(state: GlobeState, pen: CanvasRenderingContext2D) {
  pen.textAlign = 'center';
  pen.textBaseline = 'alphabetic';
  state.frames.forEach((frame, index) => {
    const alpha = wordAlphaOf(state, index);
    if (alpha < MIN_ALPHA) {
      return;
    }
    const { text } = state.words[index];
    const wordInk = inkOf(state, text);
    const scale = frame.size / WORD_PX;
    const lift = ((wordInk.ascent - wordInk.descent) * scale) / 2;
    const baseline = frame.y + lift;
    const quietAlpha = alpha * (1 - frame.emphasis);
    const litAlpha = alpha * frame.emphasis;
    pen.font = fontOf(frame.size, state.family);
    writeWord(pen, text, frame.x, baseline, state.wordColor, quietAlpha);
    writeWord(pen, text, frame.x, baseline, state.litColor, litAlpha);
  });
}

function paint(
  state: GlobeState,
  pen: CanvasRenderingContext2D,
  facing: Facing,
  seen: Seen
) {
  pen.clearRect(0, 0, state.width, state.height);
  drawDots(state, pen, facing, seen);
  clearUnderWords(state, pen);
  drawBody(state, pen);
  drawWords(state, pen);
  pen.globalAlpha = 1;
}

function render(state: GlobeState) {
  const { pen } = state;
  const hasRoom = state.radius > 0;
  if (!pen || !hasRoom) {
    return;
  }
  const now = performance.now();
  const sinceLast = now - state.lastDrawAt;
  const elapsed = Math.min(sinceLast, MAX_STEP_MS);
  const facing = facingOf(state);
  const seen: Seen = { across: 0, up: 0, depth: 0 };
  state.lastDrawAt = now;
  state.frames.forEach((_, index) => frameWord(state, index, facing, seen));
  placeWords(state);
  state.areWordsSettled = fadeWords(state, elapsed);
  paint(state, pen, facing, seen);
}

function easedOf(progress: number) {
  if (progress < 0.5) {
    return 4 * progress ** 3;
  }
  const left = 2 - 2 * progress;
  return 1 - left ** 3 / 2;
}

function boundedLatitudeOf(latitude: number) {
  const atLeast = Math.max(-MAX_LATITUDE, latitude);
  return Math.min(MAX_LATITUDE, atLeast);
}

function boundedSpinOf(spin: number) {
  const atLeast = Math.max(-MAX_SPIN, spin);
  return Math.min(MAX_SPIN, atLeast);
}

function isSpinning(state: GlobeState) {
  const speed = Math.hypot(state.spinLongitude, state.spinLatitude);
  return speed > MIN_SPIN;
}

function stopSpin(state: GlobeState) {
  state.spinLongitude = 0;
  state.spinLatitude = 0;
}

/** The light is on its new language for good, wherever the globe is. */
function endLight(state: GlobeState) {
  state.glow = 1;
  state.fading = NO_LANGUAGE;
}

function arrive(state: GlobeState, turn: Turn) {
  state.longitude = turn.toLongitude;
  state.latitude = turn.toLatitude;
  state.turn = null;
  endLight(state);
}

function stepTurn(state: GlobeState, turn: Turn, now: number) {
  const progress = (now - turn.startedAt) / TURN_MS;
  if (progress >= 1) {
    arrive(state, turn);
    return;
  }
  const eased = easedOf(progress);
  const longitudeGap = turn.toLongitude - turn.fromLongitude;
  const latitudeGap = turn.toLatitude - turn.fromLatitude;
  state.longitude = turn.fromLongitude + longitudeGap * eased;
  state.latitude = turn.fromLatitude + latitudeGap * eased;
  state.glow = eased;
}

function stepSpin(state: GlobeState, elapsed: number) {
  const decay = Math.exp(-elapsed / MOMENTUM_DECAY_MS);
  const latitude = state.latitude + state.spinLatitude * elapsed;
  state.longitude += state.spinLongitude * elapsed;
  state.latitude = boundedLatitudeOf(latitude);
  state.spinLongitude *= decay;
  state.spinLatitude *= decay;
}

function step(state: GlobeState, now: number, elapsed: number) {
  if (state.turn) {
    stepTurn(state, state.turn, now);
    return;
  }
  stepSpin(state, elapsed);
}

function isAtRest(state: GlobeState) {
  const isTurning = state.turn !== null;
  const isHeld = state.grabbedBy !== null;
  const isCoasting = !isHeld && isSpinning(state);
  const isMoving = isTurning || isCoasting;
  return !isMoving && state.areWordsSettled;
}

/** Frames are asked for only while the globe turns or coasts, or a word fades. At rest it is a still picture. */
function tick(state: GlobeState, now: number) {
  const sinceLast = now - state.lastTick;
  const elapsed = Math.min(sinceLast, MAX_STEP_MS);
  const isHeld = state.grabbedBy !== null;
  state.lastTick = now;
  if (!isHeld) {
    step(state, now, elapsed);
  }
  render(state);
  if (!isAtRest(state)) {
    state.frame = requestAnimationFrame((next) => tick(state, next));
    return;
  }
  state.frame = 0;
  if (!isHeld) {
    stopSpin(state);
  }
}

function wake(state: GlobeState) {
  const isAwake = state.frame !== 0;
  if (!state.isLive || isAwake) {
    return;
  }
  state.lastTick = performance.now();
  state.frame = requestAnimationFrame((now) => tick(state, now));
}

function sleep(state: GlobeState) {
  cancelAnimationFrame(state.frame);
  state.frame = 0;
}

/** Draws the picture again, and asks for frames while something on it still has to move. */
function renderAndFollow(state: GlobeState) {
  render(state);
  if (!isAtRest(state)) {
    wake(state);
  }
}

/** Without motion, a turn that was on its way lands at once and a spin stops where it is. */
function settle(state: GlobeState) {
  sleep(state);
  if (state.turn) {
    arrive(state, state.turn);
  }
  stopSpin(state);
  render(state);
}

function turnTo(state: GlobeState, index: number) {
  const place = state.centres[index];
  if (!place) {
    return;
  }
  const toLongitude = nearestAngleOf(place[1], state.longitude);
  const toLatitude = boundedLatitudeOf(place[0]);
  const longitudeGap = Math.abs(toLongitude - state.longitude);
  const latitudeGap = Math.abs(toLatitude - state.latitude);
  const isThere = longitudeGap + latitudeGap < ALREADY_THERE;
  const isSameLanguage = index === state.lit;
  if (isSameLanguage && isThere) {
    return;
  }
  if (!isSameLanguage) {
    state.fading = state.lit;
    state.lit = index;
    state.glow = 0;
  }
  stopSpin(state);
  state.turn = {
    fromLongitude: state.longitude,
    fromLatitude: state.latitude,
    toLongitude,
    toLatitude,
    startedAt: performance.now(),
  };
  if (!state.isLive) {
    settle(state);
    return;
  }
  wake(state);
}

function grab(state: GlobeState, event: PointerEvent) {
  const isMainButton = event.button === 0;
  const isFree = state.grabbedBy === null;
  if (!isMainButton || !isFree) {
    return;
  }
  sleep(state);
  stopSpin(state);
  endLight(state);
  state.turn = null;
  state.grabbedBy = event.pointerId;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.lastMoveAt = event.timeStamp;
  state.canvas.setPointerCapture(event.pointerId);
  renderAndFollow(state);
}

function drag(state: GlobeState, event: PointerEvent) {
  if (event.pointerId !== state.grabbedBy) {
    return;
  }
  const radius = Math.max(state.radius, 1);
  const degreesPerPixel = degreesOf(1 / radius);
  const sinceLast = event.timeStamp - state.lastMoveAt;
  const elapsed = Math.max(sinceLast, 1);
  const turned = (state.lastX - event.clientX) * degreesPerPixel;
  const tilted = (event.clientY - state.lastY) * degreesPerPixel;
  const spinLongitude = boundedSpinOf(turned / elapsed);
  const spinLatitude = boundedSpinOf(tilted / elapsed);
  state.longitude += turned;
  state.latitude = boundedLatitudeOf(state.latitude + tilted);
  state.spinLongitude = state.spinLongitude * 0.5 + spinLongitude * 0.5;
  state.spinLatitude = state.spinLatitude * 0.5 + spinLatitude * 0.5;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.lastMoveAt = event.timeStamp;
  renderAndFollow(state);
}

function release(state: GlobeState, event: PointerEvent) {
  if (event.pointerId !== state.grabbedBy) {
    return;
  }
  const stillFor = event.timeStamp - state.lastMoveAt;
  const wasHeldStill = stillFor > HELD_STILL_MS;
  state.grabbedBy = null;
  if (wasHeldStill || !state.isLive) {
    stopSpin(state);
    renderAndFollow(state);
    return;
  }
  wake(state);
}

function setLive(state: GlobeState, isLive: boolean) {
  state.isLive = isLive;
  if (isLive) {
    return;
  }
  settle(state);
}

function refit(state: GlobeState) {
  measure(state);
  renderAndFollow(state);
}

function reink(state: GlobeState) {
  ink(state);
  renderAndFollow(state);
}

/**
 * One canvas for the whole globe. It is drawn again only when something changes what it shows: a
 * turn, a drag, a spin, a word that fades, a new size or a new theme.
 */
function createWordGlobe(
  canvas: HTMLCanvasElement,
  languages: HelloLanguage[],
  places: HelloPlace[],
  startIndex: number
): WordGlobe {
  const centres = languages.map((language) => language.centre);
  const start = centres[startIndex] ?? [0, 0];
  const words = wordsOf(languages, places);
  const state: GlobeState = {
    canvas,
    pen: null,
    width: 0,
    height: 0,
    centreX: 0,
    centreY: 0,
    radius: 0,
    land: landOf(),
    words,
    frames: words.map(() => blankFrameOf()),
    shown: new Float32Array(words.length),
    areWordsSettled: true,
    inks: new Map(),
    centres,
    family: '',
    dotColor: '',
    wordColor: '',
    litColor: '',
    longitude: start[1],
    latitude: boundedLatitudeOf(start[0]),
    turn: null,
    lit: startIndex,
    fading: NO_LANGUAGE,
    glow: 1,
    spinLongitude: 0,
    spinLatitude: 0,
    grabbedBy: null,
    lastX: 0,
    lastY: 0,
    lastMoveAt: 0,
    isLive: false,
    frame: 0,
    lastTick: 0,
    lastDrawAt: 0,
  };

  ink(state);
  refit(state);
  const sizeObserver = new ResizeObserver(() => refit(state));
  sizeObserver.observe(canvas);
  const stopWatching = watchTheme(() => reink(state));

  return {
    turnTo: (index) => turnTo(state, index),
    setLive: (isLive) => setLive(state, isLive),
    grab: (event) => grab(state, event),
    drag: (event) => drag(state, event),
    release: (event) => release(state, event),
    dispose() {
      sleep(state);
      sizeObserver.disconnect();
      stopWatching();
    },
  };
}

function directionOf(language: HelloLanguage) {
  if (language.isRightToLeft) {
    return 'rtl';
  }
  return 'ltr';
}

const NO_PLACES: HelloPlace[] = [];

export type HelloGlobeProps = {
  /**
   * Each language stands on the globe with its greeting. Keep the list stable, a constant or a
   * memo: a new list builds the globe again.
   */
  languages: HelloLanguage[];
  /** More greetings for the globe, each where it is written. Keep it stable too. */
  places?: HelloPlace[];
  /** The tag of the language that is picked. */
  tag: string;
  onTagChange: (tag: string) => void;
  className?: string;
};

export function HelloGlobe({
  languages,
  places = NO_PLACES,
  tag,
  onTagChange,
  className,
}: HelloGlobeProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<WordGlobe | null>(null);
  const found = languages.findIndex((language) => language.tag === tag);
  const index = Math.max(found, 0);
  const [startIndex] = useState(index);
  const language = languages[index];
  const presence = risePresenceOf(isStill);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const globe = createWordGlobe(canvas, languages, places, startIndex);
    globeRef.current = globe;
    return () => {
      globe.dispose();
      globeRef.current = null;
    };
  }, [languages, places, startIndex]);

  useEffect(() => {
    globeRef.current?.setLive(isPlaying);
  }, [isPlaying, languages, places]);

  useEffect(() => {
    globeRef.current?.turnTo(index);
  }, [index, languages, places]);

  if (!language) {
    return null;
  }

  function pick(pressed: unknown[]) {
    const [next] = pressed;
    if (typeof next === 'string') {
      onTagChange(next);
    }
  }

  return (
    <div ref={ref} className={cn('@container w-full max-w-[36rem]', className)}>
      <div className='flex flex-col items-center gap-4 @lg:flex-row @lg:gap-6'>
        <div className='relative aspect-square w-full max-w-72 shrink-0 @lg:w-60'>
          <canvas
            ref={canvasRef}
            aria-hidden='true'
            onPointerDown={(event) => globeRef.current?.grab(event.nativeEvent)}
            onPointerMove={(event) => globeRef.current?.drag(event.nativeEvent)}
            onPointerUp={(event) =>
              globeRef.current?.release(event.nativeEvent)
            }
            onPointerCancel={(event) =>
              globeRef.current?.release(event.nativeEvent)
            }
            className='absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing'
          />
        </div>
        <div className='flex w-full min-w-0 flex-1 flex-col gap-3'>
          <div className='flex min-h-[4.75rem] flex-col justify-end gap-1'>
            <AnimatePresence mode='wait' initial={false}>
              <motion.p
                key={language.tag}
                lang={language.tag}
                dir={directionOf(language)}
                className='text-left text-4xl leading-[1.4] font-semibold'
                {...presence}
              >
                {language.greeting}
              </motion.p>
            </AnimatePresence>
            <p className='text-muted-foreground text-xs'>
              {language.name}, {language.script} script
            </p>
          </div>
          <ToggleGroup
            aria-label='Language'
            value={[language.tag]}
            onValueChange={pick}
            travel
            size='sm'
            className='grid w-full grid-cols-2 gap-0.5'
          >
            {languages.map((item) => (
              <ToggleGroupItem
                key={item.tag}
                value={item.tag}
                className='min-w-0 justify-start gap-1.5 px-2 text-xs'
              >
                <span lang={item.tag}>{item.endonym}</span>
                <span className='text-muted-foreground truncate font-normal'>
                  {item.name}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}

const LANGUAGES: HelloLanguage[] = [
  {
    tag: 'en',
    name: 'English',
    endonym: 'English',
    script: 'Latin',
    greeting: 'Hello',
    centre: [39, -98],
  },
  {
    tag: 'ru',
    name: 'Russian',
    endonym: 'Русский',
    script: 'Cyrillic',
    greeting: 'Привет',
    centre: [58, 70],
  },
  {
    tag: 'ar',
    name: 'Arabic',
    endonym: 'العربية',
    script: 'Arabic',
    greeting: 'مرحبا',
    isRightToLeft: true,
    centre: [26, 38],
  },
  {
    tag: 'hi',
    name: 'Hindi',
    endonym: 'हिन्दी',
    script: 'Devanagari',
    greeting: 'नमस्ते',
    centre: [22, 79],
  },
  {
    tag: 'zh',
    name: 'Chinese',
    endonym: '中文',
    script: 'Han',
    greeting: '你好',
    centre: [34, 105],
  },
  {
    tag: 'ja',
    name: 'Japanese',
    endonym: '日本語',
    script: 'Kana',
    greeting: 'こんにちは',
    centre: [37, 138],
  },
  {
    tag: 'ko',
    name: 'Korean',
    endonym: '한국어',
    script: 'Hangul',
    greeting: '안녕하세요',
    centre: [37, 127.5],
  },
  {
    tag: 'el',
    name: 'Greek',
    endonym: 'Ελληνικά',
    script: 'Greek',
    greeting: 'Γεια σου',
    centre: [38.5, 23.5],
  },
  {
    tag: 'he',
    name: 'Hebrew',
    endonym: 'עברית',
    script: 'Hebrew',
    greeting: 'שלום',
    isRightToLeft: true,
    centre: [31.5, 35],
  },
  {
    tag: 'th',
    name: 'Thai',
    endonym: 'ไทย',
    script: 'Thai',
    greeting: 'สวัสดี',
    centre: [15, 101],
  },
];

const PLACES: HelloPlace[] = [
  { greeting: 'Hola', location: [23.6, -102.5] },
  { greeting: 'Bonjour', location: [50, -72] },
  { greeting: 'Hola', location: [4.5, -74] },
  { greeting: 'Hola', location: [-34, -64] },
  { greeting: 'Olá', location: [-10, -52] },
  { greeting: 'Aloha', location: [20.8, -156.3] },
  { greeting: 'Hola', location: [40, -3.7] },
  { greeting: 'Bonjour', location: [46.6, 2.4] },
  { greeting: 'Hallo', location: [51.2, 10.4] },
  { greeting: 'Hej', location: [62, 15] },
  { greeting: 'Привіт', location: [49, 31.5] },
  { greeting: 'Merhaba', location: [39, 35] },
  { greeting: 'مرحبا', location: [31.8, -7] },
  { greeting: 'Sannu', location: [12, 8.5] },
  { greeting: 'Habari', location: [-3.4, 36] },
  { greeting: 'Sawubona', location: [-28.5, 30.5] },
  { greeting: 'سلام', location: [32.5, 54] },
  { greeting: 'Привет', location: [62, 125] },
  { greeting: 'Xin chào', location: [16, 107.8] },
  { greeting: 'Kumusta', location: [12.9, 122] },
  { greeting: 'Halo', location: [-2.5, 118] },
  { greeting: 'Hello', location: [-25, 134] },
  { greeting: 'Kia ora', location: [-41, 174] },
];

const START_TAG = 'en';

const TOUR = ['ja', 'ar', 'hi', 'ru', 'el'];

const TOUR_HOLD_MS = 3200;

function announcementOf(tag: string) {
  const language = LANGUAGES.find((item) => item.tag === tag);
  if (!language) {
    return '';
  }
  return `${language.name}: ${language.greeting}`;
}

export default function Illustration12() {
  const [tag, setTag] = useState(START_TAG);
  const steps: AutoplayStep[] = TOUR.map((stop) => ({
    after: TOUR_HOLD_MS,
    run: () => setTag(stop),
  }));
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: TOUR_HOLD_MS,
    onReset: () => setTag(START_TAG),
  });
  const announcement = announcementOf(tag);

  return (
    <div ref={ref} className='flex w-full justify-center'>
      <HelloGlobe
        languages={LANGUAGES}
        places={PLACES}
        tag={tag}
        onTagChange={setTag}
      />
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
