'use client';

import { useMemo } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { AT_REST, NEXT_FRAME } from './_parts/frame-loop';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';
import { clamp, shareOf, towards, type Point } from './_parts/math';
import { randomOf } from './_parts/seeded';
import type { Scene } from './_parts/stage';
import { StageCanvas } from './_parts/stage-canvas';
import { wipeSurface, type Inks, type Surface } from './_parts/surface';

/** One node for this many square pixels: a modest count, whatever the size of the box. */
const AREA_PER_NODE = 12000;

const MIN_NODES = 10;

/** Every pair of nodes is compared each frame, so the count has a ceiling. */
const MAX_NODES = 140;

const LINK_PX = 130;

/** The ink of a link between two nodes that touch. It falls to nothing at the reach of a link. */
const LINK_ALPHA = 0.26;

const NODE_ALPHA = 0.7;

const NODE_RADIUS = 1.6;

const MIN_SPEED_PX = 4;

const MAX_SPEED_PX = 10;

const SPEED_SPREAD_PX = MAX_SPEED_PX - MIN_SPEED_PX;

const POINTER_REACH_PX = 190;

const POINTER_ALPHA = 0.5;

/** A node near the pointer is drawn this much closer to it, as if the pointer tugged at the web. */
const POINTER_PULL_PX = 7;

const POINTER_RADIUS = 2.4;

const PRESENCE_EASE_S = 0.2;

const GONE = 0.01;

const FULL_TURN = Math.PI * 2;

const SEED = 8;

const NO_INKS: Inks = { hue: 'transparent', line: 'transparent' };

type Web = {
  density: number;
  isStill: boolean;
  inks: Inks;
  width: number;
  height: number;
  count: number;
  x: Float32Array;
  y: Float32Array;
  speedX: Float32Array;
  speedY: Float32Array;
  /** Where each node is drawn: its place, moved a little towards the pointer when one is near. */
  shownX: Float32Array;
  shownY: Float32Array;
  pointer: Point;
  hasPointer: boolean;
  /** How much the pointer is there, from 0 to 1: its links fade in and out with it. */
  presence: number;
  random: () => number;
};

function webOf(density: number): Web {
  return {
    density: Math.max(0, density),
    isStill: false,
    inks: NO_INKS,
    width: 0,
    height: 0,
    count: 0,
    x: new Float32Array(MAX_NODES),
    y: new Float32Array(MAX_NODES),
    speedX: new Float32Array(MAX_NODES),
    speedY: new Float32Array(MAX_NODES),
    shownX: new Float32Array(MAX_NODES),
    shownY: new Float32Array(MAX_NODES),
    pointer: { x: 0, y: 0 },
    hasPointer: false,
    presence: 0,
    random: randomOf(SEED),
  };
}

function countFor(web: Web) {
  const area = web.width * web.height;
  if (area === 0) {
    return 0;
  }
  const roomy = area / AREA_PER_NODE;
  const exact = roomy * web.density;
  const whole = Math.round(exact);
  return clamp(whole, MIN_NODES, MAX_NODES);
}

function placeNode(web: Web, index: number) {
  const heading = web.random() * FULL_TURN;
  const spread = web.random() * SPEED_SPREAD_PX;
  const speed = MIN_SPEED_PX + spread;
  web.x[index] = web.random() * web.width;
  web.y[index] = web.random() * web.height;
  web.speedX[index] = Math.cos(heading) * speed;
  web.speedY[index] = Math.sin(heading) * speed;
}

/** A new size keeps the nodes it has: those left outside come back in, and only the missing ones are placed. */
function layWeb(web: Web, surface: Surface, isStill: boolean) {
  web.width = surface.width;
  web.height = surface.height;
  web.isStill = isStill;
  web.hasPointer = false;
  web.presence = 0;
  const count = countFor(web);
  for (let index = 0; index < count; index += 1) {
    const isNew = index >= web.count;
    if (isNew) {
      placeNode(web, index);
    }
    web.x[index] = clamp(web.x[index], 0, web.width);
    web.y[index] = clamp(web.y[index], 0, web.height);
  }
  web.count = count;
}

