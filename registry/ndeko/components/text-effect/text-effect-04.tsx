'use client';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { useHover } from './_parts/use-hover';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';

export type GlyphShape =
  | { kind: 'word'; text: string }
  | {
      kind: 'icon';
      /** One SVG path, drawn in a square of `size` units, as an icon of 24 by 24 is. */
      path: string;
      size: number;
      /** What the icon shows, read by screen readers. */
      label: string;
    };

/** Where the grid of characters sits in the art, in CSS pixels. */
type Layout = {
  width: number;
  height: number;
  cols: number;
  rows: number;
  originX: number;
  originY: number;
};

/** The covered cells of a shape, from left to right, and how lit each one is. */
type Field = {
  cells: number[];
  brightness: number[];
};

/** One character per covered cell. Each one travels from where it was to its cell when the shape changes. */
type Swarm = {
  count: number;
  fromX: Float32Array;
  fromY: Float32Array;
  fromLight: Float32Array;
  toX: Float32Array;
  toY: Float32Array;
  toLight: Float32Array;
  delay: Float32Array;
  phase: Float32Array;
};

/** The characters a smaller shape has no cell for: they fade where they stood. */
type Ghosts = {
  count: number;
  x: Float32Array;
  y: Float32Array;
  light: Float32Array;
};

type Ripple = {
  x: number;
  y: number;
  startedAt: number;
};

type Pointer = {
  x: number;
  y: number;
  movedAt: number;
};

type Atlas = {
  canvas: HTMLCanvasElement;
  glyphCount: number;
  ratio: number;
};

type EngineOptions = {
  canvas: HTMLCanvasElement;
  box: HTMLElement;
  overlay: HTMLElement;
  ramp: string;
  shape: GlyphShape;
  isStill: boolean;
  isPlaying: boolean;
};

type GlyphEngine = {
  setShape: (shape: GlyphShape) => void;
  setPlaying: (isPlaying: boolean) => void;
  pointAt: (x: number, y: number) => void;
  release: () => void;
  ripple: (x: number, y: number) => void;
  dispose: () => void;
};

const DEFAULT_RAMP = '·:-=+*#%@';

const CELL_W = 8;

const CELL_H = 12;

const GLYPH_FONT_PX = 11;

const GLYPH_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** A backing store above two device pixels a point costs four times the fill for a picture nobody sees sharper. */
const MAX_PIXEL_RATIO = 2;

/** A word fills this share of the height of the art, less when it is long; an icon this share of its shorter side. */
const WORD_HEIGHT_SHARE = 0.78;

const WORD_WIDTH_SHARE = 0.9;

const ICON_SHARE = 0.86;

/** A cell this much covered by the shape holds a character. */
const COVERED_FROM = 0.3;

/** The light comes from the top left: a slope that faces it is lit, a slope that turns away is in shade. */
const LIGHT_ACROSS = -Math.SQRT1_2;

const LIGHT_DOWN = -Math.SQRT1_2;

const SLOPE_GAIN = 6;

const FLAT_LIGHT = 0.55;

const SHIMMER = 0.08;

const SHIMMER_HERTZ = 0.22;

/** A band of light crosses the art from the top left every few seconds. */
const SWEEP_PERIOD_S = 5.5;

const SWEEP_GAIN = 0.32;

const SWEEP_WIDTH = 0.09;

const POINTER_REACH_PX = 70;

const POINTER_GAIN = 0.55;

const RIPPLE_SPEED_PX_S = 260;

const RIPPLE_WIDTH_PX = 18;

const RIPPLE_GAIN = 0.6;

const RIPPLE_LIFE_MS = 1300;

const MORPH_MS = 760;

/** Characters set off from left to right, the last this long after the first. */
const MORPH_SWEEP_MS = 260;

const GHOST_FADE_MS = 320;

/** While something moves the art draws thirty frames a second, and twenty while it only shimmers. */
const BUSY_FRAME_MS = 33;

const IDLE_FRAME_MS = 50;

/** A pointer that stopped this long ago only shimmers. */
const POINTER_SETTLED_MS = 400;

const TAU = Math.PI * 2;

function pixelRatioOf() {
  const screenRatio = window.devicePixelRatio || 1;
  return Math.min(screenRatio, MAX_PIXEL_RATIO);
}

