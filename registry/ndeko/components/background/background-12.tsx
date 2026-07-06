'use client';

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
  type RefObject,
} from 'react';

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
import { clamp, shareOf, smoothstep, towards, type Point } from './_parts/math';
import { centreIn } from './_parts/pointer';
import { randomOf } from './_parts/seeded';
import type { Scene } from './_parts/stage';
import { StageCanvas, type StageHandle } from './_parts/stage-canvas';
import { wipeSurface, type Inks, type Surface } from './_parts/surface';

const DEFAULT_COUNT = 9;

const MIN_COUNT = 3;

const MAX_COUNT = 16;

/** Points along one thread: enough for a thread bent around a hand to stay a smooth curve. */
const SAMPLES = 48;

const LAST_SAMPLE = SAMPLES - 1;

/** A thread starts just outside the box, so its cut end is never seen. */
const OVERHANG_PX = 2;

/** The threads leave each edge over this stretch of its height, so none starts in a corner. */
const EDGE_FIRST = 0.06;

const EDGE_SPAN = 0.88;

/**
 * How far a thread strays from its even place on the edge, as a share of the gap between two. It
 * stays under half the gap, so the threads keep their order and never cross on their way in.
 */
const EDGE_JITTER = 0.35;

/** Half the height of the bundle where it passes through the target: a share of the box at rest. */
const WAIST_SHARE = 0.075;

const TIGHT_WAIST_PX = 3;

/** Drawn tight, the edge end of a thread comes this share of the way towards the height of the target. */
const EDGE_PULL = 0.16;

/**
 * How long each end of a thread runs level before it bends, as shares of the way across. With the
 * most curl the two still add up to less than the way across, so a thread never bends back.
 */
const LEAD = 0.42;

const TIGHT_LEAD = 0.24;

const TRAIL = 0.5;

const TIGHT_TRAIL = 0.3;

/** Each thread bends a little more or less than its neighbours, up to this share either way. */
const CURL = 0.12;

/** The pointer starts drawing the threads tight this far from the target, and has them tight this near. */
const TIGHTEN_FAR_PX = 320;

const TIGHTEN_NEAR_PX = 40;

const TENSION_EASE_S = 0.32;

const PRESENCE_EASE_S = 0.2;

const SETTLED = 0.002;

const GONE = 0.01;

const PART_RADIUS_PX = 96;

/** How far the hand pushes a thread aside at most. Under half the radius, so two threads never cross. */
const PART_PX = 22;

const THREAD_ALPHA = 0.24;

const PULSE_MS = 1300;

/** Presses quicker than a light takes to fade do not pile up: past this many, the oldest goes. */
const MAX_PULSES = 3;

/** A light is a short stretch of thread: its head leads, its tail fades back towards the target. */
const TAIL = 0.22;

const TAIL_STEPS = 6;

const TAIL_STEP = TAIL / TAIL_STEPS;

const LIGHT_ALPHA = 0.9;

const LIGHT_WIDTH_PX = 1.5;

/** A light grows out of the target over the start of its run and fades over its end. */
const LIGHT_IN = 0.06;

const LIGHT_OUT = 0.72;

/** Under reduced motion a press lights every thread at once and lets go: the colour changes, nothing travels. */
const STILL_PULSE_MS = 900;

const STILL_LIGHT_ALPHA = 0.5;

const SEED = 12;

const NO_INKS: Inks = { hue: 'transparent', line: 'transparent' };

