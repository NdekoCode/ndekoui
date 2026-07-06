'use client';

import { useMemo } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { AT_REST, NEXT_FRAME } from './_parts/frame-loop';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';
import {
  clamp,
  dampingOf,
  smoothstep,
  springSpeedOf,
  type Point,
} from './_parts/math';
import type { Scene } from './_parts/stage';
import { StageCanvas } from './_parts/stage-canvas';
import { wipeSurface, type Inks, type Surface } from './_parts/surface';

const DEFAULT_PITCH = 20;

const MIN_PITCH = 10;

/**
 * A cube stands half a pitch at most. At that height it reaches the edge of its own cell and no
 * further, so one cube is wiped and drawn again without touching a neighbour.
 */
const MAX_HEIGHT_SHARE = 0.5;

const REST_HEIGHT_SHARE = 0.1;

/** How far above its base the cell of a cube starts, as a share of the pitch. */
const CELL_ABOVE_SHARE = 0.75;

const POINTER_REACH_PX = 120;

const STIFFNESS = 150;

const DAMPING = dampingOf(STIFFNESS);

const SETTLED_PX = 0.02;

/** A cube is drawn again once it has moved this far from where it was last drawn. */
const REDRAW_PX = 0.08;

const WAVE_SPEED_PX = 240;

const WAVE_WIDTH_PX = 72;

/** Past this many widths from its crest the wave lifts nothing. */
const WAVE_REACH = 3;

const WAVE_MARGIN_PX = WAVE_WIDTH_PX * WAVE_REACH;

/** The idle wave lifts a cube to this share of what the pointer does. */
const WAVE_SHARE = 0.55;

const WAVE_PAUSE_MS = 2200;

/** The wave crosses the field at twenty degrees from the horizontal. */
const WAVE_ACROSS = 0.94;

const WAVE_DOWN = 0.34;

const LEFT_ALPHA = 0.1;

const RIGHT_ALPHA = 0.17;

const TOP_ALPHA = 0.06;

/** The hue a top wears at full height. Text sits above the field, so it stays a tint. */
const TOP_HUE_ALPHA = 0.55;

const MIN_LIFT = 0.02;

/** Where the cubes stand risen in the still picture, across and down the box. */
const STILL_AT: Point = { x: 0.7, y: 0.42 };

const NO_INKS: Inks = { hue: 'transparent', line: 'transparent' };

type CubeField = {
  pitch: number;
  half: number;
  halfWidth: number;
  halfDepth: number;
  restHeight: number;
  maxRise: number;
  isStill: boolean;
  inks: Inks;
  count: number;
  centreX: Float32Array;
  centreY: Float32Array;
  /** How far along the path of the wave each cube sits. */
  along: Float32Array;
  rise: Float32Array;
  speed: Float32Array;
  drawn: Float32Array;
  pointer: Point;
  hasPointer: boolean;
  isWaving: boolean;
  waveFront: number;
  waveEnd: number;
  nextWaveAt: number;
};

function fieldOf(size: number): CubeField {
  const pitch = Math.max(MIN_PITCH, size);
  const half = pitch / 2;
  const halfWidth = half - 1;
  const halfDepth = halfWidth / 2;
  const maxHeight = pitch * MAX_HEIGHT_SHARE;
  const restHeight = pitch * REST_HEIGHT_SHARE;
  const maxRise = maxHeight - restHeight;
  return {
    pitch,
    half,
    halfWidth,
    halfDepth,
    restHeight,
    maxRise,
    isStill: false,
    inks: NO_INKS,
    count: 0,
    centreX: new Float32Array(0),
    centreY: new Float32Array(0),
    along: new Float32Array(0),
    rise: new Float32Array(0),
    speed: new Float32Array(0),
    drawn: new Float32Array(0),
    pointer: { x: 0, y: 0 },
    hasPointer: false,
    isWaving: false,
    waveFront: 0,
    waveEnd: 0,
    nextWaveAt: 0,
  };
}

function bumpOf(field: CubeField, index: number, pointer: Point) {
  const offsetX = field.centreX[index] - pointer.x;
  const offsetY = field.centreY[index] - pointer.y;
  const isFarAcross = Math.abs(offsetX) > POINTER_REACH_PX;
  const isFarDown = Math.abs(offsetY) > POINTER_REACH_PX;
  if (isFarAcross || isFarDown) {
    return 0;
  }
  const distance = Math.hypot(offsetX, offsetY);
  const nearness = smoothstep(POINTER_REACH_PX, 0, distance);
  return nearness * field.maxRise;
}

function waveOf(field: CubeField, index: number) {
  const behind = field.along[index] - field.waveFront;
  const reach = behind / WAVE_WIDTH_PX;
  const isOutOfReach = Math.abs(reach) > WAVE_REACH;
  if (isOutOfReach) {
    return 0;
  }
  const squared = reach * reach;
  const ridge = Math.exp(-squared);
  const lift = ridge * WAVE_SHARE;
  return lift * field.maxRise;
}