function clampUnit(value: number) {
  const atLeast = Math.max(0, value);
  return Math.min(1, atLeast);
}

function smoothStep(from: number, to: number, value: number) {
  const progress = clampUnit((value - from) / (to - from));
  return progress * progress * (3 - 2 * progress);
}

function easeInOut(progress: number) {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }
  const fromEnd = -2 * progress + 2;
  return 1 - (fromEnd * fromEnd * fromEnd) / 2;
}

function shapeKeyOf(shape: GlyphShape) {
  if (shape.kind === 'word') {
    return `word:${shape.text}`;
  }
  return `icon:${shape.size}:${shape.path}`;
}

function layoutOf(width: number, height: number): Layout {
  const cols = Math.max(1, Math.floor(width / CELL_W));
  const rows = Math.max(1, Math.floor(height / CELL_H));
  const originX = (width - cols * CELL_W) / 2;
  const originY = (height - rows * CELL_H) / 2;
  return { width, height, cols, rows, originX, originY };
}

/** Draws the word as large as the art allows and hands back its size, so the readable copy over the art can match it. */
function drawWord(
  pen: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  family: string
) {
  const tallest = height * WORD_HEIGHT_SHARE;
  pen.font = `600 ${tallest}px ${family}`;
  const measured = pen.measureText(text).width;
  const room = width * WORD_WIDTH_SHARE;
  let size = tallest;
  if (measured > room) {
    size = (tallest * room) / measured;
  }
  pen.font = `600 ${size}px ${family}`;
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  pen.fillText(text, width / 2, height / 2);
  return size;
}

function drawIcon(
  pen: CanvasRenderingContext2D,
  path: string,
  size: number,
  width: number,
  height: number
) {
  const side = Math.min(width, height) * ICON_SHARE;
  const scale = side / size;
  const left = (width - side) / 2;
  const top = (height - side) / 2;
  pen.setTransform(scale, 0, 0, scale, left, top);
  pen.fill(new Path2D(path));
}

/** How much of each cell the shape covers, from 0 to 1, read from a drawing of it at the size of the grid. */
function coverageOf(shape: GlyphShape, layout: Layout, family: string) {
  const width = layout.cols * CELL_W;
  const height = layout.rows * CELL_H;
  const coverage = new Float32Array(layout.cols * layout.rows);
  const sketch = document.createElement('canvas');
  sketch.width = width;
  sketch.height = height;
  const pen = sketch.getContext('2d', { willReadFrequently: true });
  if (!pen) {
    return { coverage, wordSize: 0 };
  }
  pen.fillStyle = 'black';
  let wordSize = 0;
  if (shape.kind === 'word') {
    wordSize = drawWord(pen, shape.text, width, height, family);
  }
  if (shape.kind === 'icon') {
    drawIcon(pen, shape.path, shape.size, width, height);
  }
  const pixels = pen.getImageData(0, 0, width, height).data;
  const samplesAcross = 4;
  const samplesDown = 4;
  const sampleCount = samplesAcross * samplesDown;
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      let total = 0;
      for (let down = 0; down < samplesDown; down += 1) {
        const y = Math.floor(
          row * CELL_H + ((down + 0.5) * CELL_H) / samplesDown
        );
        for (let across = 0; across < samplesAcross; across += 1) {
          const x = Math.floor(
            col * CELL_W + ((across + 0.5) * CELL_W) / samplesAcross
          );
          const alphaIndex = (y * width + x) * 4 + 3;
          total += pixels[alphaIndex];
        }
      }
      coverage[row * layout.cols + col] = total / (sampleCount * 255);
    }
  }
  return { coverage, wordSize };
}

function coverageAt(
  coverage: Float32Array,
  layout: Layout,
  col: number,
  row: number
) {
  const boundedCol = Math.min(layout.cols - 1, Math.max(0, col));
  const boundedRow = Math.min(layout.rows - 1, Math.max(0, row));
  return coverage[boundedRow * layout.cols + boundedCol];
}

/** The shape as a gentle hill: each cell is the mean of its neighbours, so the slopes run over two or three cells. */
function softened(coverage: Float32Array, layout: Layout) {
  const soft = new Float32Array(coverage.length);
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      let total = 0;
      for (let down = -1; down <= 1; down += 1) {
        for (let across = -1; across <= 1; across += 1) {
          total += coverageAt(coverage, layout, col + across, row + down);
        }
      }
      soft[row * layout.cols + col] = total / 9;
    }
  }
  return soft;
}

