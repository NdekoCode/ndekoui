import {
  AT_REST,
  NEXT_FRAME,
  wipeSurface,
  type Inks,
  type Scene,
  type Surface,
} from './canvas-stage';
import { outlineOf, type ObjectId } from './outline-shapes';

export type Placement = {
  centreX: number;
  centreY: number;
  size: number;
};

export type StopSpec = Placement & {
  anchorId: string;
  at: number;
  until?: number;
  object: ObjectId;
  narrow?: Placement;
};

export type PointScene = Scene & {
  pulse: () => void;
};

type Cloud = {
  x: Float32Array;
  y: Float32Array;
  light: Float32Array;
};

type Stop = {
  element: HTMLElement | null;
  at: number;
  until: number;
  baseX: number;
  baseY: number;
  anchorY: number;
  holdY: number;
  cloud: Cloud;
  slots: Uint16Array;
};

type Field = {
  inks: Inks;
  isStill: boolean;
  specs: readonly StopSpec[];
  width: number;
  height: number;
  count: number;
  stops: Stop[];
  smoothMid: number;
  intro: number;
  pulse: number;
  isPulsing: boolean;
  delay: Float32Array;
  burstX: Float32Array;
  burstY: Float32Array;
  size: Float32Array;
  hue: Uint8Array;
  x: Float32Array;
  y: Float32Array;
  light: Float32Array;
  buckets: Uint16Array[];
  fills: Uint16Array;
};

const SEED = 11;

const AREA_PER_POINT = 520;

const MIN_POINTS = 600;

const MAX_POINTS = 1700;

/** The width where the page stacks its text under the object, the same one the layout folds at. */
const NARROW_PX = 1024;

const LIGHT_LEVELS = 4;

const LEVEL_ALPHA = [0.2, 0.36, 0.58, 0.82];

const BUCKET_COUNT = LIGHT_LEVELS * 2;

const HUE_SHARE = 0.12;

const STAGGER_SPAN = 0.5;

const HOLD_SHARE = 0.18;

const MID_EASE_S = 0.14;

const BURST_SHARE = 0.3;

const INTRO_S = 2;

const PULSE_S = 1.8;

const REST_PX = 0.4;

const EDGE_PX = 6;

const NO_INKS: Inks = { hue: 'transparent', neutral: 'transparent' };

function clamp(value: number, low: number, high: number) {
  const raised = Math.max(low, value);
  return Math.min(high, raised);
}

function smoothstep(low: number, high: number, value: number) {
  const span = high - low;
  const raw = (value - low) / span;
  const share = clamp(raw, 0, 1);
  return share * share * (3 - 2 * share);
}

function shareOf(seconds: number, easeSeconds: number) {
  const ratio = seconds / easeSeconds;
  return 1 - Math.exp(-ratio);
}

function bumpOf(progress: number, delay: number) {
  const local = smoothstep(delay, delay + STAGGER_SPAN, progress);
  const arc = Math.sin(local * Math.PI);
  return arc * arc;
}

function countOf(width: number, height: number) {
  const area = width * height;
  const roomy = Math.round(area / AREA_PER_POINT);
  return clamp(roomy, MIN_POINTS, MAX_POINTS);
}

function fieldOf(specs: readonly StopSpec[]): Field {
  return {
    inks: NO_INKS,
    isStill: false,
    specs,
    width: 0,
    height: 0,
    count: 0,
    stops: [],
    smoothMid: 0,
    intro: 0,
    pulse: 0,
    isPulsing: false,
    delay: new Float32Array(0),
    burstX: new Float32Array(0),
    burstY: new Float32Array(0),
    size: new Float32Array(0),
    hue: new Uint8Array(0),
    x: new Float32Array(0),
    y: new Float32Array(0),
    light: new Float32Array(0),
    buckets: [],
    fills: new Uint16Array(BUCKET_COUNT),
  };
}

function randomOf(seed: number) {
  let state = seed >>> 0;

  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    const shifted = state >>> 15;
    const folded = state ^ shifted;
    const odd = state | 1;
    const first = Math.imul(folded, odd);
    const reshifted = first >>> 7;
    const refolded = first ^ reshifted;
    const salted = first | 61;
    const second = Math.imul(refolded, salted);
    const summed = first + second;
    const mixed = first ^ summed;
    const lastShift = mixed >>> 14;
    const settled = mixed ^ lastShift;
    return (settled >>> 0) / 4294967296;
  };
}

function seedParticles(field: Field, count: number) {
  const random = randomOf(SEED);
  field.count = count;
  field.delay = new Float32Array(count);
  field.burstX = new Float32Array(count);
  field.burstY = new Float32Array(count);
  field.size = new Float32Array(count);
  field.hue = new Uint8Array(count);
  field.x = new Float32Array(count);
  field.y = new Float32Array(count);
  field.light = new Float32Array(count);
  field.buckets = Array.from(
    { length: BUCKET_COUNT },
    () => new Uint16Array(count)
  );
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const reach = Math.sqrt(random());
    const sizeStep = Math.floor(random() * 3);
    field.delay[index] = random() * (1 - STAGGER_SPAN);
    field.burstX[index] = Math.cos(angle) * reach;
    field.burstY[index] = Math.sin(angle) * reach;
    field.size[index] = 1.3 + sizeStep * 0.5;
    field.hue[index] = Number(random() < HUE_SHARE);
  }
}

