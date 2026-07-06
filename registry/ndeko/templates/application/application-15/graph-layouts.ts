import { hashOf } from '@/registry/ndeko/lib/seeded';

import { ACCOUNTS, contactsOf } from './data';

export type LayoutId = 'cluster' | 'rings' | 'grid' | 'orbit' | 'radial';

export type LayoutOption = {
  value: LayoutId;
  label: string;
};

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'cluster', label: 'Cluster' },
  { value: 'rings', label: 'Rings' },
  { value: 'grid', label: 'Grid' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'radial', label: 'Radial' },
];

export const LAYOUT_IDS: LayoutId[] = LAYOUT_OPTIONS.map(
  (option) => option.value
);

export type Box = {
  width: number;
  height: number;
};

export type Place = {
  x: number;
  y: number;
};

export type Guide =
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number };

export type Arrangement = {
  places: Map<string, Place>;
  guides: Guide[];
};

/** The room kept round the nodes, so no node touches the edge of the stage. */
export const STAGE_PAD_PX = 22;

const DEGREE = Math.PI / 180;

const FULL_TURN = 360;

const SIDE_TURN = FULL_TURN / ACCOUNTS.length;

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

/** The same node always lands on the same offset, so a layout never shuffles between two renders. */
function jitterOf(seed: string, span: number) {
  const hash = hashOf(seed);
  const share = (hash % 1000) / 1000;
  const centred = share * 2 - 1;
  return centred * span;
}

function pointOnEllipse(
  center: Place,
  rx: number,
  ry: number,
  degrees: number
): Place {
  const angle = degrees * DEGREE;
  const offsetX = rx * Math.cos(angle);
  const offsetY = ry * Math.sin(angle);
  return { x: center.x + offsetX, y: center.y + offsetY };
}

function ellipseGuide(center: Place, rx: number, ry: number): Guide {
  return { kind: 'ellipse', x: center.x, y: center.y, rx, ry };
}

type Radii = {
  rx: number;
  ry: number;
};

/** A wide stage gets wide rings, up to twice as wide as tall, so the room beside the rings is used. */
function radiiOf(inner: Box): Radii {
  const ry = inner.height / 2;
  const widest = ry * 2;
  const rx = Math.min(inner.width / 2, widest);
  return { rx, ry };
}

function centerOf(inner: Box): Place {
  return { x: inner.width / 2, y: inner.height / 2 };
}

function sideOf(slot: number) {
  if (slot === 0) {
    return -1;
  }
  return 1;
}

function degreesOfAccount(index: number, first: number) {
  const turn = index * SIDE_TURN;
  return first + turn;
}

/** Under this width the clusters stand two across and three down, so each keeps room for its contacts. */
const NARROW_CLUSTER_PX = 360;

const CLUSTER_ANGLES = [145, 35];

type Grid = {
  columns: number;
  rows: number;
};

function clusterGridOf(inner: Box): Grid {
  if (inner.width < NARROW_CLUSTER_PX) {
    return { columns: 2, rows: 3 };
  }
  return { columns: 3, rows: 2 };
}

function clusterOf(inner: Box): Arrangement {
  const { columns, rows } = clusterGridOf(inner);
  const cellWidth = inner.width / columns;
  const cellHeight = inner.height / rows;
  const room = Math.min(cellWidth, cellHeight);
  const spread = clamp(room * 0.34, 38, 46);
  const territory = spread + 18;
  const places = new Map<string, Place>();
  const guides: Guide[] = [];
  ACCOUNTS.forEach((account, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const driftX = jitterOf(`${account.id}-x`, cellWidth * 0.05);
    const driftY = jitterOf(`${account.id}-y`, cellHeight * 0.04);
    const cellX = (column + 0.5) * cellWidth;
    const cellY = (row + 0.5) * cellHeight;
    const home: Place = {
      x: cellX + driftX,
      y: cellY + driftY - spread * 0.3,
    };
    places.set(account.id, home);
    contactsOf(account.id).forEach((contact, slot) => {
      const turn = jitterOf(contact.id, 9);
      const degrees = CLUSTER_ANGLES[slot] + turn;
      const place = pointOnEllipse(home, spread, spread, degrees);
      places.set(contact.id, place);
    });
    const middle: Place = { x: home.x, y: home.y + spread * 0.33 };
    guides.push(ellipseGuide(middle, territory, territory));
  });
  return { places, guides };
}

const RING_SLOT_TURN = 14;