/** The covered cells, from left to right, each lit by how much its slope faces the light. */
function fieldOf(coverage: Float32Array, layout: Layout): Field {
  const hill = softened(softened(coverage, layout), layout);
  const cells: number[] = [];
  const brightness: number[] = [];
  for (let col = 0; col < layout.cols; col += 1) {
    for (let row = 0; row < layout.rows; row += 1) {
      const index = row * layout.cols + col;
      const covered = coverage[index];
      if (covered < COVERED_FROM) {
        continue;
      }
      const left = coverageAt(hill, layout, col - 1, row);
      const right = coverageAt(hill, layout, col + 1, row);
      const above = coverageAt(hill, layout, col, row - 1);
      const below = coverageAt(hill, layout, col, row + 1);
      const slopeAcross = (right - left) / (2 * CELL_W);
      const slopeDown = (below - above) / (2 * CELL_H);
      const facing = -(slopeAcross * LIGHT_ACROSS + slopeDown * LIGHT_DOWN);
      const lit = clampUnit(FLAT_LIGHT + facing * SLOPE_GAIN * CELL_W);
      const edgeSoftening = 0.75 + 0.25 * covered;
      cells.push(index);
      brightness.push(lit * edgeSoftening);
    }
  }
  return { cells, brightness };
}

function emptySwarm(count: number): Swarm {
  return {
    count,
    fromX: new Float32Array(count),
    fromY: new Float32Array(count),
    fromLight: new Float32Array(count),
    toX: new Float32Array(count),
    toY: new Float32Array(count),
    toLight: new Float32Array(count),
    delay: new Float32Array(count),
    phase: new Float32Array(count),
  };
}

function emptyGhosts(count: number): Ghosts {
  return {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    light: new Float32Array(count),
  };
}

function cellLeftOf(layout: Layout, cell: number) {
  const col = cell % layout.cols;
  return layout.originX + col * CELL_W;
}

function cellTopOf(layout: Layout, cell: number) {
  const row = Math.floor(cell / layout.cols);
  return layout.originY + row * CELL_H;
}

/** How far a character has gone on its way to its cell, from 0 to 1. */
function travelOf(swarm: Swarm, index: number, sinceMorph: number) {
  const started = sinceMorph - swarm.delay[index];
  const progress = clampUnit(started / MORPH_MS);
  return easeInOut(progress);
}

/** Every character standing in its cell at once, with no travel. */
function settledSwarmOf(field: Field, layout: Layout) {
  const count = field.cells.length;
  const swarm = emptySwarm(count);
  for (let index = 0; index < count; index += 1) {
    const cell = field.cells[index];
    const x = cellLeftOf(layout, cell);
    const y = cellTopOf(layout, cell);
    const light = field.brightness[index];
    swarm.fromX[index] = x;
    swarm.toX[index] = x;
    swarm.fromY[index] = y;
    swarm.toY[index] = y;
    swarm.fromLight[index] = light;
    swarm.toLight[index] = light;
    swarm.phase[index] = noiseAt(index, 7) * TAU;
  }
  return swarm;
}

/** Where each character of a swarm stands now, and how lit it is, sorted from left to right. */
function standingOf(swarm: Swarm, sinceMorph: number) {
  const x = new Float32Array(swarm.count);
  const y = new Float32Array(swarm.count);
  const light = new Float32Array(swarm.count);
  const order: number[] = [];
  for (let index = 0; index < swarm.count; index += 1) {
    const travel = travelOf(swarm, index, sinceMorph);
    x[index] =
      swarm.fromX[index] + (swarm.toX[index] - swarm.fromX[index]) * travel;
    y[index] =
      swarm.fromY[index] + (swarm.toY[index] - swarm.fromY[index]) * travel;
    light[index] =
      swarm.fromLight[index] +
      (swarm.toLight[index] - swarm.fromLight[index]) * travel;
    order.push(index);
  }
  order.sort((first, second) => {
    const across = x[first] - x[second];
    if (across !== 0) {
      return across;
    }
    return y[first] - y[second];
  });
  return { x, y, light, order };
}

