import { noiseAt, speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';

import {
  blendOf,
  oneHotOf,
  type StateTable,
  type VoiceState,
} from './voice-state';

const TAU = Math.PI * 2;

export const PARTICLE_COUNT = 340;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Radius of the sphere, as a share of the canvas: the voice pushes particles out to 1.6 times that, and the pulse of speech adds 7% more, so the edge of the canvas is never reached. */
const RADIUS_SHARE = 0.26;

const MIN_DOT = 0.0036;

const DOT_RANGE = 0.0062;

const MIN_SPIN = 0.6;

const SPIN_RANGE = 0.8;

/** Each particle falls back on its own spring, so a surge does not return as one block. */
const MIN_STIFFNESS = 260;

const STIFFNESS_RANGE = 440;

const DAMPING = 17;

const MIN_REACH = 0.3;

const REACH_RANGE = 0.7;

const MIN_PUSH = -0.2;

const MAX_PUSH = 0.6;

const DEPTH = 0.3;

const TILT = 0.42;

const ALPHA_BUCKETS = 6;

const MIN_ALPHA = 0.16;

const MAX_ALPHA = 0.8;

const SPIN_SPEED: StateTable = {
  idle: 0.14,
  listening: 0.24,
  thinking: 1.3,
  speaking: 0.32,
};

const REACH: StateTable = {
  idle: 0,
  listening: 0.8,
  thinking: 0,
  speaking: 0.5,
};

const BRIGHTNESS: StateTable = {
  idle: 0.55,
  listening: 0.8,
  thinking: 0.9,
  speaking: 1,
};

const TIGHTEN = 0.18;

const PULSE = 0.07;

const BREATH_HERTZ = 0.2;

const BREATH_DEPTH = 0.035;

const THINKING_INK = 0.35;

const LISTEN_SEED = 0.4;

const SPEAK_SEED = 2.2;

const STILL_LEVEL = 0.6;

const STILL_SECONDS = 0.4;

const STILL_TURN = 0.5;

type Particle = {
  x: number;
  y: number;
  z: number;
  dot: number;
  spin: number;
  reach: number;
  stiffness: number;
};

function particleAt(index: number): Particle {
  const share = (index + 0.5) / PARTICLE_COUNT;
  const y = 1 - 2 * share;
  const ring = Math.sqrt(1 - y * y);
  const angle = index * GOLDEN_ANGLE;
  return {
    x: Math.cos(angle) * ring,
    y,
    z: Math.sin(angle) * ring,
    dot: MIN_DOT + noiseAt(index, 1.7) * DOT_RANGE,
    spin: MIN_SPIN + noiseAt(index, 5.1) * SPIN_RANGE,
    reach: MIN_REACH + noiseAt(index, 9.3) * REACH_RANGE,
    stiffness: MIN_STIFFNESS + noiseAt(index, 2.9) * STIFFNESS_RANGE,
  };
}

const PARTICLES: readonly Particle[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, index) => particleAt(index)
);

export type ParticleField = {
  turns: Float32Array;
  pushes: Float32Array;
  speeds: Float32Array;
  xs: Float32Array;
  ys: Float32Array;
  radii: Float32Array;
  buckets: Uint8Array;
};

export function createField(): ParticleField {
  return {
    turns: new Float32Array(PARTICLE_COUNT),
    pushes: new Float32Array(PARTICLE_COUNT),
    speeds: new Float32Array(PARTICLE_COUNT),
    xs: new Float32Array(PARTICLE_COUNT),
    ys: new Float32Array(PARTICLE_COUNT),
    radii: new Float32Array(PARTICLE_COUNT),
    buckets: new Uint8Array(PARTICLE_COUNT),
  };
}

export type FieldFrame = {
  weights: StateTable;
  level: number;
  seconds: number;
};

export type FieldGeometry = {
  size: number;
  centre: number;
  radius: number;
};

export type FieldPalette = {
  primary: string;
  foreground: string;
};

export function geometryOf(size: number): FieldGeometry {
  return { size, centre: size / 2, radius: size * RADIUS_SHARE };
}

export function stillFrameOf(state: VoiceState): FieldFrame {
  return {
    weights: oneHotOf(state),
    level: STILL_LEVEL,
    seconds: STILL_SECONDS,
  };
}

export function levelOf(
  provider: (() => number) | undefined,
  weights: StateTable,
  elapsed: number
) {
  if (provider) {
    return provider();
  }
  const heard = speechLevelAt(elapsed, LISTEN_SEED);
  const spoken = speechLevelAt(elapsed, SPEAK_SEED);
  return weights.listening * heard + weights.speaking * spoken;
}