function targetOf(field: CubeField, index: number) {
  let target = 0;
  if (field.hasPointer) {
    target += bumpOf(field, index, field.pointer);
  }
  if (field.isWaving) {
    target += waveOf(field, index);
  }
  return Math.min(target, field.maxRise);
}

/** The still picture: the cubes stand as if a pointer rested on them. */
function poseStill(field: CubeField, surface: Surface) {
  const x = surface.width * STILL_AT.x;
  const y = surface.height * STILL_AT.y;
  const pointer = { x, y };
  for (let index = 0; index < field.count; index += 1) {
    field.rise[index] = bumpOf(field, index, pointer);
  }
}

/**
 * Cubes sit on every other crossing of a grid one pitch wide and half a pitch tall, so their cells
 * tile the box: each cube owns a square of one pitch that no other cube enters.
 */
function layCubes(field: CubeField, surface: Surface, isStill: boolean) {
  const { pitch, half } = field;
  const columns = Math.ceil(surface.width / pitch) + 2;
  const rows = Math.ceil(surface.height / half) + 3;
  const capacity = columns * rows;
  const across = surface.width * WAVE_ACROSS;
  const down = surface.height * WAVE_DOWN;
  field.centreX = new Float32Array(capacity);
  field.centreY = new Float32Array(capacity);
  field.along = new Float32Array(capacity);
  field.rise = new Float32Array(capacity);
  field.speed = new Float32Array(capacity);
  field.drawn = new Float32Array(capacity);
  let count = 0;
  for (let row = 0; row < rows; row += 1) {
    const firstColumn = row % 2;
    for (let column = firstColumn; column < columns; column += 2) {
      const x = column * pitch;
      const y = row * half;
      const alongX = x * WAVE_ACROSS;
      const alongY = y * WAVE_DOWN;
      field.centreX[count] = x;
      field.centreY[count] = y;
      field.along[count] = alongX + alongY;
      count += 1;
    }
  }
  field.count = count;
  field.isStill = isStill;
  field.hasPointer = false;
  field.waveEnd = across + down + WAVE_MARGIN_PX;
  if (isStill) {
    poseStill(field, surface);
  }
}

function traceLeft(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number
) {
  const x = field.centreX[index];
  const base = field.centreY[index];
  const height = field.restHeight + field.rise[index];
  const top = base - height;
  const left = x - field.halfWidth;
  const topFront = top + field.halfDepth;
  const baseFront = base + field.halfDepth;
  pen.moveTo(left, top);
  pen.lineTo(x, topFront);
  pen.lineTo(x, baseFront);
  pen.lineTo(left, base);
  pen.closePath();
}

function traceRight(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number
) {
  const x = field.centreX[index];
  const base = field.centreY[index];
  const height = field.restHeight + field.rise[index];
  const top = base - height;
  const right = x + field.halfWidth;
  const topFront = top + field.halfDepth;
  const baseFront = base + field.halfDepth;
  pen.moveTo(x, topFront);
  pen.lineTo(right, top);
  pen.lineTo(right, base);
  pen.lineTo(x, baseFront);
  pen.closePath();
}

function traceTop(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number
) {
  const x = field.centreX[index];
  const height = field.restHeight + field.rise[index];
  const top = field.centreY[index] - height;
  const back = top - field.halfDepth;
  const front = top + field.halfDepth;
  const left = x - field.halfWidth;
  const right = x + field.halfWidth;
  pen.moveTo(x, back);
  pen.lineTo(right, top);
  pen.lineTo(x, front);
  pen.lineTo(left, top);
  pen.closePath();
}

type FaceTracer = typeof traceLeft;

/** The top takes the hue as the cube rises: the neutral says floor, the hue says lifted. */
function tintTop(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number
) {
  const lift = field.rise[index] / field.maxRise;
  if (lift < MIN_LIFT) {
    return;
  }
  pen.fillStyle = field.inks.hue;
  pen.globalAlpha = lift * TOP_HUE_ALPHA;
  pen.beginPath();
  traceTop(pen, field, index);
  pen.fill();
}

function fillFace(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number,
  alpha: number,
  trace: FaceTracer
) {
  pen.globalAlpha = alpha;
  pen.beginPath();
  trace(pen, field, index);
  pen.fill();
}

/** One cube, in its own cell: the cell is wiped, then the three faces are drawn where it now stands. */
function paintCube(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  index: number
) {
  const cellLeft = field.centreX[index] - field.half;
  const cellAbove = field.pitch * CELL_ABOVE_SHARE;
  const cellTop = field.centreY[index] - cellAbove;
  pen.globalAlpha = 1;
  pen.clearRect(cellLeft, cellTop, field.pitch, field.pitch);
  pen.fillStyle = field.inks.line;
  fillFace(pen, field, index, LEFT_ALPHA, traceLeft);
  fillFace(pen, field, index, RIGHT_ALPHA, traceRight);
  fillFace(pen, field, index, TOP_ALPHA, traceTop);
  tintTop(pen, field, index);
  field.drawn[index] = field.rise[index];
}