/**
 * The characters of the old shape set off for the cells of the new one, the leftmost to the
 * leftmost, so the shape re-forms across rather than in a scramble. When the new shape has more
 * cells, some characters split in two; when it has fewer, the ones left over fade where they stand.
 */
function morphedSwarmOf(
  current: Swarm,
  sinceMorph: number,
  field: Field,
  layout: Layout
) {
  const count = field.cells.length;
  const swarm = emptySwarm(count);
  const standing = standingOf(current, sinceMorph);
  const oldCount = current.count;
  const isTaken = new Uint8Array(oldCount);
  for (let index = 0; index < count; index += 1) {
    const cell = field.cells[index];
    const toX = cellLeftOf(layout, cell);
    const toY = cellTopOf(layout, cell);
    const toLight = field.brightness[index];
    swarm.toX[index] = toX;
    swarm.toY[index] = toY;
    swarm.toLight[index] = toLight;
    swarm.phase[index] = noiseAt(index, 7) * TAU;
    swarm.delay[index] = (toX / Math.max(1, layout.width)) * MORPH_SWEEP_MS;
    if (oldCount === 0) {
      swarm.fromX[index] = toX;
      swarm.fromY[index] = toY;
      continue;
    }
    const share = Math.floor((index * oldCount) / count);
    const source = standing.order[share];
    isTaken[source] = 1;
    swarm.fromX[index] = standing.x[source];
    swarm.fromY[index] = standing.y[source];
    swarm.fromLight[index] = standing.light[source];
  }
  const leftOver: number[] = [];
  for (let index = 0; index < oldCount; index += 1) {
    if (isTaken[index] === 0) {
      leftOver.push(index);
    }
  }
  const ghosts = emptyGhosts(leftOver.length);
  leftOver.forEach((source, index) => {
    ghosts.x[index] = standing.x[source];
    ghosts.y[index] = standing.y[source];
    ghosts.light[index] = standing.light[source];
  });
  return { swarm, ghosts };
}

function atlasOf(glyphs: string[], ink: string, lit: string): Atlas | null {
  const ratio = pixelRatioOf();
  const cellWidth = CELL_W * ratio;
  const cellHeight = CELL_H * ratio;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(glyphs.length * cellWidth);
  canvas.height = Math.ceil(2 * cellHeight);
  const pen = canvas.getContext('2d');
  if (!pen) {
    return null;
  }
  pen.font = `500 ${GLYPH_FONT_PX * ratio}px ${GLYPH_FONT}`;
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  glyphs.forEach((glyph, index) => {
    const x = index * cellWidth + cellWidth / 2;
    pen.fillStyle = ink;
    pen.fillText(glyph, x, cellHeight / 2);
    pen.fillStyle = lit;
    pen.fillText(glyph, x, cellHeight + cellHeight / 2);
  });
  return { canvas, glyphCount: glyphs.length, ratio };
}

function inkOf(canvas: HTMLCanvasElement) {
  const styles = getComputedStyle(canvas);
  const lit = styles.getPropertyValue('--primary').trim();
  return { ink: styles.color, lit: lit || styles.color };
}

function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  return () => observer.disconnect();
}

function sweepAt(seconds: number, x: number, y: number, layout: Layout) {
  const cycle = (seconds % SWEEP_PERIOD_S) / SWEEP_PERIOD_S;
  const centre = cycle * 1.6 - 0.3;
  const across = x / Math.max(1, layout.width);
  const down = y / Math.max(1, layout.height);
  const diagonal = (across + down) / 2;
  const gap = (diagonal - centre) / SWEEP_WIDTH;
  return SWEEP_GAIN * Math.exp(-gap * gap);
}

function pointerGlowAt(pointer: Pointer | null, x: number, y: number) {
  if (!pointer) {
    return 0;
  }
  const distance = Math.hypot(x - pointer.x, y - pointer.y);
  const nearness = Math.max(0, 1 - distance / POINTER_REACH_PX);
  return POINTER_GAIN * nearness * nearness;
}