type Loom = {
  count: number;
  isStill: boolean;
  inks: Inks;
  width: number;
  height: number;
  /** 1 for a thread that comes in from the left edge, -1 for one from the right edge. */
  side: Int8Array;
  /** Where a thread leaves its edge, from 0 at the top to 1 at the foot. */
  edge: Float32Array;
  /** Where a thread passes through the target, from -1 at the top of the bundle to 1 at its foot. */
  slot: Float32Array;
  curl: Float32Array;
  /** Every point of every thread, from its edge end to the target. */
  x: Float32Array;
  y: Float32Array;
  target: HTMLElement | null;
  knot: Point;
  isKnotStale: boolean;
  pointer: Point;
  hasPointer: boolean;
  /** How much the pointer is there, from 0 to 1. */
  presence: number;
  /** How tight the threads are drawn, from 0 at rest to 1 with the pointer on the target. */
  tension: number;
  /** When each light still on its way was sent. */
  pulses: number[];
};

type Pose = {
  waist: number;
  lead: number;
  trail: number;
  pull: number;
};

function perSideOf(count: number) {
  const whole = Math.round(count);
  return clamp(whole, MIN_COUNT, MAX_COUNT);
}

function sideOf(isFromLeft: boolean) {
  if (isFromLeft) {
    return 1;
  }
  return -1;
}

/** An even place along the edge, moved a little off it so the threads do not look ruled. */
function edgeOf(share: number, gap: number, random: () => number) {
  const roll = random();
  const doubled = roll * 2;
  const centred = doubled - 1;
  const reach = EDGE_JITTER * gap;
  const stray = centred * reach;
  const strayed = share + stray;
  const placed = clamp(strayed, 0, 1);
  const along = placed * EDGE_SPAN;
  return EDGE_FIRST + along;
}

function curlOf(random: () => number) {
  const roll = random();
  const doubled = roll * 2;
  const centred = doubled - 1;
  const swing = centred * CURL;
  return 1 + swing;
}

/**
 * The threads of each side, from the top of its edge to its foot. A thread keeps its rank in the
 * bundle, so the threads never cross on their way to the target.
 */
function layThreads(loom: Loom, perSide: number) {
  const random = randomOf(SEED);
  const lastRank = perSide - 1;
  const gap = 1 / lastRank;
  for (let thread = 0; thread < loom.count; thread += 1) {
    const isFromLeft = thread < perSide;
    const rank = thread % perSide;
    const share = rank * gap;
    const spread = share * 2;
    loom.side[thread] = sideOf(isFromLeft);
    loom.edge[thread] = edgeOf(share, gap, random);
    loom.slot[thread] = spread - 1;
    loom.curl[thread] = curlOf(random);
  }
}

function loomOf(count: number): Loom {
  const perSide = perSideOf(count);
  const total = perSide * 2;
  const points = total * SAMPLES;
  const loom: Loom = {
    count: total,
    isStill: false,
    inks: NO_INKS,
    width: 0,
    height: 0,
    side: new Int8Array(total),
    edge: new Float32Array(total),
    slot: new Float32Array(total),
    curl: new Float32Array(total),
    x: new Float32Array(points),
    y: new Float32Array(points),
    target: null,
    knot: { x: 0, y: 0 },
    isKnotStale: true,
    pointer: { x: 0, y: 0 },
    hasPointer: false,
    presence: 0,
    tension: 0,
    pulses: [],
  };
  layThreads(loom, perSide);
  return loom;
}

function fitLoom(loom: Loom, surface: Surface, isStill: boolean) {
  loom.width = surface.width;
  loom.height = surface.height;
  loom.isStill = isStill;
  loom.isKnotStale = true;
  loom.hasPointer = false;
  if (!isStill) {
    return;
  }
  loom.presence = 0;
  loom.tension = 0;
}

function placeKnot(loom: Loom, surface: Surface) {
  const halfWidth = surface.width / 2;
  const halfHeight = surface.height / 2;
  loom.isKnotStale = false;
  loom.knot = { x: halfWidth, y: halfHeight };
  if (!loom.target) {
    return;
  }
  const centre = centreIn(surface.canvas, loom.target);
  if (centre) {
    loom.knot = centre;
  }
}

function keepKnotPlaced(loom: Loom, surface: Surface) {
  if (loom.isKnotStale) {
    placeKnot(loom, surface);
  }
}