/** The same face of every cube in one fill: cubes never overlap, so one path holds them all. */
function fillFaces(
  pen: CanvasRenderingContext2D,
  field: CubeField,
  alpha: number,
  trace: FaceTracer
) {
  pen.globalAlpha = alpha;
  pen.beginPath();
  for (let index = 0; index < field.count; index += 1) {
    trace(pen, field, index);
  }
  pen.fill();
}

function drawCubes(field: CubeField, surface: Surface) {
  const { pen } = surface;
  wipeSurface(surface);
  pen.fillStyle = field.inks.line;
  fillFaces(pen, field, LEFT_ALPHA, traceLeft);
  fillFaces(pen, field, RIGHT_ALPHA, traceRight);
  fillFaces(pen, field, TOP_ALPHA, traceTop);
  for (let index = 0; index < field.count; index += 1) {
    tintTop(pen, field, index);
  }
  field.drawn.set(field.rise);
}

/** A wave crosses the field, then the field rests for a while before the next one. */
function advanceWave(field: CubeField, seconds: number, now: number) {
  if (!field.isWaving) {
    const isDue = now >= field.nextWaveAt;
    if (isDue) {
      field.isWaving = true;
      field.waveFront = -WAVE_MARGIN_PX;
    }
    return;
  }
  field.waveFront += WAVE_SPEED_PX * seconds;
  const hasCrossed = field.waveFront > field.waveEnd;
  if (hasCrossed) {
    field.isWaving = false;
    field.nextWaveAt = now + WAVE_PAUSE_MS;
  }
}

/** Moves one cube towards its target on a spring that does not bounce. It answers whether it still moves. */
function moveCube(field: CubeField, index: number, seconds: number) {
  const target = targetOf(field, index);
  const gap = target - field.rise[index];
  const speed = springSpeedOf(
    gap,
    field.speed[index],
    STIFFNESS,
    DAMPING,
    seconds
  );
  const isClose = Math.abs(gap) < SETTLED_PX;
  const isSlow = Math.abs(speed) < SETTLED_PX;
  if (isClose && isSlow) {
    field.rise[index] = target;
    field.speed[index] = 0;
    return false;
  }
  const travel = speed * seconds;
  const moved = field.rise[index] + travel;
  field.rise[index] = clamp(moved, 0, field.maxRise);
  field.speed[index] = speed;
  return true;
}

/** Only the cubes that moved are drawn again. With nothing moving, the loop sleeps until the next wave is due. */
function stepCubes(
  field: CubeField,
  surface: Surface,
  seconds: number,
  now: number
) {
  if (field.isStill) {
    return AT_REST;
  }
  advanceWave(field, seconds, now);
  let isMoving = false;
  for (let index = 0; index < field.count; index += 1) {
    const stillMoves = moveCube(field, index, seconds);
    const change = field.rise[index] - field.drawn[index];
    const isStale = Math.abs(change) > REDRAW_PX;
    if (isStale) {
      paintCube(surface.pen, field, index);
    }
    isMoving = isMoving || stillMoves;
  }
  if (isMoving || field.isWaving) {
    return NEXT_FRAME;
  }
  const untilWave = field.nextWaveAt - now;
  return Math.max(NEXT_FRAME, untilWave);
}

function createCubeScene(size: number): Scene {
  const field = fieldOf(size);
  return {
    ink(inks) {
      field.inks = inks;
    },
    fit(surface, isStill) {
      layCubes(field, surface, isStill);
    },
    draw(surface) {
      drawCubes(field, surface);
    },
    step(surface, seconds, now) {
      return stepCubes(field, surface, seconds, now);
    },
    pointerMoved(x, y) {
      field.pointer.x = x;
      field.pointer.y = y;
      field.hasPointer = true;
    },
    pointerLeft() {
      field.hasPointer = false;
    },
  };
}

export type CubeFieldProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. A cube takes it as it rises. */
  hue?: string;
  /** The distance between two cubes, in pixels. */
  size?: number;
  /** Cubes rise under the pointer. Without it, only the idle wave crosses the field. */
  interactive?: boolean;
};

/**
 * A floor of small isometric cubes on one canvas. They rise under the pointer, each on its own
 * spring, and a slow wave crosses them while nobody touches them. Only the cubes that move are
 * drawn again, and nothing is drawn while they rest. It fills its parent, which must be
 * positioned. Under reduced motion the cubes stand still.
 */
export function CubeField({
  className,
  hue = DEFAULT_HUE,
  size = DEFAULT_PITCH,
  interactive = true,
}: CubeFieldProps) {
  const scene = useMemo(() => createCubeScene(size), [size]);

  return (
    <StageCanvas
      scene={scene}
      hue={hue}
      isInteractive={interactive}
      className={className}
    />
  );
}

export default function Background02() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='A floor of cubes that rises under the pointer'
      background={<CubeField hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