function rippleAt(ripples: Ripple[], now: number, x: number, y: number) {
  let total = 0;
  for (const ripple of ripples) {
    const age = now - ripple.startedAt;
    const reach = (age / 1000) * RIPPLE_SPEED_PX_S;
    const distance = Math.hypot(x - ripple.x, y - ripple.y);
    const gap = (distance - reach) / RIPPLE_WIDTH_PX;
    const fading = 1 - age / RIPPLE_LIFE_MS;
    total += RIPPLE_GAIN * Math.exp(-gap * gap) * Math.max(0, fading);
  }
  return total;
}

function drawGlyph(
  pen: CanvasRenderingContext2D,
  atlas: Atlas,
  light: number,
  alphaScale: number,
  x: number,
  y: number
) {
  const bounded = clampUnit(light);
  const glyph = Math.min(
    atlas.glyphCount - 1,
    Math.floor(bounded * atlas.glyphCount)
  );
  const alpha = (0.3 + 0.7 * bounded) * alphaScale;
  const litShare = smoothStep(0.7, 0.95, bounded);
  const inkAlpha = alpha * (1 - litShare);
  const litAlpha = alpha * litShare;
  const sourceWidth = CELL_W * atlas.ratio;
  const sourceHeight = CELL_H * atlas.ratio;
  const sourceX = glyph * sourceWidth;
  if (inkAlpha > 0.02) {
    pen.globalAlpha = inkAlpha;
    pen.drawImage(
      atlas.canvas,
      sourceX,
      0,
      sourceWidth,
      sourceHeight,
      x,
      y,
      CELL_W,
      CELL_H
    );
  }
  if (litAlpha > 0.02) {
    pen.globalAlpha = litAlpha;
    pen.drawImage(
      atlas.canvas,
      sourceX,
      sourceHeight,
      sourceWidth,
      sourceHeight,
      x,
      y,
      CELL_W,
      CELL_H
    );
  }
}

function frameWaitOf(isBusy: boolean) {
  if (isBusy) {
    return BUSY_FRAME_MS;
  }
  return IDLE_FRAME_MS;
}

function overlayFontOf(shape: GlyphShape, size: number) {
  if (shape.kind === 'word') {
    return `${Math.round(size * 100) / 100}px`;
  }
  return '';
}

/**
 * The art on its canvas. It owns every frame: React hands it a shape and whether it may play, and
 * it asks for frames only while it plays, thirty a second while something moves and twenty while
 * it only shimmers, none off screen. Under reduced motion it draws a still frame on each change.
 */