/** One step along one axis: a node that reaches an edge turns back. */
function driftAlong(
  places: Float32Array,
  speeds: Float32Array,
  index: number,
  extent: number,
  seconds: number
) {
  const travel = speeds[index] * seconds;
  const moved = places[index] + travel;
  const isOutside = moved < 0 || moved > extent;
  if (isOutside) {
    speeds[index] = -speeds[index];
  }
  places[index] = clamp(moved, 0, extent);
}

function moveNodes(web: Web, seconds: number) {
  for (let index = 0; index < web.count; index += 1) {
    driftAlong(web.x, web.speedX, index, web.width, seconds);
    driftAlong(web.y, web.speedY, index, web.height, seconds);
  }
}

function followPointer(web: Web, seconds: number) {
  const share = shareOf(seconds, PRESENCE_EASE_S);
  const goal = Number(web.hasPointer);
  web.presence = towards(web.presence, goal, share);
}

/** How near the pointer something at this distance is: 1 on it, 0 at its reach and beyond. */
function nearnessAt(distance: number) {
  const farness = distance / POINTER_REACH_PX;
  const nearness = 1 - farness;
  return Math.max(0, nearness);
}

function nearnessOf(web: Web, index: number) {
  const offsetX = web.pointer.x - web.x[index];
  const offsetY = web.pointer.y - web.y[index];
  const distance = Math.hypot(offsetX, offsetY);
  return nearnessAt(distance);
}

/** A node is drawn where it is, or a little closer to the pointer, never past it. */
function placeShown(web: Web, index: number) {
  const x = web.x[index];
  const y = web.y[index];
  web.shownX[index] = x;
  web.shownY[index] = y;
  const isPointerGone = web.presence < GONE;
  if (isPointerGone) {
    return;
  }
  const offsetX = web.pointer.x - x;
  const offsetY = web.pointer.y - y;
  const distance = Math.hypot(offsetX, offsetY);
  const nearness = nearnessAt(distance);
  const eased = nearness * nearness;
  const strength = eased * web.presence;
  const wanted = strength * POINTER_PULL_PX;
  const pull = Math.min(distance, wanted);
  const reach = Math.max(distance, 1);
  const share = pull / reach;
  const pulledX = offsetX * share;
  const pulledY = offsetY * share;
  web.shownX[index] = x + pulledX;
  web.shownY[index] = y + pulledY;
}

function strokeLink(
  pen: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  alpha: number
) {
  pen.globalAlpha = alpha;
  pen.beginPath();
  pen.moveTo(fromX, fromY);
  pen.lineTo(toX, toY);
  pen.stroke();
}

function drawLinkBetween(
  pen: CanvasRenderingContext2D,
  web: Web,
  first: number,
  second: number
) {
  const offsetX = web.shownX[second] - web.shownX[first];
  const offsetY = web.shownY[second] - web.shownY[first];
  const isFarAcross = Math.abs(offsetX) > LINK_PX;
  const isFarDown = Math.abs(offsetY) > LINK_PX;
  if (isFarAcross || isFarDown) {
    return;
  }
  const distance = Math.hypot(offsetX, offsetY);
  const farness = distance / LINK_PX;
  const nearness = 1 - farness;
  if (nearness <= 0) {
    return;
  }
  const alpha = nearness * LINK_ALPHA;
  strokeLink(
    pen,
    web.shownX[first],
    web.shownY[first],
    web.shownX[second],
    web.shownY[second],
    alpha
  );
}

/** Links between the nodes, in the neutral of the theme: the closer two nodes, the more ink. */
function drawLinks(pen: CanvasRenderingContext2D, web: Web) {
  pen.strokeStyle = web.inks.line;
  for (let first = 0; first < web.count; first += 1) {
    for (let second = first + 1; second < web.count; second += 1) {
      drawLinkBetween(pen, web, first, second);
    }
  }
}