function tensionGoalOf(loom: Loom) {
  if (!loom.hasPointer) {
    return 0;
  }
  const offsetX = loom.pointer.x - loom.knot.x;
  const offsetY = loom.pointer.y - loom.knot.y;
  const distance = Math.hypot(offsetX, offsetY);
  return smoothstep(TIGHTEN_FAR_PX, TIGHTEN_NEAR_PX, distance);
}

function easedOf(current: number, goal: number, share: number) {
  const next = towards(current, goal, share);
  const gap = goal - next;
  const isClose = Math.abs(gap) < SETTLED;
  if (isClose) {
    return goal;
  }
  return next;
}

/** The presence of the pointer and the pull it puts on the threads ease after it. It answers whether either still moves. */
function easeHand(loom: Loom, seconds: number) {
  const presenceGoal = Number(loom.hasPointer);
  const tensionGoal = tensionGoalOf(loom);
  const presenceShare = shareOf(seconds, PRESENCE_EASE_S);
  const tensionShare = shareOf(seconds, TENSION_EASE_S);
  loom.presence = easedOf(loom.presence, presenceGoal, presenceShare);
  loom.tension = easedOf(loom.tension, tensionGoal, tensionShare);
  const isPresenceSettled = loom.presence === presenceGoal;
  const isTensionSettled = loom.tension === tensionGoal;
  const hasSettled = isPresenceSettled && isTensionSettled;
  return !hasSettled;
}

function easeOutOf(progress: number) {
  const left = 1 - progress;
  const squared = left * left;
  const cubed = squared * left;
  return 1 - cubed;
}

function poseOf(loom: Loom): Pose {
  const { tension } = loom;
  const restWaist = loom.height * WAIST_SHARE;
  return {
    waist: towards(restWaist, TIGHT_WAIST_PX, tension),
    lead: towards(LEAD, TIGHT_LEAD, tension),
    trail: towards(TRAIL, TIGHT_TRAIL, tension),
    pull: tension * EDGE_PULL,
  };
}

function edgeXOf(loom: Loom, side: number) {
  if (side > 0) {
    return -OVERHANG_PX;
  }
  return loom.width + OVERHANG_PX;
}

/** A point of a cubic curve on one axis, `along` the way from its start to its end. */
function cubicOf(
  start: number,
  first: number,
  second: number,
  end: number,
  along: number
) {
  const back = 1 - along;
  const backSquared = back * back;
  const alongSquared = along * along;
  const startWeight = backSquared * back;
  const firstWeight = 3 * backSquared * along;
  const secondWeight = 3 * back * alongSquared;
  const endWeight = alongSquared * along;
  const fromStart = startWeight * start;
  const fromFirst = firstWeight * first;
  const fromSecond = secondWeight * second;
  const fromEnd = endWeight * end;
  return fromStart + fromFirst + fromSecond + fromEnd;
}

/** One thread as a cubic curve that leaves its edge level and reaches the target level, cut into points. */
function shapeThread(loom: Loom, thread: number, pose: Pose) {
  const { knot } = loom;
  const side = loom.side[thread];
  const startX = edgeXOf(loom, side);
  const restY = loom.edge[thread] * loom.height;
  const startY = towards(restY, knot.y, pose.pull);
  const lift = loom.slot[thread] * pose.waist;
  const endY = knot.y + lift;
  const across = knot.x - startX;
  const span = Math.abs(across);
  const curled = pose.lead * loom.curl[thread];
  const leadLength = span * curled;
  const trailLength = span * pose.trail;
  const leadStep = side * leadLength;
  const trailStep = side * trailLength;
  const firstX = startX + leadStep;
  const secondX = knot.x - trailStep;
  const base = thread * SAMPLES;
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    const along = sample / LAST_SAMPLE;
    const index = base + sample;
    loom.x[index] = cubicOf(startX, firstX, secondX, knot.x, along);
    loom.y[index] = cubicOf(startY, startY, endY, endY, along);
  }
}