function createGlyphEngine(options: EngineOptions): GlyphEngine {
  const { canvas, box, overlay, isStill } = options;
  const glyphs = Array.from(options.ramp);
  const ripples: Ripple[] = [];
  let shape = options.shape;
  let shapeKey = shapeKeyOf(shape);
  let isPlaying = options.isPlaying;
  let layout = layoutOf(box.clientWidth, box.clientHeight);
  let backingRatio = pixelRatioOf();
  let swarm = emptySwarm(0);
  let ghosts = emptyGhosts(0);
  let atlas: Atlas | null = null;
  let pointer: Pointer | null = null;
  let morphAt = Number.NEGATIVE_INFINITY;
  let ghostsAt = Number.NEGATIVE_INFINITY;
  let shimmerSeconds = 0;
  let lastFrameAt = 0;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pen = canvas.getContext('2d');

  function rebuildAtlas() {
    const colours = inkOf(canvas);
    atlas = atlasOf(glyphs, colours.ink, colours.lit);
  }

  /** A zoom changes the ratio without resizing the box: frames keep the ratio the canvas was sized with until the next resize. */
  function sizeCanvas() {
    backingRatio = pixelRatioOf();
    const width = Math.round(layout.width * backingRatio);
    const height = Math.round(layout.height * backingRatio);
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  }

  function fieldForShape() {
    const family = getComputedStyle(box).fontFamily;
    const drawn = coverageOf(shape, layout, family);
    overlay.style.fontSize = overlayFontOf(shape, drawn.wordSize);
    return fieldOf(drawn.coverage, layout);
  }

  function settle() {
    swarm = settledSwarmOf(fieldForShape(), layout);
    ghosts = emptyGhosts(0);
    morphAt = Number.NEGATIVE_INFINITY;
  }

  function isMorphing(now: number) {
    const sinceMorph = now - morphAt;
    return sinceMorph < MORPH_MS + MORPH_SWEEP_MS;
  }

  function dropOldRipples(now: number) {
    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const age = now - ripples[index].startedAt;
      if (age > RIPPLE_LIFE_MS) {
        ripples.splice(index, 1);
      }
    }
  }

  function isBusyAt(now: number) {
    const isPointerMoving =
      pointer !== null && now - pointer.movedAt < POINTER_SETTLED_MS;
    const hasRipples = ripples.length > 0;
    return isMorphing(now) || hasRipples || isPointerMoving;
  }

  function drawGhosts(
    context: CanvasRenderingContext2D,
    glyphAtlas: Atlas,
    now: number
  ) {
    const fading = 1 - (now - ghostsAt) / GHOST_FADE_MS;
    if (fading <= 0) {
      ghosts = emptyGhosts(0);
      return;
    }
    for (let index = 0; index < ghosts.count; index += 1) {
      drawGlyph(
        context,
        glyphAtlas,
        ghosts.light[index],
        fading,
        ghosts.x[index],
        ghosts.y[index]
      );
    }
  }

  function draw(now: number) {
    if (!pen || !atlas) {
      return;
    }
    pen.setTransform(backingRatio, 0, 0, backingRatio, 0, 0);
    pen.clearRect(0, 0, layout.width, layout.height);
    dropOldRipples(now);
    drawGhosts(pen, atlas, now);
    const sinceMorph = now - morphAt;
    const isMoving = !isStill;
    for (let index = 0; index < swarm.count; index += 1) {
      const travel = travelOf(swarm, index, sinceMorph);
      const x =
        swarm.fromX[index] + (swarm.toX[index] - swarm.fromX[index]) * travel;
      const y =
        swarm.fromY[index] + (swarm.toY[index] - swarm.fromY[index]) * travel;
      let light =
        swarm.fromLight[index] +
        (swarm.toLight[index] - swarm.fromLight[index]) * travel;
      light += pointerGlowAt(pointer, x + CELL_W / 2, y + CELL_H / 2);
      if (isMoving) {
        const wave = Math.sin(
          shimmerSeconds * SHIMMER_HERTZ * TAU + swarm.phase[index]
        );
        light += SHIMMER * wave;
        light += sweepAt(shimmerSeconds, x, y, layout);
        light += rippleAt(ripples, now, x + CELL_W / 2, y + CELL_H / 2);
      }
      drawGlyph(pen, atlas, light, 1, x, y);
    }
    pen.globalAlpha = 1;
  }

  function clearPending() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = 0;
    timer = undefined;
  }

  function askForFrame() {
    timer = undefined;
    frame = requestAnimationFrame(tick);
  }

  function scheduleIn(wait: number) {
    clearTimeout(timer);
    timer = setTimeout(askForFrame, wait);
  }

  function tick(now: number) {
    frame = 0;
    const elapsed = Math.max(0, now - lastFrameAt);
    lastFrameAt = now;
    shimmerSeconds += Math.min(elapsed, 100) / 1000;
    draw(now);
    if (!isPlaying) {
      return;
    }
    scheduleIn(frameWaitOf(isBusyAt(now)));
  }

  function start() {
    clearPending();
    lastFrameAt = performance.now();
    frame = requestAnimationFrame(tick);
  }

  /**
   * Something changed: the next frame comes as soon as the cap allows, so a pointer moving at the
   * rate of the screen draws thirty frames a second at most, the still frame of reduced motion too.
   */
  function wake() {
    if (frame !== 0) {
      return;
    }
    const sinceFrame = performance.now() - lastFrameAt;
    const wait = Math.max(0, BUSY_FRAME_MS - sinceFrame);
    scheduleIn(wait);
  }

  function relayout() {
    layout = layoutOf(box.clientWidth, box.clientHeight);
    sizeCanvas();
    rebuildAtlas();
    settle();
    wake();
  }

  function setShape(next: GlyphShape) {
    const nextKey = shapeKeyOf(next);
    if (nextKey === shapeKey) {
      return;
    }
    shape = next;
    shapeKey = nextKey;
    if (isStill) {
      settle();
      wake();
      return;
    }
    const now = performance.now();
    const morphed = morphedSwarmOf(
      swarm,
      now - morphAt,
      fieldForShape(),
      layout
    );
    swarm = morphed.swarm;
    ghosts = morphed.ghosts;
    morphAt = now;
    ghostsAt = now;
    wake();
  }

  /** The engine is born with the first value, so hearing it again must not cancel the frame it asked for. */
  function setPlaying(next: boolean) {
    if (next === isPlaying) {
      return;
    }
    isPlaying = next;
    if (next) {
      start();
      return;
    }
    clearPending();
  }

  function pointAt(x: number, y: number) {
    pointer = { x, y, movedAt: performance.now() };
    wake();
  }

  function release() {
    pointer = null;
    wake();
  }

  function ripple(x: number, y: number) {
    if (isStill) {
      return;
    }
    ripples.push({ x, y, startedAt: performance.now() });
    wake();
  }

  const resizer = new ResizeObserver(relayout);
  resizer.observe(box);
  const stopWatchingTheme = watchTheme(() => {
    rebuildAtlas();
    wake();
  });
  relayout();

  function dispose() {
    clearPending();
    resizer.disconnect();
    stopWatchingTheme();
  }

  return { setShape, setPlaying, pointAt, release, ripple, dispose };
}

