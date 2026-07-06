export type ShapeId = 'sphere' | 'ring' | 'wave' | 'scatter';

export type Cloud = {
  x: Float32Array;
  y: Float32Array;
  light: Float32Array;
  isMoving: boolean;
  advance: (time: number) => void;
};

const FULL_TURN = Math.PI * 2;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const GOLDEN_SHARE = 0.6180339887;

const SPHERE_SPIN = 0.1;

const SPHERE_TILT = 0.38;

const RING_SPIN = 0.16;

const RING_TILT = -0.2;

const RING_BANDS = 3;

const WAVE_ROWS = 18;

const WAVE_SPEED = 0.55;

const STILL = () => {};

/** The same stream of numbers from 0 to 1 for the same seed, so a shape never changes between two renders. */
export function randomOf(seed: number) {
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

function lightOfDepth(depth: number) {
  const front = depth * 0.5 + 0.5;
  return front ** 1.6;
}

export function sphereCloud(count: number, radius: number): Cloud {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const light = new Float32Array(count);
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const baseZ = new Float32Array(count);
  const cosTilt = Math.cos(SPHERE_TILT);
  const sinTilt = Math.sin(SPHERE_TILT);

  for (let index = 0; index < count; index += 1) {
    const share = (index + 0.5) / count;
    const height = 1 - 2 * share;
    const ringRadius = Math.sqrt(1 - height * height);
    const turn = index * GOLDEN_ANGLE;
    baseX[index] = Math.cos(turn) * ringRadius;
    baseY[index] = height;
    baseZ[index] = Math.sin(turn) * ringRadius;
  }

  function advance(time: number) {
    const yaw = time * SPHERE_SPIN;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    for (let index = 0; index < count; index += 1) {
      const turnedX = baseX[index] * cosYaw + baseZ[index] * sinYaw;
      const turnedZ = baseZ[index] * cosYaw - baseX[index] * sinYaw;
      const tiltedY = baseY[index] * cosTilt - turnedZ * sinTilt;
      const tiltedZ = baseY[index] * sinTilt + turnedZ * cosTilt;
      x[index] = turnedX * radius;
      y[index] = tiltedY * radius;
      light[index] = lightOfDepth(tiltedZ);
    }
  }

  advance(0);
  return { x, y, light, isMoving: true, advance };
}

export function ringCloud(
  count: number,
  radiusX: number,
  radiusY: number,
  random: () => number
): Cloud {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const light = new Float32Array(count);
  const turns = new Float32Array(count);
  const reach = new Float32Array(count);
  const lift = new Float32Array(count);
  const cosTilt = Math.cos(RING_TILT);
  const sinTilt = Math.sin(RING_TILT);

  for (let index = 0; index < count; index += 1) {
    const share = (index * GOLDEN_SHARE) % 1;
    const band = index % RING_BANDS;
    const bandReach = 0.93 + band * 0.07;
    const wobble = (random() - 0.5) * 0.03;
    turns[index] = share * FULL_TURN;
    reach[index] = bandReach + wobble;
    lift[index] = (random() - 0.5) * radiusY * 0.08;
  }

  function advance(time: number) {
    const drift = time * RING_SPIN;
    for (let index = 0; index < count; index += 1) {
      const angle = turns[index] + drift;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const ellipseX = cosAngle * radiusX * reach[index];
      const ellipseY = sinAngle * radiusY * reach[index] + lift[index];
      x[index] = ellipseX * cosTilt - ellipseY * sinTilt;
      y[index] = ellipseX * sinTilt + ellipseY * cosTilt;
      light[index] = lightOfDepth(sinAngle);
    }
  }

  advance(0);
  return { x, y, light, isMoving: true, advance };
}

export function waveCloud(count: number, width: number, height: number): Cloud {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const light = new Float32Array(count);
  const rowOf = new Float32Array(count);
  const columns = Math.ceil(count / WAVE_ROWS);
  const wavelength = width * 0.5;
  const band = height * 0.36;
  const amplitude = height * 0.11;
  const lastRow = WAVE_ROWS - 1;

  for (let index = 0; index < count; index += 1) {
    const column = Math.floor(index / WAVE_ROWS);
    const row = index % WAVE_ROWS;
    const across = column / (columns - 1);
    x[index] = (across - 0.5) * width * 1.08;
    rowOf[index] = row / lastRow;
  }

  function advance(time: number) {
    const phase = time * WAVE_SPEED;
    for (let index = 0; index < count; index += 1) {
      const depth = rowOf[index];
      const swell = Math.sin(
        (x[index] / wavelength) * FULL_TURN + phase + depth * 2.4
      );
      const baseline = (depth - 0.5) * band;
      const reachOfRow = 0.45 + depth * 0.75;
      y[index] = baseline + swell * amplitude * reachOfRow;
      const crest = swell * 0.5 + 0.5;
      light[index] = 0.1 + depth * 0.62 + crest * 0.28;
    }
  }

  advance(0);
  return { x, y, light, isMoving: true, advance };
}

export function scatterCloud(
  count: number,
  width: number,
  height: number,
  random: () => number
): Cloud {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const light = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    x[index] = (random() - 0.5) * width;
    y[index] = (random() - 0.5) * height;
    light[index] = 0.06 + random() * 0.4;
  }

  return { x, y, light, isMoving: false, advance: STILL };
}
