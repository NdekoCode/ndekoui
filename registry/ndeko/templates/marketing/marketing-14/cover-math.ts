export const CARD_STEP = 0.62;

const FAR_STEP = 0.3;

const TURN_DEGREES = 42;

const DEPTH_PX = 80;

const SCALE_LOSS = 0.1;

const FADE_FROM = 2;

function magnitudeOf(offset: number) {
  return Math.abs(offset);
}

function shiftOf(offset: number) {
  const magnitude = magnitudeOf(offset);
  const near = Math.min(magnitude, 1) * CARD_STEP;
  const far = Math.max(magnitude - 1, 0) * FAR_STEP;
  return Math.sign(offset) * (near + far);
}

function turnOf(offset: number) {
  const bounded = Math.max(-1, Math.min(1, offset));
  return -bounded * TURN_DEGREES;
}

function scaleOf(offset: number) {
  const magnitude = Math.min(magnitudeOf(offset), 2);
  return 1 - magnitude * SCALE_LOSS;
}

function depthOf(offset: number) {
  const magnitude = Math.min(magnitudeOf(offset), 2);
  return -magnitude * DEPTH_PX;
}

export function coverTransformOf(offset: number) {
  const shift = shiftOf(offset);
  const turn = turnOf(offset);
  const scale = scaleOf(offset);
  const depth = depthOf(offset);
  return `translateX(calc(var(--card-w) * ${shift})) translateZ(${depth}px) rotateY(${turn}deg) scale(${scale})`;
}

export function coverOpacityOf(offset: number) {
  const past = magnitudeOf(offset) - FADE_FROM;
  return Math.max(1 - Math.max(past, 0), 0);
}

export function coverStackOf(offset: number) {
  return 100 - Math.round(magnitudeOf(offset) * 10);
}

export function nearestIndexOf(position: number, lastIndex: number) {
  const rounded = Math.round(position);
  return Math.min(Math.max(rounded, 0), lastIndex);
}

export function heldPositionOf(position: number, lastIndex: number) {
  if (position < 0) {
    return position * 0.35;
  }
  if (position > lastIndex) {
    return lastIndex + (position - lastIndex) * 0.35;
  }
  return position;
}