function roleOf(shape: GlyphShape) {
  if (shape.kind === 'icon') {
    return 'img';
  }
  return undefined;
}

function labelOf(shape: GlyphShape) {
  if (shape.kind === 'icon') {
    return shape.label;
  }
  return undefined;
}

function wordOf(shape: GlyphShape) {
  if (shape.kind === 'word') {
    return shape.text;
  }
  return '';
}

export type GlyphArtHandle = {
  /** Lights the characters around a point given in shares of the art, as a pointer there would. */
  pointAt: (across: number, down: number) => void;
  release: () => void;
  /** Sends a ripple from a point given in shares of the art. */
  ripple: (across: number, down: number) => void;
};

export type GlyphArtProps = {
  shape: GlyphShape;
  /** The characters, from the faintest to the densest. */
  ramp?: string;
  /** Lights the art from outside, for a demonstration. */
  handleRef?: React.Ref<GlyphArtHandle>;
  className?: string;
};

/**
 * A word or an icon drawn in characters on one canvas, lit from the top left: slopes that face the
 * light take dense characters in the brand ink, slopes in shade take faint ones, and a band of light
 * crosses it now and then. A new shape sends the characters travelling to their new cells; the
 * pointer lights the characters near it and a press sends a ripple. A word stays in the page as
 * text that can be selected and read; an icon is read by its label.
 */
export function GlyphArt({
  shape,
  ramp = DEFAULT_RAMP,
  handleRef,
  className,
}: GlyphArtProps) {
  const { ref, isPlaying, isStill } = usePlayWhileSeen<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const engine = useRef<GlyphEngine | null>(null);
  const latestShape = useRef(shape);
  const latestPlaying = useRef(isPlaying);
  const isWord = shape.kind === 'word';

  useEffect(() => {
    latestShape.current = shape;
    latestPlaying.current = isPlaying;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = ref.current;
    const overlay = overlayRef.current;
    const hasCanvas = canvas !== null;
    const hasBox = box !== null;
    const hasOverlay = overlay !== null;
    const hasParts = hasCanvas && hasBox && hasOverlay;
    if (!hasParts) {
      return;
    }
    const created = createGlyphEngine({
      canvas,
      box,
      overlay,
      ramp,
      isStill,
      shape: latestShape.current,
      isPlaying: latestPlaying.current,
    });
    engine.current = created;
    return () => {
      created.dispose();
      engine.current = null;
    };
  }, [ref, ramp, isStill]);

  useEffect(() => {
    engine.current?.setShape(shape);
  }, [shape]);

  useEffect(() => {
    engine.current?.setPlaying(isPlaying);
  }, [isPlaying]);

  function pointFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    engine.current?.pointAt(event.clientX - box.left, event.clientY - box.top);
  }

  function rippleFromPress(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    engine.current?.ripple(event.clientX - box.left, event.clientY - box.top);
  }

  function release() {
    engine.current?.release();
  }

  useImperativeHandle(handleRef, () => ({
    pointAt(across: number, down: number) {
      const box = ref.current;
      if (!box) {
        return;
      }
      engine.current?.pointAt(
        across * box.clientWidth,
        down * box.clientHeight
      );
    },
    release,
    ripple(across: number, down: number) {
      const box = ref.current;
      if (!box) {
        return;
      }
      engine.current?.ripple(across * box.clientWidth, down * box.clientHeight);
    },
  }));

  return (
    <div
      ref={ref}
      role={roleOf(shape)}
      aria-label={labelOf(shape)}
      onPointerMove={pointFromEvent}
      onPointerLeave={release}
      onPointerDown={rippleFromPress}
      className={cn('relative aspect-[2/1] w-full', className)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden='true'
        className={cn(
          'text-foreground absolute inset-0 size-full',
          isWord && 'forced-colors:hidden'
        )}
      />
      <span
        ref={overlayRef}
        className='selection:bg-primary/20 absolute inset-0 flex items-center justify-center leading-none font-semibold whitespace-nowrap text-transparent selection:text-transparent forced-colors:text-[color:CanvasText]'
      >
        {wordOf(shape)}
      </span>
    </div>
  );
}

