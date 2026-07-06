'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { DemoBand } from './_parts/demo-band';
import { AT_REST, NEXT_FRAME } from './_parts/frame-loop';
import { DEFAULT_HUE } from './_parts/hue';
import { clamp, shareOf, towards, type Point } from './_parts/math';
import type { Scene } from './_parts/stage';
import { StageCanvas, type StageHandle } from './_parts/stage-canvas';
import { wipeSurface, type Inks, type Surface } from './_parts/surface';

export type DitherMode = 'pointer' | 'horizon' | 'noise';

const DEFAULT_CELL = 6;

const MIN_CELL = 4;

/** The 4 by 4 ordered dither: the rank at which each cell of a tile lights up as the light grows. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const BAYER_SIDE = 4;

function thresholdOf(rank: number) {
  const centred = rank + 0.5;
  return centred / BAYER.length;
}

const THRESHOLDS = BAYER.map(thresholdOf);

/** A dot takes a third of its cell, and never less than two pixels. */
const DOT_SHARE = 3;

const MIN_DOT = 2;

/** Dots are small and stay a tint: text sits above them and must stay easy to read. */
const DOT_ALPHA = 0.6;

/** The light never fills every cell: a few dots stay dark even at its heart, so it keeps a grain. */
const PEAK = 0.92;

/** Seconds for a cell to follow the light most of the way: a change of mode fades instead of cutting. */
const CELL_EASE_S = 0.2;

const SETTLED = 0.004;

const LIGHT_REACH_PX = 250;

const LIGHT_REACH_SQUARED = LIGHT_REACH_PX * LIGHT_REACH_PX;

const LIGHT_EASE_S = 0.3;

const LIGHT_HOME_PX = 0.5;

/** Without a pointer the light walks a slow loop, so the piece shows what it does by itself. */
const WALK_ACROSS = 0.3;

const WALK_DOWN = 0.22;

const WALK_ACROSS_SPEED = 0.31;

const WALK_DOWN_SPEED = 0.47;

const WALK_DOWN_PHASE = 1.3;

/** The share of the height the horizon light fills once it has risen. */
const HORIZON_SHARE = 0.52;

const HORIZON_RISE_S = 0.9;

const HORIZON_BREATH = 0.04;

const HORIZON_BREATH_SPEED = 0.5;

/** The share of the height over which the light grows from nothing to its peak, below the horizon. */
const HORIZON_SPAN_SHARE = 0.44;

const SWELL_PX = 12;

const SWELL_WAVE = 0.014;

const SWELL_SPEED = 0.6;

type Wave = {
  /** Radians a pixel: how tight the wave is. */
  wave: number;
  /** Radians a second: how fast it travels, and which way. */
  speed: number;
};

/** Four travelling waves add up to the noise: across, down and along both diagonals. */
const NOISE_ACROSS: Wave = { wave: 0.021, speed: 0.42 };

const NOISE_DOWN: Wave = { wave: 0.029, speed: -0.33 };

const NOISE_FALLING: Wave = { wave: 0.013, speed: 0.27 };

const NOISE_RISING: Wave = { wave: 0.017, speed: -0.21 };

const NOISE_GAIN = 0.21;

/** Where the light rests in the still picture, across and down the box. */
const STILL_AT: Point = { x: 0.5, y: 0.42 };

const STILL_CLOCK = 2.4;

const NO_INKS: Inks = { hue: 'transparent', line: 'transparent' };

type DitherField = {
  cell: number;
  dot: number;
  inset: number;
  mode: DitherMode;
  isStill: boolean;
  inks: Inks;
  columns: number;
  rows: number;
  width: number;
  height: number;
  /** The light each cell should show, and the light it shows now on its way there. */
  target: Float32Array;
  shown: Float32Array;
  /** What is on the canvas: 1 where a dot is drawn. */
  lit: Uint8Array;
  clock: number;
  light: Point;
  pointer: Point;
  hasPointer: boolean;
  horizonRise: number;
  edge: Float32Array;
  across: Float32Array;
  down: Float32Array;
  falling: Float32Array;
  rising: Float32Array;
};