function placementOf(spec: StopSpec, width: number): Placement {
  const isNarrow = width < NARROW_PX;
  if (isNarrow && spec.narrow) {
    return spec.narrow;
  }
  return spec;
}

function cloudOf(
  spec: StopSpec,
  field: Field,
  placement: Placement,
  random: () => number
): Cloud {
  const outline = outlineOf(spec.object, field.count, random);
  const unit = placement.size * Math.min(field.width, field.height);
  const x = new Float32Array(field.count);
  const y = new Float32Array(field.count);
  for (let index = 0; index < field.count; index += 1) {
    x[index] = outline.x[index] * unit;
    y[index] = outline.y[index] * unit;
  }
  return { x, y, light: outline.light };
}

function rankKeysOf(stop: Stop, count: number) {
  const keys = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const across = stop.baseX + stop.cloud.x[index];
    const down = stop.baseY + stop.cloud.y[index];
    keys[index] = across + down * 0.35;
  }
  return keys;
}

function orderOf(keys: Float32Array) {
  const order = Array.from(keys.keys());
  order.sort((first, second) => keys[first] - keys[second]);
  return Uint16Array.from(order);
}

/** Pairs the points of two objects from left to right, so one flows into the next without crossing itself. */
function slotsAfter(previous: Stop, next: Stop, count: number) {
  const fromOrder = orderOf(rankKeysOf(previous, count));
  const toOrder = orderOf(rankKeysOf(next, count));
  const pairing = new Uint16Array(count);
  for (let rank = 0; rank < count; rank += 1) {
    pairing[fromOrder[rank]] = toOrder[rank];
  }
  const slots = new Uint16Array(count);
  for (let index = 0; index < count; index += 1) {
    slots[index] = pairing[previous.slots[index]];
  }
  return slots;
}

function identitySlots(count: number) {
  const slots = new Uint16Array(count);
  for (let index = 0; index < count; index += 1) {
    slots[index] = index;
  }
  return slots;
}

function stopOf(spec: StopSpec, field: Field, random: () => number): Stop {
  const placement = placementOf(spec, field.width);
  return {
    element: document.getElementById(spec.anchorId),
    at: spec.at,
    until: spec.until ?? spec.at,
    baseX: placement.centreX * field.width,
    baseY: placement.centreY * field.height,
    anchorY: 0,
    holdY: 0,
    cloud: cloudOf(spec, field, placement, random),
    slots: identitySlots(field.count),
  };
}

function hasElement(stop: Stop) {
  return stop.element !== null;
}

function layField(field: Field, surface: Surface, isStill: boolean) {
  field.width = surface.width;
  field.height = surface.height;
  field.isStill = isStill;
  const count = countOf(surface.width, surface.height);
  seedParticles(field, count);
  const random = randomOf(SEED + 1);
  const built = field.specs.map((spec) => stopOf(spec, field, random));
  const placed = built.filter(hasElement);
  for (let index = 1; index < placed.length; index += 1) {
    placed[index].slots = slotsAfter(placed[index - 1], placed[index], count);
  }
  field.stops = placed;
  field.smoothMid = window.scrollY + surface.height / 2;
  if (isStill) {
    field.intro = 1;
  }
}

function measureAnchors(field: Field, scrollY: number) {
  for (const stop of field.stops) {
    const box = stop.element?.getBoundingClientRect();
    if (box) {
      const top = box.top + scrollY;
      stop.anchorY = top + box.height * stop.at;
      stop.holdY = top + box.height * stop.until;
    }
  }
}

type Segment = {
  index: number;
  mix: number;
};

function segmentOf(field: Field, mid: number): Segment {
  const { stops } = field;
  const last = stops.length - 1;
  if (last < 1) {
    return { index: 0, mix: 0 };
  }
  for (let index = 0; index < last; index += 1) {
    const start = stops[index].holdY;
    const end = stops[index + 1].anchorY;
    if (mid < end) {
      const span = Math.max(1, end - start);
      const share = clamp((mid - start) / span, 0, 1);
      const mix = smoothstep(HOLD_SHARE, 1 - HOLD_SHARE, share);
      return { index, mix };
    }
  }
  return { index: last, mix: 0 };
}

function levelOf(light: number) {
  if (!Number.isFinite(light)) {
    return 0;
  }
  const scaled = Math.floor(light * LIGHT_LEVELS);
  return clamp(scaled, 0, LIGHT_LEVELS - 1);
}

function apartnessOf(field: Field, delay: number, mix: number) {
  let apart = bumpOf(mix, delay);
  if (field.isPulsing) {
    const pulsed = bumpOf(field.pulse, delay);
    apart = Math.max(apart, pulsed);
  }
  return apart;
}