type ShapeChoice = 'word' | 'bolt' | 'drop';

type GlyphBeat =
  | { after: number; kind: 'shape'; shape: ShapeChoice }
  | { after: number; kind: 'ripple'; across: number; down: number }
  | { after: number; kind: 'point'; across: number; down: number }
  | { after: number; kind: 'release' };

const SHAPES: Record<ShapeChoice, GlyphShape> = {
  word: { kind: 'word', text: 'Light' },
  bolt: {
    kind: 'icon',
    path: 'M13.2 1.8 4.6 13.4h6.1l-1.9 8.8 9.6-12.6h-6.3l1.1-7.8Z',
    size: 24,
    label: 'A lightning bolt drawn in characters',
  },
  drop: {
    kind: 'icon',
    path: 'M12 2.5c4 4.8 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 8 7.3 12 2.5Z',
    size: 24,
    label: 'A water drop drawn in characters',
  },
};

const CHOICES: Segment<ShapeChoice>[] = [
  { value: 'word', label: 'Word' },
  { value: 'bolt', label: 'Bolt' },
  { value: 'drop', label: 'Drop' },
];

/** A pointer passing across the middle of the art from left to right. */
const PASS: GlyphBeat[] = [0.18, 0.3, 0.42, 0.54, 0.66, 0.78].map(
  (across): GlyphBeat => ({ after: 110, kind: 'point', across, down: 0.5 })
);

const GLYPH_BEATS: GlyphBeat[] = [
  { after: 1600, kind: 'ripple', across: 0.32, down: 0.45 },
  { after: 2400, kind: 'shape', shape: 'bolt' },
  { after: 2200, kind: 'point', across: 0.06, down: 0.5 },
  ...PASS,
  { after: 300, kind: 'release' },
  { after: 1600, kind: 'shape', shape: 'drop' },
  { after: 2000, kind: 'ripple', across: 0.5, down: 0.62 },
  { after: 2400, kind: 'shape', shape: 'word' },
];

export default function TextEffect04() {
  const [choice, setChoice] = useState<ShapeChoice>('word');
  const art = useRef<GlyphArtHandle>(null);
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = GLYPH_BEATS.map((beat) => ({
    after: beat.after,
    run: () => playBeat(beat),
  }));
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: () => setChoice('word'),
    isEnabled: !isHovered,
  });
  const isDemoStopped = !isAutoplaying && !isHovered;

  /** A light the demonstration's pointer left on the art goes out once a person takes over. */
  useEffect(() => {
    if (isDemoStopped) {
      art.current?.release();
    }
  }, [isDemoStopped]);

  function playBeat(beat: GlyphBeat) {
    if (beat.kind === 'shape') {
      setChoice(beat.shape);
      return;
    }
    if (beat.kind === 'ripple') {
      art.current?.ripple(beat.across, beat.down);
      return;
    }
    if (beat.kind === 'point') {
      art.current?.pointAt(beat.across, beat.down);
      return;
    }
    art.current?.release();
  }

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[36rem] flex-col items-center gap-4'
    >
      <div className='w-full' {...hoverHandlers}>
        <GlyphArt handleRef={art} shape={SHAPES[choice]} />
      </div>
      <Segments
        value={choice}
        segments={CHOICES}
        onValueChange={setChoice}
        label='Shape'
      />
    </div>
  );
}