function shapeThreads(loom: Loom) {
  const pose = poseOf(loom);
  for (let thread = 0; thread < loom.count; thread += 1) {
    shapeThread(loom, thread, pose);
  }
}

function pushAway(loom: Loom, index: number, strength: number) {
  const offsetX = loom.x[index] - loom.pointer.x;
  const offsetY = loom.y[index] - loom.pointer.y;
  const isFarAcross = Math.abs(offsetX) > PART_RADIUS_PX;
  const isFarDown = Math.abs(offsetY) > PART_RADIUS_PX;
  if (isFarAcross || isFarDown) {
    return;
  }
  const distance = Math.hypot(offsetX, offsetY);
  const isOutside = distance >= PART_RADIUS_PX;
  const isOnIt = distance === 0;
  if (isOutside || isOnIt) {
    return;
  }
  const farness = distance / PART_RADIUS_PX;
  const nearness = 1 - farness;
  const falloff = nearness * nearness;
  const push = falloff * strength;
  const share = push / distance;
  const pushX = offsetX * share;
  const pushY = offsetY * share;
  loom.x[index] += pushX;
  loom.y[index] += pushY;
}

/**
 * The threads part around the pointer, pushed straight away from it. Near the target they are
 * drawn tight instead, so they part less the tighter they are.
 */
function partAround(loom: Loom) {
  const isAway = loom.presence < GONE;
  if (isAway) {
    return;
  }
  const looseness = 1 - loom.tension;
  const reach = PART_PX * loom.presence;
  const strength = reach * looseness;
  for (let index = 0; index < loom.x.length; index += 1) {
    pushAway(loom, index, strength);
  }
}

function pointAt(loom: Loom, base: number, place: number): Point {
  const lower = Math.floor(place);
  const next = lower + 1;
  const upper = Math.min(next, LAST_SAMPLE);
  const share = place - lower;
  const lowerIndex = base + lower;
  const upperIndex = base + upper;
  const x = towards(loom.x[lowerIndex], loom.x[upperIndex], share);
  const y = towards(loom.y[lowerIndex], loom.y[upperIndex], share);
  return { x, y };
}

/** Adds the stretch of a thread between two shares of its length, counted from its edge end, to the path. */
function traceBetween(
  pen: CanvasRenderingContext2D,
  loom: Loom,
  thread: number,
  from: number,
  to: number
) {
  const start = from * LAST_SAMPLE;
  const end = to * LAST_SAMPLE;
  if (end <= start) {
    return;
  }
  const base = thread * SAMPLES;
  const first = pointAt(loom, base, start);
  const last = pointAt(loom, base, end);
  const firstWhole = Math.floor(start);
  const firstInside = firstWhole + 1;
  pen.moveTo(first.x, first.y);
  for (let sample = firstInside; sample < end; sample += 1) {
    const index = base + sample;
    pen.lineTo(loom.x[index], loom.y[index]);
  }
  pen.lineTo(last.x, last.y);
}

/** Every thread in one path, in the neutral of the theme. */
function drawThreads(
  pen: CanvasRenderingContext2D,
  loom: Loom,
  surface: Surface
) {
  const hairline = 1 / surface.pixelRatio;
  pen.globalAlpha = THREAD_ALPHA;
  pen.strokeStyle = loom.inks.line;
  pen.lineWidth = hairline;
  pen.beginPath();
  for (let thread = 0; thread < loom.count; thread += 1) {
    traceBetween(pen, loom, thread, 0, 1);
  }
  pen.stroke();
}

function envelopeOf(progress: number) {
  const rising = smoothstep(0, LIGHT_IN, progress);
  const fading = smoothstep(LIGHT_OUT, 1, progress);
  const remaining = 1 - fading;
  return rising * remaining;
}

