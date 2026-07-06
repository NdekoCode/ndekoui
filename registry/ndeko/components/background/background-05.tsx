'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import {
  PRESS_LEAD_MS,
  pressedSolidOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { AT_REST, NEXT_FRAME } from './_parts/frame-loop';
import { DEFAULT_HUE } from './_parts/hue';
import { clamp, smoothstep, towards } from './_parts/math';
import { randomOf } from './_parts/seeded';
import type { Scene } from './_parts/stage';
import { StageCanvas, type StageHandle } from './_parts/stage-canvas';
import { wipeSurface, type Inks, type Surface } from './_parts/surface';

const DEFAULT_SQUARE = 4;

const DEFAULT_GAP = 4;

/** A square outside the word never gets darker than this: the grid stays a texture behind text. */
const DEFAULT_CEILING = 0.3;

/** A square of the word sits between these two, so the word reads by opacity alone. */
const WORD_FLOOR = 0.55;

const WORD_CEILING = 0.9;

const FLICKER_MS = 520;

/** The share of the squares that start a flicker each second: a few at a time. */
const FLICKER_RATE = 0.04;

/** A new word surfaces over this long: each of its squares starts at its own moment. */
const WORD_SPREAD_MS = 700;

/** The word is set this tall, as a share of the rows, and narrowed to fit this share of the columns. */
const WORD_HEIGHT_SHARE = 0.44;

const WORD_WIDTH_SHARE = 0.86;

const WORD_WEIGHT = 600;

/** How much ink a pixel of the word needs for its square to belong to the word, out of 255. */
const INK_THRESHOLD = 110;

const ALPHA_OFFSET = 3;

const CHANNELS = 4;

/** Below this a square is not drawn at all. */
const FAINT = 0.004;

const SEED = 20261112;

const NO_INKS: Inks = { hue: 'transparent', line: 'transparent' };

type GridOptions = {
  size: number;
  gap: number;
  maxOpacity: number;
  wordAt: number;
};

type Grid = {
  square: number;
  gap: number;
  pitch: number;
  /** The margin wiped around a square, so no rim is left on a screen of uneven density. */
  bleed: number;
  ceiling: number;
  wordAt: number;
  isStill: boolean;
  inks: Inks;
  family: string;
  columns: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  level: Float32Array;
  from: Float32Array;
  to: Float32Array;
  startsAt: Float64Array;
  isBusy: Uint8Array;
  /** The squares in the middle of a flicker, packed at the start of the list. */
  busy: Int32Array;
  busyCount: number;
  isWord: Uint8Array;
  word: string;
  hasShownWord: boolean;
  /** Flickers owed by the rate and not started yet: the rate rarely gives a whole number a frame. */
  owed: number;
  random: () => number;
};

function wholePixelsOf(length: number) {
  const rounded = Math.round(length);
  return Math.max(1, rounded);
}

function gridOf({ size, gap, maxOpacity, wordAt }: GridOptions): Grid {
  const square = wholePixelsOf(size);
  const space = wholePixelsOf(gap);
  const halfSpace = space / 2;
  return {
    square,
    gap: space,
    pitch: square + space,
    bleed: Math.min(1, halfSpace),
    ceiling: clamp(maxOpacity, 0, 1),
    wordAt: clamp(wordAt, 0, 1),
    isStill: false,
    inks: NO_INKS,
    family: 'sans-serif',
    columns: 0,
    rows: 0,
    offsetX: 0,
    offsetY: 0,
    level: new Float32Array(0),
    from: new Float32Array(0),
    to: new Float32Array(0),
    startsAt: new Float64Array(0),
    isBusy: new Uint8Array(0),
    busy: new Int32Array(0),
    busyCount: 0,
    isWord: new Uint8Array(0),
    word: '',
    hasShownWord: false,
    owed: 0,
    random: randomOf(SEED),
  };
}

/** A level for one square: high inside the word, low and mostly dim outside it. */
function levelFor(grid: Grid, index: number) {
  const roll = grid.random();
  const isInWord = grid.isWord[index] === 1;
  if (isInWord) {
    const span = WORD_CEILING - WORD_FLOOR;
    const lift = roll * span;
    return WORD_FLOOR + lift;
  }
  const dim = roll * roll;
  return dim * grid.ceiling;
}

function fontOf(grid: Grid, pixels: number) {
  return `${WORD_WEIGHT} ${pixels}px ${grid.family}`;
}

/**
 * The word, as one pixel a square: it is drawn as text on a sheet as large as the grid, in the
 * face the canvas inherits, and a square belongs to the word where its pixel took enough ink.
 */