function fieldOf(size: number): DitherField {
  const rounded = Math.round(size);
  const cell = Math.max(MIN_CELL, rounded);
  const third = Math.round(cell / DOT_SHARE);
  const dot = Math.max(MIN_DOT, third);
  const margin = cell - dot;
  const inset = Math.floor(margin / 2);
  return {
    cell,
    dot,
    inset,
    mode: 'pointer',
    isStill: false,
    inks: NO_INKS,
    columns: 0,
    rows: 0,
    width: 0,
    height: 0,
    target: new Float32Array(0),
    shown: new Float32Array(0),
    lit: new Uint8Array(0),
    clock: 0,
    light: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    hasPointer: false,
    horizonRise: 1,
    edge: new Float32Array(0),
    across: new Float32Array(0),
    down: new Float32Array(0),
    falling: new Float32Array(0),
    rising: new Float32Array(0),
  };
}

/** The middle of a cell, counted in cells from the edge of the box. */
function centreOf(field: DitherField, cells: number) {
  const start = cells * field.cell;
  const half = field.cell / 2;
  return start + half;
}

/** A share of the box that swings around its middle as the clock runs. */
function swingOf(clock: number, speed: number, phase: number, reach: number) {
  const turned = clock * speed;
  const turn = turned + phase;
  const swing = Math.sin(turn);
  const offset = swing * reach;
  return 0.5 + offset;
}

function walkOf(field: DitherField): Point {
  const across = swingOf(field.clock, WALK_ACROSS_SPEED, 0, WALK_ACROSS);
  const down = swingOf(
    field.clock,
    WALK_DOWN_SPEED,
    WALK_DOWN_PHASE,
    WALK_DOWN
  );
  const x = field.width * across;
  const y = field.height * down;
  return { x, y };
}

function goalOf(field: DitherField) {
  if (field.hasPointer) {
    return field.pointer;
  }
  return walkOf(field);
}

function restLight(field: DitherField) {
  field.light.x = field.width * STILL_AT.x;
  field.light.y = field.height * STILL_AT.y;
}

function glowOf(squared: number) {
  if (squared >= LIGHT_REACH_SQUARED) {
    return 0;
  }
  const distance = Math.sqrt(squared);
  const farness = distance / LIGHT_REACH_PX;
  const nearness = 1 - farness;
  const soft = nearness * nearness;
  return soft * PEAK;
}

/** A light around one point, falling off to nothing at its reach. */
function aimPointer(field: DitherField) {
  const { columns, rows, light, target } = field;
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    const y = centreOf(field, row);
    const offsetY = y - light.y;
    const squaredY = offsetY * offsetY;
    for (let column = 0; column < columns; column += 1) {
      const x = centreOf(field, column);
      const offsetX = x - light.x;
      const squaredX = offsetX * offsetX;
      const squared = squaredX + squaredY;
      target[index] = glowOf(squared);
      index += 1;
    }
  }
}

/** Where the horizon stands now, in pixels from the top: it rises once, then breathes. */
function horizonOf(field: DitherField) {
  const breathTurn = field.clock * HORIZON_BREATH_SPEED;
  const swing = Math.sin(breathTurn);
  const breath = swing * HORIZON_BREATH;
  const risen = HORIZON_SHARE * field.horizonRise;
  const filled = risen + breath;
  const empty = 1 - filled;
  return field.height * empty;
}

/** A light that rises from the bottom edge. Its upper edge swells along the width. */
function aimHorizon(field: DitherField) {
  const { columns, rows, edge, target } = field;
  const level = horizonOf(field);
  const span = field.height * HORIZON_SPAN_SHARE;
  const drift = field.clock * SWELL_SPEED;
  for (let column = 0; column < columns; column += 1) {
    const x = centreOf(field, column);
    const along = x * SWELL_WAVE;
    const turn = along + drift;
    const swell = Math.sin(turn) * SWELL_PX;
    edge[column] = level + swell;
  }
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    const y = centreOf(field, row);
    for (let column = 0; column < columns; column += 1) {
      const depth = y - edge[column];
      const reach = depth / span;
      const share = clamp(reach, 0, 1);
      target[index] = share * PEAK;
      index += 1;
    }
  }
}

/** One wave, worked out once for every row, column or diagonal it crosses. */
function fillBand(
  band: Float32Array,
  field: DitherField,
  firstCell: number,
  wave: Wave
) {
  const drift = field.clock * wave.speed;
  const turnPerCell = field.cell * wave.wave;
  for (let index = 0; index < band.length; index += 1) {
    const cells = index + firstCell;
    const along = cells * turnPerCell;
    const turn = along + drift;
    band[index] = Math.sin(turn);
  }
}

/**
 * Four waves that travel across, down and along both diagonals. Each depends on one number a
 * cell, so a cell only adds four numbers that were worked out once a row, a column or a diagonal.
 */