function ringsOf(inner: Box): Arrangement {
  const center = centerOf(inner);
  const { rx, ry } = radiiOf(inner);
  const innerRx = rx * 0.5;
  const innerRy = ry * 0.5;
  const places = new Map<string, Place>();
  ACCOUNTS.forEach((account, index) => {
    const degrees = degreesOfAccount(index, -90);
    const home = pointOnEllipse(center, innerRx, innerRy, degrees);
    places.set(account.id, home);
    contactsOf(account.id).forEach((contact, slot) => {
      const turn = sideOf(slot) * RING_SLOT_TURN;
      const outer = pointOnEllipse(center, rx, ry, degrees + turn);
      places.set(contact.id, outer);
    });
  });
  const guides = [
    ellipseGuide(center, innerRx, innerRy),
    ellipseGuide(center, rx, ry),
  ];
  return { places, guides };
}

const GRID_COLUMN_SHARES = [0.14, 0.5, 0.86];

function gridOf(inner: Box): Arrangement {
  const rowHeight = inner.height / ACCOUNTS.length;
  const places = new Map<string, Place>();
  ACCOUNTS.forEach((account, index) => {
    const y = (index + 0.5) * rowHeight;
    const accountX = inner.width * GRID_COLUMN_SHARES[0];
    places.set(account.id, { x: accountX, y });
    contactsOf(account.id).forEach((contact, slot) => {
      const x = inner.width * GRID_COLUMN_SHARES[slot + 1];
      places.set(contact.id, { x, y });
    });
  });
  return { places, guides: [] };
}

const SATELLITE_TURN = 50;

function orbitOf(inner: Box): Arrangement {
  const center = centerOf(inner);
  const { rx, ry } = radiiOf(inner);
  const orbitRx = rx * 0.68;
  const orbitRy = ry * 0.68;
  const satellite = clamp(ry * 0.34, 40, 48);
  const places = new Map<string, Place>();
  const guides: Guide[] = [ellipseGuide(center, orbitRx, orbitRy)];
  ACCOUNTS.forEach((account, index) => {
    const degrees = degreesOfAccount(index, -90);
    const home = pointOnEllipse(center, orbitRx, orbitRy, degrees);
    places.set(account.id, home);
    guides.push(ellipseGuide(home, satellite, satellite));
    contactsOf(account.id).forEach((contact, slot) => {
      const turn = sideOf(slot) * SATELLITE_TURN;
      const place = pointOnEllipse(home, satellite, satellite, degrees + turn);
      places.set(contact.id, place);
    });
  });
  return { places, guides };
}

const RADIAL_FIRST_DEGREES = -60;

const RADIAL_SLOT_TURN = 11;

function radialOf(inner: Box): Arrangement {
  const center = centerOf(inner);
  const { rx, ry } = radiiOf(inner);
  const nearRx = rx * 0.4;
  const nearRy = ry * 0.4;
  const places = new Map<string, Place>();
  const guides: Guide[] = [];
  ACCOUNTS.forEach((account, index) => {
    const degrees = degreesOfAccount(index, RADIAL_FIRST_DEGREES);
    const near = pointOnEllipse(center, nearRx, nearRy, degrees);
    const far = pointOnEllipse(center, rx, ry, degrees);
    places.set(account.id, near);
    guides.push({
      kind: 'line',
      x1: center.x,
      y1: center.y,
      x2: far.x,
      y2: far.y,
    });
    contactsOf(account.id).forEach((contact, slot) => {
      const turn = sideOf(slot) * RADIAL_SLOT_TURN;
      const outer = pointOnEllipse(center, rx, ry, degrees + turn);
      places.set(contact.id, outer);
    });
  });
  return { places, guides };
}

const ARRANGERS: Record<LayoutId, (inner: Box) => Arrangement> = {
  cluster: clusterOf,
  rings: ringsOf,
  grid: gridOf,
  orbit: orbitOf,
  radial: radialOf,
};

function shiftedGuide(guide: Guide): Guide {
  if (guide.kind === 'ellipse') {
    return {
      ...guide,
      x: guide.x + STAGE_PAD_PX,
      y: guide.y + STAGE_PAD_PX,
    };
  }
  return {
    kind: 'line',
    x1: guide.x1 + STAGE_PAD_PX,
    y1: guide.y1 + STAGE_PAD_PX,
    x2: guide.x2 + STAGE_PAD_PX,
    y2: guide.y2 + STAGE_PAD_PX,
  };
}

export function arrangementOf(layout: LayoutId, stage: Box): Arrangement {
  const room = STAGE_PAD_PX * 2;
  const inner: Box = {
    width: Math.max(stage.width - room, 1),
    height: Math.max(stage.height - room, 1),
  };
  const raw = ARRANGERS[layout](inner);
  const places = new Map<string, Place>();
  for (const [id, place] of raw.places) {
    const x = place.x + STAGE_PAD_PX;
    const y = place.y + STAGE_PAD_PX;
    places.set(id, { x, y });
  }
  const guides = raw.guides.map(shiftedGuide);
  return { places, guides };
}

export function layoutNameOf(layout: LayoutId) {
  const option = LAYOUT_OPTIONS.find((candidate) => candidate.value === layout);
  return option?.label ?? '';
}