function reachOf(frame: FieldFrame) {
  const share = blendOf(REACH, frame.weights);
  return share * frame.level;
}

function scaleOf(frame: FieldFrame) {
  const breathAngle = frame.seconds * TAU * BREATH_HERTZ;
  const breath = Math.sin(breathAngle) * BREATH_DEPTH;
  const tightened = frame.weights.thinking * TIGHTEN;
  const calmBreath = frame.weights.idle * breath;
  const pulse = frame.weights.speaking * frame.level * PULSE;
  return 1 - tightened + calmBreath + pulse;
}

function inkOf(weights: StateTable) {
  const thinking = weights.thinking * THINKING_INK;
  return Math.min(1, weights.speaking + thinking);
}

export function stepField(
  field: ParticleField,
  frame: FieldFrame,
  step: number
) {
  const spin = blendOf(SPIN_SPEED, frame.weights);
  const reach = reachOf(frame);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const particle = PARTICLES[index];
    field.turns[index] += spin * particle.spin * step;
    const target = reach * particle.reach;
    const pull = particle.stiffness * (target - field.pushes[index]);
    const drag = DAMPING * field.speeds[index];
    field.speeds[index] += (pull - drag) * step;
    field.pushes[index] += field.speeds[index] * step;
  }
}

export function settleField(field: ParticleField, frame: FieldFrame) {
  const reach = reachOf(frame);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const particle = PARTICLES[index];
    field.turns[index] = STILL_TURN * particle.spin;
    field.pushes[index] = reach * particle.reach;
    field.speeds[index] = 0;
  }
}

function boundedPush(push: number) {
  return Math.min(MAX_PUSH, Math.max(MIN_PUSH, push));
}

function bucketOf(depth: number) {
  const share = (depth + 1) / 2;
  const bucket = Math.floor(share * ALPHA_BUCKETS);
  return Math.min(ALPHA_BUCKETS - 1, bucket);
}

const COS_TILT = Math.cos(TILT);

const SIN_TILT = Math.sin(TILT);

function projectField(
  field: ParticleField,
  geometry: FieldGeometry,
  frame: FieldFrame
) {
  const base = geometry.radius * scaleOf(frame);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const particle = PARTICLES[index];
    const cos = Math.cos(field.turns[index]);
    const sin = Math.sin(field.turns[index]);
    const turnedX = particle.x * cos + particle.z * sin;
    const turnedZ = particle.z * cos - particle.x * sin;
    const tiltedY = particle.y * COS_TILT - turnedZ * SIN_TILT;
    const tiltedZ = particle.y * SIN_TILT + turnedZ * COS_TILT;
    const push = boundedPush(field.pushes[index]);
    const reach = base * (1 + push);
    const lens = 1 / (1 - tiltedZ * DEPTH);
    field.xs[index] = geometry.centre + turnedX * reach * lens;
    field.ys[index] = geometry.centre + tiltedY * reach * lens;
    field.radii[index] = particle.dot * geometry.size * lens;
    field.buckets[index] = bucketOf(tiltedZ);
  }
}

function alphaOfBucket(bucket: number) {
  const share = (bucket + 0.5) / ALPHA_BUCKETS;
  return MIN_ALPHA + share * (MAX_ALPHA - MIN_ALPHA);
}

/** Every dot of one depth in one path, so a few hundred dots cost a few fills. */
function fillBucket(
  context: CanvasRenderingContext2D,
  field: ParticleField,
  bucket: number,
  alpha: number,
  color: string
) {
  if (alpha < 0.01) {
    return;
  }
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.beginPath();
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    if (field.buckets[index] !== bucket) {
      continue;
    }
    const radius = field.radii[index];
    context.moveTo(field.xs[index] + radius, field.ys[index]);
    context.arc(field.xs[index], field.ys[index], radius, 0, TAU);
  }
  context.fill();
}

/** Neutral while the sphere listens, in the brand colour while the agent speaks; nearer dots are stronger. */
export function drawField(
  context: CanvasRenderingContext2D,
  geometry: FieldGeometry,
  field: ParticleField,
  frame: FieldFrame,
  palette: FieldPalette
) {
  context.clearRect(0, 0, geometry.size, geometry.size);
  projectField(field, geometry, frame);
  const brightness = blendOf(BRIGHTNESS, frame.weights);
  const ink = inkOf(frame.weights);
  for (let bucket = 0; bucket < ALPHA_BUCKETS; bucket += 1) {
    const alpha = alphaOfBucket(bucket) * brightness;
    fillBucket(context, field, bucket, alpha * (1 - ink), palette.foreground);
    fillBucket(context, field, bucket, alpha * ink, palette.primary);
  }
}