function aimNoise(field: DitherField) {
  const { columns, rows, across, down, falling, rising, target } = field;
  fillBand(across, field, 0, NOISE_ACROSS);
  fillBand(down, field, 0, NOISE_DOWN);
  fillBand(falling, field, 0, NOISE_FALLING);
  fillBand(rising, field, -rows, NOISE_RISING);
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    const firstRising = rows - row;
    for (let column = 0; column < columns; column += 1) {
      const fallingIndex = column + row;
      const risingIndex = column + firstRising;
      const straight = across[column] + down[row];
      const diagonal = falling[fallingIndex] + rising[risingIndex];
      const sum = straight + diagonal;
      const swing = sum * NOISE_GAIN;
      const centred = 0.5 + swing;
      const level = clamp(centred, 0, 1);
      target[index] = level * PEAK;
      index += 1;
    }
  }
}

function aim(field: DitherField) {
  if (field.mode === 'horizon') {
    aimHorizon(field);
    return;
  }
  if (field.mode === 'noise') {
    aimNoise(field);
    return;
  }
  aimPointer(field);
}

function dotOn(
  pen: CanvasRenderingContext2D,
  field: DitherField,
  column: number,
  row: number
) {
  const cellX = column * field.cell;
  const cellY = row * field.cell;
  const x = cellX + field.inset;
  const y = cellY + field.inset;
  pen.fillRect(x, y, field.dot, field.dot);
}

/** The whole cell is wiped, not the dot alone: on a screen of uneven density a dot leaves a rim. */
function dotOff(
  pen: CanvasRenderingContext2D,
  field: DitherField,
  column: number,
  row: number
) {
  const x = column * field.cell;
  const y = row * field.cell;
  pen.clearRect(x, y, field.cell, field.cell);
}

function isLitAt(
  field: DitherField,
  index: number,
  column: number,
  row: number
) {
  const tileRow = row % BAYER_SIDE;
  const tileColumn = column % BAYER_SIDE;
  const firstOfRow = tileRow * BAYER_SIDE;
  const rank = firstOfRow + tileColumn;
  return field.shown[index] > THRESHOLDS[rank];
}

/**
 * Every cell eases towards its light, and only a dot that crosses its threshold is drawn or wiped.
 * It answers whether any cell is still on its way.
 */
function easeCells(field: DitherField, surface: Surface, share: number) {
  const { columns, rows, target, shown, lit } = field;
  const { pen } = surface;
  let isEasing = false;
  let index = 0;
  pen.fillStyle = field.inks.hue;
  pen.globalAlpha = DOT_ALPHA;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const gap = target[index] - shown[index];
      const step = gap * share;
      const isOnItsWay = Math.abs(gap) > SETTLED;
      shown[index] += step;
      isEasing = isEasing || isOnItsWay;
      const isLit = isLitAt(field, index, column, row);
      const wasLit = lit[index] === 1;
      if (isLit && !wasLit) {
        dotOn(pen, field, column, row);
        lit[index] = 1;
      }
      if (wasLit && !isLit) {
        dotOff(pen, field, column, row);
        lit[index] = 0;
      }
      index += 1;
    }
  }
  return isEasing;
}

function drawDots(field: DitherField, surface: Surface) {
  const { columns, rows, lit } = field;
  const { pen } = surface;
  let index = 0;
  wipeSurface(surface);
  pen.fillStyle = field.inks.hue;
  pen.globalAlpha = DOT_ALPHA;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isLit = isLitAt(field, index, column, row);
      lit[index] = Number(isLit);
      if (isLit) {
        dotOn(pen, field, column, row);
      }
      index += 1;
    }
  }
}

/** The still picture of the current mode: the light at rest, every cell already where it is going. */
function poseStill(field: DitherField) {
  field.clock = STILL_CLOCK;
  field.horizonRise = 1;
  restLight(field);
  aim(field);
  field.shown.set(field.target);
}

function layCells(field: DitherField, surface: Surface, isStill: boolean) {
  const columns = Math.ceil(surface.width / field.cell);
  const rows = Math.ceil(surface.height / field.cell);
  const count = columns * rows;
  const diagonals = columns + rows;
  field.columns = columns;
  field.rows = rows;
  field.width = surface.width;
  field.height = surface.height;
  field.isStill = isStill;
  field.hasPointer = false;
  field.target = new Float32Array(count);
  field.shown = new Float32Array(count);
  field.lit = new Uint8Array(count);
  field.edge = new Float32Array(columns);
  field.across = new Float32Array(columns);
  field.down = new Float32Array(rows);
  field.falling = new Float32Array(diagonals);
  field.rising = new Float32Array(diagonals);
  restLight(field);
  aim(field);
  field.shown.set(field.target);
}