function readWord(grid: Grid) {
  const { columns, rows, word } = grid;
  const count = columns * rows;
  const mask = new Uint8Array(count);
  const hasNoWord = word === '';
  if (hasNoWord || count === 0) {
    return mask;
  }
  const sheet = document.createElement('canvas');
  sheet.width = columns;
  sheet.height = rows;
  const pen = sheet.getContext('2d');
  if (!pen) {
    return mask;
  }
  const tallest = rows * WORD_HEIGHT_SHARE;
  const widest = columns * WORD_WIDTH_SHARE;
  const centreX = columns / 2;
  const centreY = rows * grid.wordAt;
  pen.font = fontOf(grid, tallest);
  const measured = pen.measureText(word).width;
  const width = Math.max(1, measured);
  const room = widest / width;
  const fit = Math.min(1, room);
  const fitted = tallest * fit;
  pen.font = fontOf(grid, fitted);
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  pen.fillText(word, centreX, centreY);
  const pixels = pen.getImageData(0, 0, columns, rows).data;
  for (let index = 0; index < count; index += 1) {
    const firstChannel = index * CHANNELS;
    const alphaAt = firstChannel + ALPHA_OFFSET;
    const hasInk = pixels[alphaAt] > INK_THRESHOLD;
    mask[index] = Number(hasInk);
  }
  return mask;
}

/** Starts a square on its way to a new level. A square already on its way heads for the new one. */
function beginFlicker(grid: Grid, index: number, startsAt: number) {
  grid.from[index] = grid.level[index];
  grid.to[index] = levelFor(grid, index);
  grid.startsAt[index] = startsAt;
  const isListed = grid.isBusy[index] === 1;
  if (isListed) {
    return;
  }
  grid.isBusy[index] = 1;
  grid.busy[grid.busyCount] = index;
  grid.busyCount += 1;
}

function settleLevels(grid: Grid) {
  for (let index = 0; index < grid.level.length; index += 1) {
    grid.level[index] = levelFor(grid, index);
  }
  grid.busyCount = 0;
  grid.isBusy.fill(0);
}

/**
 * The squares that enter or leave the word change level. The first word, and any word under
 * reduced motion, is there at once. A later word surfaces: each square starts at its own moment.
 */
function takeWord(grid: Grid, now: number) {
  const mask = readWord(grid);
  const isAtOnce = grid.isStill || !grid.hasShownWord;
  grid.hasShownWord = true;
  for (let index = 0; index < mask.length; index += 1) {
    const hasChanged = mask[index] !== grid.isWord[index];
    grid.isWord[index] = mask[index];
    if (hasChanged && isAtOnce) {
      grid.level[index] = levelFor(grid, index);
    }
    if (hasChanged && !isAtOnce) {
      const delay = grid.random() * WORD_SPREAD_MS;
      const startsAt = now + delay;
      beginFlicker(grid, index, startsAt);
    }
  }
}

function countAlong(length: number, grid: Grid) {
  const roomy = length + grid.gap;
  const count = Math.floor(roomy / grid.pitch);
  return Math.max(0, count);
}

/** The grid is centred in the box on whole pixels, so every square has crisp edges. */
function offsetOf(length: number, count: number, grid: Grid) {
  const pitched = count * grid.pitch;
  const spanned = pitched - grid.gap;
  const spare = length - spanned;
  return Math.floor(spare / 2);
}

function layGrid(grid: Grid, surface: Surface, isStill: boolean) {
  const columns = countAlong(surface.width, grid);
  const rows = countAlong(surface.height, grid);
  const count = columns * rows;
  grid.columns = columns;
  grid.rows = rows;
  grid.offsetX = offsetOf(surface.width, columns, grid);
  grid.offsetY = offsetOf(surface.height, rows, grid);
  grid.isStill = isStill;
  grid.family = getComputedStyle(surface.canvas).fontFamily;
  grid.level = new Float32Array(count);
  grid.from = new Float32Array(count);
  grid.to = new Float32Array(count);
  grid.startsAt = new Float64Array(count);
  grid.isBusy = new Uint8Array(count);
  grid.busy = new Int32Array(count);
  grid.busyCount = 0;
  grid.owed = 0;
  grid.random = randomOf(SEED);
  grid.isWord = readWord(grid);
  settleLevels(grid);
}

function paintSquare(pen: CanvasRenderingContext2D, grid: Grid, index: number) {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  const across = column * grid.pitch;
  const down = row * grid.pitch;
  const x = grid.offsetX + across;
  const y = grid.offsetY + down;
  const rim = grid.bleed * 2;
  const wiped = grid.square + rim;
  const wipedX = x - grid.bleed;
  const wipedY = y - grid.bleed;
  pen.clearRect(wipedX, wipedY, wiped, wiped);
  const level = grid.level[index];
  if (level < FAINT) {
    return;
  }
  pen.globalAlpha = level;
  pen.fillRect(x, y, grid.square, grid.square);
}

function drawGrid(grid: Grid, surface: Surface) {
  const { pen } = surface;
  wipeSurface(surface);
  pen.fillStyle = grid.inks.hue;
  for (let index = 0; index < grid.level.length; index += 1) {
    paintSquare(pen, grid, index);
  }
}