function placeParticles(field: Field, segment: Segment) {
  const { stops, count, height, width } = field;
  const from = stops[segment.index];
  const to = stops[segment.index + 1] ?? from;
  const { mix } = segment;
  const burst = Math.min(width, height) * BURST_SHARE;
  const isBlending = mix > 0 && to !== from;
  const isIntro = field.intro < 1;
  field.fills.fill(0);
  for (let index = 0; index < count; index += 1) {
    const slotA = from.slots[index];
    const delay = field.delay[index];
    let x = from.baseX + from.cloud.x[slotA];
    let y = from.baseY + from.cloud.y[slotA];
    let light = from.cloud.light[slotA];
    if (isBlending) {
      const slotB = to.slots[index];
      const local = smoothstep(delay, delay + STAGGER_SPAN, mix);
      const targetX = to.baseX + to.cloud.x[slotB];
      const targetY = to.baseY + to.cloud.y[slotB];
      x += (targetX - x) * local;
      y += (targetY - y) * local;
      light += (to.cloud.light[slotB] - light) * local;
    }
    let apart = apartnessOf(field, delay, mix);
    if (isIntro) {
      const arrived = smoothstep(delay, delay + STAGGER_SPAN, field.intro);
      const left = 1 - arrived;
      apart = Math.max(apart, left * left);
      light *= 0.3 + 0.7 * arrived;
    }
    x += field.burstX[index] * burst * apart;
    y += field.burstY[index] * burst * apart;
    field.x[index] = x;
    field.y[index] = y;
    field.light[index] = light;
    const isOutside =
      x < -EDGE_PX ||
      x > width + EDGE_PX ||
      y < -EDGE_PX ||
      y > height + EDGE_PX;
    if (!isOutside) {
      const bucket = field.hue[index] * LIGHT_LEVELS + levelOf(light);
      const filled = field.fills[bucket];
      field.buckets[bucket][filled] = index;
      field.fills[bucket] = filled + 1;
    }
  }
}

function paintBucket(
  field: Field,
  surface: Surface,
  bucket: number,
  ink: string
) {
  const { pen } = surface;
  const filled = field.fills[bucket];
  if (filled === 0) {
    return;
  }
  const level = bucket % LIGHT_LEVELS;
  const members = field.buckets[bucket];
  pen.globalAlpha = LEVEL_ALPHA[level];
  pen.fillStyle = ink;
  pen.beginPath();
  for (let slot = 0; slot < filled; slot += 1) {
    const index = members[slot];
    const side = field.size[index];
    pen.rect(field.x[index] - side / 2, field.y[index] - side / 2, side, side);
  }
  pen.fill();
}

function paintField(field: Field, surface: Surface) {
  wipeSurface(surface);
  for (let bucket = 0; bucket < BUCKET_COUNT; bucket += 1) {
    const isHue = bucket >= LIGHT_LEVELS;
    let ink = field.inks.neutral;
    if (isHue) {
      ink = field.inks.hue;
    }
    paintBucket(field, surface, bucket, ink);
  }
}

function drawField(field: Field, surface: Surface) {
  if (field.stops.length === 0) {
    wipeSurface(surface);
    return;
  }
  measureAnchors(field, window.scrollY);
  let segment: Segment = { index: 0, mix: 0 };
  if (!field.isStill) {
    segment = segmentOf(field, field.smoothMid);
  }
  placeParticles(field, segment);
  paintField(field, surface);
}

function advanceClocks(field: Field, seconds: number) {
  if (field.intro < 1) {
    field.intro = Math.min(1, field.intro + seconds / INTRO_S);
  }
  if (field.isPulsing) {
    field.pulse += seconds / PULSE_S;
    if (field.pulse >= 1) {
      field.pulse = 0;
      field.isPulsing = false;
    }
  }
}

function stepField(field: Field, surface: Surface, seconds: number) {
  if (field.isStill || field.stops.length === 0) {
    return AT_REST;
  }
  advanceClocks(field, seconds);
  const mid = window.scrollY + field.height / 2;
  const share = shareOf(seconds, MID_EASE_S);
  const gap = mid - field.smoothMid;
  field.smoothMid += gap * share;
  drawField(field, surface);
  const isCentred = Math.abs(gap) < REST_PX;
  const isStillPlaying = field.isPulsing || field.intro < 1;
  if (isCentred && !isStillPlaying) {
    field.smoothMid = mid;
    return AT_REST;
  }
  return NEXT_FRAME;
}

export function createPointScene(specs: readonly StopSpec[]): PointScene {
  const field = fieldOf(specs);
  return {
    ink(inks) {
      field.inks = inks;
    },
    fit(surface, isStill) {
      layField(field, surface, isStill);
    },
    draw(surface) {
      drawField(field, surface);
    },
    step(surface, seconds) {
      return stepField(field, surface, seconds);
    },
    pulse() {
      if (field.isStill) {
        return;
      }
      field.pulse = 0;
      field.isPulsing = true;
    },
  };
}
