import {
  pointerWithin,
  rectIntersection,
  type ClientRect,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';

import { COLUMNS, PEOPLE, type ColumnId, type LaneId } from './data';

type Direction = 'up' | 'down' | 'left' | 'right';

type Point = { x: number; y: number };

type Choice = { rect: ClientRect; cost: number };

export type DropTarget = { column: ColumnId; lane?: LaneId };

const DIRECTION_OF_KEY: Partial<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** A move across rows or columns costs this much more than a move along them. */
const ACROSS_WEIGHT = 3;

/** The dragged card lands this far inside the top of the place it goes to. */
const LANDING_INSET_PX = 8;

const LANE_SEPARATOR = '/';

export function dropIdOf(column: ColumnId, lane?: LaneId) {
  if (lane === undefined) {
    return column;
  }
  return `${lane}${LANE_SEPARATOR}${column}`;
}

function columnIdOf(value: string) {
  const column = COLUMNS.find((candidate) => candidate.id === value);
  return column?.id;
}

function laneIdOf(value: string): LaneId | undefined {
  if (value === 'unassigned') {
    return 'unassigned';
  }
  const person = PEOPLE.find((candidate) => candidate.id === value);
  return person?.id;
}

export function targetOf(id: UniqueIdentifier | undefined): DropTarget | null {
  if (id === undefined) {
    return null;
  }
  const parts = String(id).split(LANE_SEPARATOR);
  if (parts.length === 1) {
    const column = columnIdOf(parts[0]);
    if (!column) {
      return null;
    }
    return { column };
  }
  const lane = laneIdOf(parts[0]);
  const column = columnIdOf(parts[1]);
  if (!lane || !column) {
    return null;
  }
  return { column, lane };
}

/** A pointer drops where it is; the keyboard, which has none, drops where the card overlaps most. */
export const boardCollision: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    return pointerWithin(args);
  }
  return rectIntersection(args);
};

function centerOf(rect: ClientRect): Point {
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  const x = rect.left + halfWidth;
  const y = rect.top + halfHeight;
  return { x, y };
}

function isAhead(direction: Direction, from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (direction === 'right') {
    return dx > 1;
  }
  if (direction === 'left') {
    return dx < -1;
  }
  if (direction === 'down') {
    return dy > 1;
  }
  return dy < -1;
}

function costOf(direction: Direction, from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const width = Math.abs(dx);
  const height = Math.abs(dy);
  const isHorizontal = direction === 'left' || direction === 'right';
  if (isHorizontal) {
    const sideways = height * ACROSS_WEIGHT;
    return width + sideways;
  }
  const sideways = width * ACROSS_WEIGHT;
  return height + sideways;
}

function cheaperOf(best: Choice | null, candidate: Choice) {
  if (best === null) {
    return candidate;
  }
  if (candidate.cost < best.cost) {
    return candidate;
  }
  return best;
}

function landingOf(target: ClientRect, dragged: ClientRect) {
  const spare = target.width - dragged.width;
  const offset = spare / 2;
  const x = target.left + offset;
  const y = target.top + LANDING_INSET_PX;
  return { x, y };
}

/**
 * The arrows move a picked card from place to place: a column on the board, a cell of the
 * swimlanes. Each press goes to the nearest place in that direction.
 */
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context }
) => {
  const direction = DIRECTION_OF_KEY[event.code];
  if (!direction) {
    return undefined;
  }
  event.preventDefault();
  const { collisionRect, droppableRects, droppableContainers, over } = context;
  if (!collisionRect) {
    return undefined;
  }
  const fromRect = over?.rect ?? collisionRect;
  const from = centerOf(fromRect);
  let best: Choice | null = null;
  for (const container of droppableContainers.getEnabled()) {
    const rect = droppableRects.get(container.id);
    if (!rect) {
      continue;
    }
    const to = centerOf(rect);
    if (!isAhead(direction, from, to)) {
      continue;
    }
    const cost = costOf(direction, from, to);
    best = cheaperOf(best, { rect, cost });
  }
  if (!best) {
    return undefined;
  }
  return landingOf(best.rect, collisionRect);
};