/** One step of the tail of a light: the same stretch of every thread, at one strength, in one path. */
function drawTailStep(
  pen: CanvasRenderingContext2D,
  loom: Loom,
  head: number,
  step: number,
  strength: number
) {
  const offset = step * TAIL_STEP;
  const from = head + offset;
  const to = from + TAIL_STEP;
  const end = Math.min(to, 1);
  const fading = step / TAIL_STEPS;
  const remaining = 1 - fading;
  pen.globalAlpha = strength * remaining;
  pen.beginPath();
  for (let thread = 0; thread < loom.count; thread += 1) {
    traceBetween(pen, loom, thread, from, end);
  }
  pen.stroke();
}

/** A light runs from the target out to the edges, quick at first, and fades as it arrives. */
function drawTravellingLight(
  pen: CanvasRenderingContext2D,
  loom: Loom,
  sentAt: number,
  now: number
) {
  const age = now - sentAt;
  const raw = age / PULSE_MS;
  const progress = clamp(raw, 0, 1);
  const travelled = easeOutOf(progress);
  const head = 1 - travelled;
  const envelope = envelopeOf(progress);
  const strength = envelope * LIGHT_ALPHA;
  for (let step = 0; step < TAIL_STEPS; step += 1) {
    drawTailStep(pen, loom, head, step, strength);
  }
}

function drawStillLight(
  pen: CanvasRenderingContext2D,
  loom: Loom,
  sentAt: number,
  now: number
) {
  const age = now - sentAt;
  const raw = age / STILL_PULSE_MS;
  const progress = clamp(raw, 0, 1);
  const turn = progress * Math.PI;
  const swell = Math.sin(turn);
  pen.globalAlpha = swell * STILL_LIGHT_ALPHA;
  pen.beginPath();
  for (let thread = 0; thread < loom.count; thread += 1) {
    traceBetween(pen, loom, thread, 0, 1);
  }
  pen.stroke();
}

function drawLightOf(isStill: boolean) {
  if (isStill) {
    return drawStillLight;
  }
  return drawTravellingLight;
}

function drawLights(pen: CanvasRenderingContext2D, loom: Loom, now: number) {
  const drawLight = drawLightOf(loom.isStill);
  pen.strokeStyle = loom.inks.hue;
  pen.lineWidth = LIGHT_WIDTH_PX;
  for (const sentAt of loom.pulses) {
    drawLight(pen, loom, sentAt, now);
  }
}

/** The whole picture as it stands: every thread, and every light on its way. */
function drawLoom(loom: Loom, surface: Surface, now: number) {
  const { pen } = surface;
  keepKnotPlaced(loom, surface);
  shapeThreads(loom);
  partAround(loom);
  wipeSurface(surface);
  pen.lineCap = 'butt';
  pen.lineJoin = 'round';
  drawThreads(pen, loom, surface);
  drawLights(pen, loom, now);
}

function pulseMsOf(isStill: boolean) {
  if (isStill) {
    return STILL_PULSE_MS;
  }
  return PULSE_MS;
}

function liveOf(pulses: number[], now: number, lasts: number) {
  const live: number[] = [];
  for (const sentAt of pulses) {
    const age = now - sentAt;
    const isLive = age < lasts;
    if (isLive) {
      live.push(sentAt);
    }
  }
  return live;
}

function sendLight(loom: Loom, now: number) {
  const isFull = loom.pulses.length >= MAX_PULSES;
  if (isFull) {
    loom.pulses.shift();
  }
  loom.pulses.push(now);
}

/** Every step draws the picture again. Once the pointer has settled and the lights are gone, the loop sleeps. */
function stepLoom(loom: Loom, surface: Surface, seconds: number, now: number) {
  keepKnotPlaced(loom, surface);
  const isHandMoving = easeHand(loom, seconds);
  const lasts = pulseMsOf(loom.isStill);
  loom.pulses = liveOf(loom.pulses, now, lasts);
  drawLoom(loom, surface, now);
  const hasLight = loom.pulses.length > 0;
  const isMoving = isHandMoving || hasLight;
  if (isMoving) {
    return NEXT_FRAME;
  }
  return AT_REST;
}