/** A few squares, picked at random, start towards a new level. One already on its way is left alone. */
function startFlickers(grid: Grid, seconds: number, now: number) {
  const count = grid.level.length;
  const perSecond = count * FLICKER_RATE;
  grid.owed += perSecond * seconds;
  while (grid.owed >= 1) {
    grid.owed -= 1;
    const roll = grid.random() * count;
    const pick = Math.floor(roll);
    const isFree = grid.isBusy[pick] === 0;
    if (isFree) {
      beginFlicker(grid, pick, now);
    }
  }
}

/** Moves one square along its flicker and draws it. It answers whether the flicker has ended. */
function advanceSquare(
  pen: CanvasRenderingContext2D,
  grid: Grid,
  index: number,
  now: number
) {
  const age = now - grid.startsAt[index];
  if (age < 0) {
    return false;
  }
  const progress = Math.min(1, age / FLICKER_MS);
  const eased = smoothstep(0, 1, progress);
  grid.level[index] = towards(grid.from[index], grid.to[index], eased);
  paintSquare(pen, grid, index);
  return progress === 1;
}

/** Only the squares in the middle of a flicker are drawn. One that has ended leaves the list. */
function advanceFlickers(
  pen: CanvasRenderingContext2D,
  grid: Grid,
  now: number
) {
  let slot = 0;
  while (slot < grid.busyCount) {
    const index = grid.busy[slot];
    const hasEnded = advanceSquare(pen, grid, index, now);
    if (hasEnded) {
      const last = grid.busyCount - 1;
      grid.isBusy[index] = 0;
      grid.busy[slot] = grid.busy[last];
      grid.busyCount = last;
    }
    if (!hasEnded) {
      slot += 1;
    }
  }
}

function stepGrid(grid: Grid, surface: Surface, seconds: number, now: number) {
  if (grid.isStill) {
    return AT_REST;
  }
  surface.pen.fillStyle = grid.inks.hue;
  startFlickers(grid, seconds, now);
  advanceFlickers(surface.pen, grid, now);
  return NEXT_FRAME;
}

type FlickerScene = Scene & {
  setWord: (word: string) => void;
};

function createFlickerScene(options: GridOptions): FlickerScene {
  const grid = gridOf(options);
  return {
    ink(inks) {
      grid.inks = inks;
    },
    fit(surface, isStill) {
      layGrid(grid, surface, isStill);
    },
    draw(surface) {
      drawGrid(grid, surface);
    },
    step(surface, seconds, now) {
      return stepGrid(grid, surface, seconds, now);
    },
    setWord(word) {
      const isSameWord = word === grid.word;
      if (isSameWord) {
        return;
      }
      grid.word = word;
      takeWord(grid, performance.now());
    },
  };
}

export type FlickeringGridProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The squares wear it. */
  hue?: string;
  /** The side of a square, in pixels. */
  size?: number;
  /** The space between two squares, in pixels. */
  gap?: number;
  /** The darkest a square outside the word gets, from 0 to 1. */
  maxOpacity?: number;
  /** A word whose squares sit higher than the rest. It reads by opacity alone. */
  word?: string;
  /** Where the middle of the word sits down the grid, from 0 at the top to 1 at the bottom. */
  wordAt?: number;
};

/**
 * A grid of small squares that flicker under a low ceiling, a few at a time, on one canvas. A word
 * can be set into it: its squares sit higher, and a new word surfaces square by square. Only the
 * squares in the middle of a flicker are drawn. It fills its parent, which must be positioned.
 * Under reduced motion the grid stands still, the word in it.
 */
export function FlickeringGrid({
  className,
  hue = DEFAULT_HUE,
  size = DEFAULT_SQUARE,
  gap = DEFAULT_GAP,
  maxOpacity = DEFAULT_CEILING,
  word = '',
  wordAt = 0.5,
}: FlickeringGridProps) {
  const stage = useRef<StageHandle>(null);
  const scene = useMemo(
    () => createFlickerScene({ size, gap, maxOpacity, wordAt }),
    [size, gap, maxOpacity, wordAt]
  );

  useEffect(() => {
    scene.setWord(word);
    stage.current?.refresh();
  }, [scene, word]);

  return (
    <StageCanvas
      handleRef={stage}
      scene={scene}
      hue={hue}
      className={className}
    />
  );
}

const WORDS = ['ndeko', 'quiet', 'fields'];

/** The word sits above the middle of the band, clear of the headline at its foot. */
const WORD_AT = 0.38;

const WORD_HOLD_MS = 3600;

export default function Background05() {
  const [round, setRound] = useState(0);
  const { pressed, press } = usePress<'next'>();
  const word = WORDS[round % WORDS.length];

  function showNextWord() {
    setRound((current) => current + 1);
  }

  const steps: AutoplayStep[] = [
    { after: WORD_HOLD_MS, run: () => press('next') },
    { after: PRESS_LEAD_MS, run: showNextWord },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, { loopAfter: 0 });

  return (
    <DemoBand
      ref={ref}
      align='end'
      title='A word surfaces from the grid'
      background={<FlickeringGrid word={word} wordAt={WORD_AT} />}
    >
      <Button
        onClick={showNextWord}
        className={pressedSolidOf(pressed === 'next')}
      >
        Next word
      </Button>
    </DemoBand>
  );
}
