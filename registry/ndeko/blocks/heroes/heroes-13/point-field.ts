import {
  AT_REST,
  NEXT_FRAME,
  wipeSurface,
  type Inks,
  type Scene,
  type Surface,
} from './canvas-stage';
import {
  randomOf,
  ringCloud,
  scatterCloud,
  sphereCloud,
  waveCloud,
  type Cloud,
  type ShapeId,
} from './point-shapes';

export type StopSpec = {
  anchorId: string;
  at: number;
  until?: number;
  shape: ShapeId;
  centreX: number;
  centreY: number;
  follow: number;
  size: number;
  wrapsId?: string;
};

type Stop = {
  element: HTMLElement | null;
  at: number;
  until: number;
  follow: number;
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
  time: number;
  smoothMid: number;
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

const SEED = 8;

const AREA_PER_POINT = 300;

const MIN_POINTS = 700;

const MAX_POINTS = 2600;

const LIGHT_LEVELS = 4;

const LEVEL_ALPHA = [0.1, 0.2, 0.34, 0.55];

const BUCKET_COUNT = LIGHT_LEVELS * 2;

const HUE_SHARE = 0.1;

const STAGGER_SPAN = 0.55;

const HOLD_SHARE = 0.12;

const MID_EASE_S = 0.16;

const BURST_SHARE = 0.14;

const EDGE_PX = 6;

const RING_GAP_SHARE = 0.04;

/** The ring passes behind the corners of the card it goes round, so it hugs the sides instead of clearing the corners. */
const RING_REACH_X = 1.22;

const RING_REACH_Y = 1.2;

const RING_MAX_SHARE_X = 0.58;

const RING_MAX_SHARE_Y = 0.46;

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
    time: 0,
    smoothMid: 0,
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
    field.size[index] = 1.2 + sizeStep * 0.5;
    field.hue[index] = Number(random() < HUE_SHARE);
  }
}

function cloudOf(
  spec: StopSpec,
  field: Field,
  element: HTMLElement | null,
  random: () => number
) {
  const { width, height, count } = field;
  const side = Math.min(width, height);
  if (spec.shape === 'sphere') {
    return sphereCloud(count, spec.size * side);
  }
  if (spec.shape === 'wave') {
    return waveCloud(count, width, height);
  }
  if (spec.shape === 'scatter') {
    return scatterCloud(count, width, height, random);
  }
  const box = element?.getBoundingClientRect();
  const boxWidth = box?.width ?? side;
  const boxHeight = box?.height ?? side;
  const gap = side * RING_GAP_SHARE;
  const reachX = (boxWidth / 2) * RING_REACH_X + gap;
  const reachY = (boxHeight / 2) * RING_REACH_Y + gap;
  const radiusX = Math.min(reachX, width * RING_MAX_SHARE_X);
  const radiusY = Math.min(reachY, height * RING_MAX_SHARE_Y);
  return ringCloud(count, radiusX, radiusY, random);
}

function centreXOf(spec: StopSpec, field: Field, element: HTMLElement | null) {
  const windowX = spec.centreX * field.width;
  if (spec.wrapsId === undefined) {
    return windowX;
  }
  if (!element) {
    return windowX;
  }
  const box = element.getBoundingClientRect();
  return box.left + box.width / 2;
}

function wrappedElementOf(spec: StopSpec, anchor: HTMLElement | null) {
  if (spec.wrapsId === undefined) {
    return anchor;
  }
  return document.getElementById(spec.wrapsId);
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

/** Pairs the points of two shapes from left to right, so a shape flows into the next one without crossing itself. */
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
  const anchor = document.getElementById(spec.anchorId);
  const wrapped = wrappedElementOf(spec, anchor);
  return {
    element: anchor,
    at: spec.at,
    until: spec.until ?? spec.at,
    follow: spec.follow,
    baseX: centreXOf(spec, field, wrapped),
    baseY: spec.centreY * field.height,
    anchorY: 0,
    holdY: 0,
    cloud: cloudOf(spec, field, wrapped, random),
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
  field.time = 0;
  field.smoothMid = window.scrollY + surface.height / 2;
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

function centreYOf(stop: Stop, scrollY: number, height: number) {
  const mid = scrollY + height / 2;
  return stop.baseY + stop.follow * (stop.anchorY - mid);
}

function levelOf(light: number) {
  if (!Number.isFinite(light)) {
    return 0;
  }
  const scaled = Math.floor(light * LIGHT_LEVELS);
  return clamp(scaled, 0, LIGHT_LEVELS - 1);
}

function placeParticles(field: Field, scrollY: number, segment: Segment) {
  const { stops, count, height, width } = field;
  const from = stops[segment.index];
  const to = stops[segment.index + 1] ?? from;
  const { mix } = segment;
  const fromX = from.baseX;
  const fromY = centreYOf(from, scrollY, height);
  const toX = to.baseX;
  const toY = centreYOf(to, scrollY, height);
  const burst = Math.min(width, height) * BURST_SHARE;
  const isBlending = mix > 0 && to !== from;
  if (from.cloud.isMoving) {
    from.cloud.advance(field.time);
  }
  if (isBlending && to.cloud.isMoving) {
    to.cloud.advance(field.time);
  }
  field.fills.fill(0);
  for (let index = 0; index < count; index += 1) {
    const slotA = from.slots[index];
    let x = fromX + from.cloud.x[slotA];
    let y = fromY + from.cloud.y[slotA];
    let light = from.cloud.light[slotA];
    if (isBlending) {
      const slotB = to.slots[index];
      const delay = field.delay[index];
      const local = smoothstep(delay, delay + STAGGER_SPAN, mix);
      const arc = Math.sin(local * Math.PI);
      const bump = arc * arc * burst;
      const targetX = toX + to.cloud.x[slotB];
      const targetY = toY + to.cloud.y[slotB];
      x += (targetX - x) * local + field.burstX[index] * bump;
      y += (targetY - y) * local + field.burstY[index] * bump;
      light += (to.cloud.light[slotB] - light) * local;
    }
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
  const scrollY = window.scrollY;
  measureAnchors(field, scrollY);
  let segment: Segment = { index: 0, mix: 0 };
  if (!field.isStill) {
    segment = segmentOf(field, field.smoothMid);
  }
  placeParticles(field, scrollY, segment);
  paintField(field, surface);
}

function stepField(field: Field, surface: Surface, seconds: number) {
  if (field.isStill || field.stops.length === 0) {
    return AT_REST;
  }
  field.time += seconds;
  const mid = window.scrollY + field.height / 2;
  const share = shareOf(seconds, MID_EASE_S);
  field.smoothMid += (mid - field.smoothMid) * share;
  drawField(field, surface);
  return NEXT_FRAME;
}

export function createPointScene(specs: readonly StopSpec[]): Scene {
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
  };
}
