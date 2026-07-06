const RADIUS = 46;

const BUTTON_RADIUS_SHARE = 0.72;

const SIDE_DEGREES = 60;

export const APOTHEM = RADIUS * Math.cos(Math.PI / 6);

function radiansOf(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function sideAngleOf(index: number) {
  return index * SIDE_DEGREES;
}

function vertexOf(index: number) {
  const angle = radiansOf(index * SIDE_DEGREES - SIDE_DEGREES / 2);
  return { x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) };
}

export function sidePathOf(index: number) {
  const from = vertexOf(index);
  const to = vertexOf(index + 1);
  return `M${from.x.toFixed(2)} ${from.y.toFixed(2)}L${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

export function sideStyleOf(index: number) {
  const angle = radiansOf(sideAngleOf(index));
  const reach = APOTHEM * BUTTON_RADIUS_SHARE;
  const left = 50 + Math.cos(angle) * reach;
  const top = 50 + Math.sin(angle) * reach;
  return { left: `${left}%`, top: `${top}%` };
}

export function turnedTo(current: number, index: number) {
  const target = -sideAngleOf(index);
  const gap = (((target - current) % 360) + 540) % 360;
  return current + gap - 180;
}