/** The light eases after its goal. It answers whether it is still on its way. */
function moveLight(field: DitherField, seconds: number) {
  const goal = goalOf(field);
  const share = shareOf(seconds, LIGHT_EASE_S);
  field.light.x = towards(field.light.x, goal.x, share);
  field.light.y = towards(field.light.y, goal.y, share);
  const offsetX = goal.x - field.light.x;
  const offsetY = goal.y - field.light.y;
  const distance = Math.hypot(offsetX, offsetY);
  return distance > LIGHT_HOME_PX;
}

/** The horizon and the noise never rest. The pointer light rests once it has reached a pointer that stays still. */
function stepDots(field: DitherField, surface: Surface, seconds: number) {
  if (field.isStill) {
    return AT_REST;
  }
  field.clock += seconds;
  const riseShare = shareOf(seconds, HORIZON_RISE_S);
  field.horizonRise = towards(field.horizonRise, 1, riseShare);
  const isTravelling = moveLight(field, seconds);
  aim(field);
  const cellShare = shareOf(seconds, CELL_EASE_S);
  const isEasing = easeCells(field, surface, cellShare);
  const isLed = field.mode === 'pointer' && field.hasPointer;
  const isMoving = isTravelling || isEasing;
  if (isLed && !isMoving) {
    return AT_REST;
  }
  return NEXT_FRAME;
}

type DitherScene = Scene & {
  setMode: (mode: DitherMode) => void;
};

function createDitherScene(size: number): DitherScene {
  const field = fieldOf(size);
  return {
    ink(inks) {
      field.inks = inks;
    },
    fit(surface, isStill) {
      layCells(field, surface, isStill);
    },
    draw(surface) {
      if (field.isStill) {
        poseStill(field);
      }
      drawDots(field, surface);
    },
    step(surface, seconds) {
      return stepDots(field, surface, seconds);
    },
    pointerMoved(x, y) {
      field.pointer.x = x;
      field.pointer.y = y;
      field.hasPointer = true;
    },
    pointerLeft() {
      field.hasPointer = false;
    },
    setMode(mode) {
      const isNewHorizon = mode === 'horizon' && field.mode !== 'horizon';
      field.mode = mode;
      if (isNewHorizon) {
        field.horizonRise = 0;
      }
    },
  };
}

export type DitherLightProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The dots wear it. */
  hue?: string;
  /** A glow that follows the pointer, a light that rises from the bottom edge, or noise that flows. */
  mode?: DitherMode;
  /** The side of a dither cell, in pixels. */
  size?: number;
  /** In `pointer` mode the glow follows the pointer. Without it, the glow walks by itself. */
  interactive?: boolean;
};

/**
 * A soft light drawn as crisp dots: a 4 by 4 ordered dither of a light field, on one canvas. Each
 * frame only draws or wipes the dots that cross their threshold. It fills its parent, which must
 * be positioned. Under reduced motion the light stands still.
 */
export function DitherLight({
  className,
  hue = DEFAULT_HUE,
  mode = 'pointer',
  size = DEFAULT_CELL,
  interactive = true,
}: DitherLightProps) {
  const stage = useRef<StageHandle>(null);
  const scene = useMemo(() => createDitherScene(size), [size]);

  useEffect(() => {
    scene.setMode(mode);
    stage.current?.refresh();
  }, [scene, mode]);

  return (
    <StageCanvas
      handleRef={stage}
      scene={scene}
      hue={hue}
      isInteractive={interactive}
      className={className}
    />
  );
}

const MODES: Segment<DitherMode>[] = [
  { value: 'pointer', label: 'Pointer' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'noise', label: 'Noise' },
];

/** Long enough to see a mode move before the demonstration shows the next one. */
const MODE_HOLD_MS = 5200;

export default function Background03() {
  const [mode, setMode] = useState<DitherMode>('pointer');
  const steps: AutoplayStep[] = [
    { after: MODE_HOLD_MS, run: () => setMode('horizon') },
    { after: MODE_HOLD_MS, run: () => setMode('noise') },
    { after: MODE_HOLD_MS, run: () => setMode('pointer') },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, { loopAfter: 0 });

  return (
    <DemoBand
      ref={ref}
      title='One light, drawn in dots'
      background={<DitherLight mode={mode} />}
    >
      <Segments
        value={mode}
        segments={MODES}
        onValueChange={setMode}
        label='How the light moves'
        className='bg-card hairline-ring ring-border'
      />
    </DemoBand>
  );
}