type ThreadScene = Scene & {
  /** The element the threads gather through. It is measured again before the next picture. */
  aimAt: (target: HTMLElement | null) => void;
  pulse: () => void;
};

function createThreadScene(count: number): ThreadScene {
  const loom = loomOf(count);
  return {
    ink(inks) {
      loom.inks = inks;
    },
    fit(surface, isStill) {
      fitLoom(loom, surface, isStill);
    },
    draw(surface) {
      const now = performance.now();
      drawLoom(loom, surface, now);
    },
    step(surface, seconds, now) {
      return stepLoom(loom, surface, seconds, now);
    },
    pointerMoved(x, y) {
      loom.pointer.x = x;
      loom.pointer.y = y;
      loom.hasPointer = true;
    },
    pointerLeft() {
      loom.hasPointer = false;
    },
    aimAt(target) {
      loom.target = target;
      loom.isKnotStale = true;
    },
    pulse() {
      const now = performance.now();
      sendLight(loom, now);
    },
  };
}

export type ThreadsHandle = {
  /** Sends a light out along every thread, from the target to the edges. */
  pulse: () => void;
};

export type ThreadsProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The light of a pulse wears it. */
  hue?: string;
  /** How many threads come in from each edge, from 3 to 16. */
  count?: number;
  /** The element the threads gather through, such as a call to action. Without it they gather in the middle of the box. */
  target?: RefObject<HTMLElement | null>;
  /** The threads tighten as the pointer nears the target, and part around the pointer. */
  interactive?: boolean;
  handleRef?: Ref<ThreadsHandle>;
};

/**
 * Hairline threads that come in from the left and right edges and gather through one element.
 * They are in place from the start, tighten as the pointer nears the target and part around the
 * pointer, and `pulse()`, through `handleRef`, sends a light out along every one. One canvas,
 * drawn only while something moves. It fills its parent, which must be positioned. Under reduced
 * motion the threads stand still, and a pulse lights them all at once and fades.
 */
export function Threads({
  className,
  hue = DEFAULT_HUE,
  count = DEFAULT_COUNT,
  target,
  interactive = true,
  handleRef,
}: ThreadsProps) {
  const stage = useRef<StageHandle>(null);
  const scene = useMemo(() => createThreadScene(count), [count]);

  useEffect(() => {
    const element = target?.current ?? null;

    function aim() {
      scene.aimAt(element);
      stage.current?.refresh();
    }

    aim();
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(aim);
    observer.observe(element);
    return () => observer.disconnect();
  }, [scene, target]);

  useImperativeHandle(
    handleRef,
    () => ({
      pulse() {
        scene.pulse();
        stage.current?.refresh();
      },
    }),
    [scene]
  );

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

/** Long enough for a light to reach the edges and fade before the demonstration presses again. */
const BETWEEN_PULSES_MS = 2600;

export default function Background12() {
  const threads = useRef<ThreadsHandle>(null);
  const button = useRef<HTMLButtonElement>(null);
  const { pressed, press } = usePress<'light'>();

  function lightThreads() {
    threads.current?.pulse();
  }

  const steps: AutoplayStep[] = [
    { after: BETWEEN_PULSES_MS, run: () => press('light') },
    { after: PRESS_LEAD_MS, run: lightThreads },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, { loopAfter: 0 });

  return (
    <DemoBand
      ref={ref}
      title='Threads that gather through one button'
      background={<Threads target={button} handleRef={threads} />}
    >
      <Button
        ref={button}
        onClick={lightThreads}
        className={pressedSolidOf(pressed === 'light')}
      >
        Light the threads
      </Button>
    </DemoBand>
  );
}