/** The pointer is a node too: it links, in the hue, to every node within its reach. */
function drawPointer(pen: CanvasRenderingContext2D, web: Web) {
  const isPointerGone = web.presence < GONE;
  if (isPointerGone) {
    return;
  }
  const { pointer } = web;
  const fullAlpha = POINTER_ALPHA * web.presence;
  pen.strokeStyle = web.inks.hue;
  for (let index = 0; index < web.count; index += 1) {
    const nearness = nearnessOf(web, index);
    if (nearness > 0) {
      const alpha = nearness * fullAlpha;
      strokeLink(
        pen,
        pointer.x,
        pointer.y,
        web.shownX[index],
        web.shownY[index],
        alpha
      );
    }
  }
  pen.fillStyle = web.inks.hue;
  pen.globalAlpha = web.presence * NODE_ALPHA;
  pen.beginPath();
  pen.arc(pointer.x, pointer.y, POINTER_RADIUS, 0, FULL_TURN);
  pen.fill();
}

function drawNodes(pen: CanvasRenderingContext2D, web: Web) {
  pen.fillStyle = web.inks.hue;
  pen.globalAlpha = NODE_ALPHA;
  pen.beginPath();
  for (let index = 0; index < web.count; index += 1) {
    const x = web.shownX[index];
    const y = web.shownY[index];
    const start = x + NODE_RADIUS;
    pen.moveTo(start, y);
    pen.arc(x, y, NODE_RADIUS, 0, FULL_TURN);
  }
  pen.fill();
}

/** Every node moves a little each frame, so the whole web is drawn again: a few dozen lines and dots. */
function drawWeb(web: Web, surface: Surface) {
  const { pen } = surface;
  wipeSurface(surface);
  for (let index = 0; index < web.count; index += 1) {
    placeShown(web, index);
  }
  pen.lineWidth = 1 / surface.pixelRatio;
  drawLinks(pen, web);
  drawPointer(pen, web);
  drawNodes(pen, web);
}

function stepWeb(web: Web, surface: Surface, seconds: number) {
  if (web.isStill) {
    return AT_REST;
  }
  moveNodes(web, seconds);
  followPointer(web, seconds);
  drawWeb(web, surface);
  return NEXT_FRAME;
}

function createNodeScene(density: number): Scene {
  const web = webOf(density);
  return {
    ink(inks) {
      web.inks = inks;
    },
    fit(surface, isStill) {
      layWeb(web, surface, isStill);
    },
    draw(surface) {
      drawWeb(web, surface);
    },
    step(surface, seconds) {
      return stepWeb(web, surface, seconds);
    },
    pointerMoved(x, y) {
      web.pointer.x = x;
      web.pointer.y = y;
      web.hasPointer = true;
    },
    pointerLeft() {
      web.hasPointer = false;
    },
  };
}

export type NodeFieldProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The nodes and the links of the pointer wear it. */
  hue?: string;
  /** How crowded the field is: 1 is one node for every 12000 square pixels, 2 is twice as many. */
  density?: number;
  /** The pointer joins the field as a node. */
  interactive?: boolean;
};

/**
 * Nodes that drift on one canvas and link with a hairline when two of them come close: the closer
 * they are, the more ink the link takes. The pointer joins as a node, links to its neighbours in
 * the hue and tugs them a little. It fills its parent, which must be positioned. Under reduced
 * motion the nodes stand still, their links drawn.
 */
export function NodeField({
  className,
  hue = DEFAULT_HUE,
  density = 1,
  interactive = true,
}: NodeFieldProps) {
  const scene = useMemo(() => createNodeScene(density), [density]);

  return (
    <StageCanvas
      scene={scene}
      hue={hue}
      isInteractive={interactive}
      className={className}
    />
  );
}

export default function Background08() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='Nodes that link when they come close'
      background={<NodeField hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
