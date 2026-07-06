import {
  OUTPUT_WORD,
  OUTPUTS_OF,
  type Connection,
  type OutputId,
  type Step,
} from './data';
import type { Move } from './graph';

/** A wide canvas reads from left to right. A narrow one, such as a phone, reads from top to bottom. */
export type Orientation = 'across' | 'down';

export type Point = {
  x: number;
  y: number;
};

export type Box = Point & {
  width: number;
  height: number;
};

export type Cell = {
  level: number;
  lane: number;
};

/** A wide canvas has room for a whole name on one line. On a narrow one the name wraps to a second line. */
const CARD_WIDTH: Record<Orientation, number> = {
  across: 240,
  down: 192,
};

/** Tall enough for the kind, a name on two lines and one line of detail. */
const CARD_HEIGHT = 92;

/** The pixels of one grid unit along the flow and across it. A step is twelve units from the next one. */
const PITCH: Record<Orientation, Cell> = {
  across: { level: 24, lane: 24 },
  down: { level: 12, lane: 36 },
};

/** The grid drawn while a step is dragged: the lines a step snaps to. */
export const GRID: Record<Orientation, Point> = {
  across: { x: 24, y: 24 },
  down: { x: 36, y: 24 },
};

const LEVEL_MIN = -20;

const LEVEL_MAX = 60;

const LANE_MIN = -10;

const LANE_MAX = 20;

/** How far a wire runs straight out of a port before it turns. */
const MIN_REACH = 36;

export type StepPlace = {
  box: Box;
  /** Where wires arrive. A trigger starts the flow and has none. */
  input: Point | null;
  outputs: Partial<Record<OutputId, Point>>;
};

export type PlacedWire<Link extends Connection> = {
  id: string;
  link: Link;
  path: string;
};

export type OutputLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export type CanvasLayout<Link extends Connection> = {
  places: Record<string, StepPlace>;
  wires: PlacedWire<Link>[];
  /** Yes and No, written where each leaves a condition. */
  labels: OutputLabel[];
  bounds: Box;
};

function clamp(value: number, min: number, max: number) {
  const atLeast = Math.max(value, min);
  return Math.min(atLeast, max);
}

function originOf(step: Step, orientation: Orientation): Point {
  const pitch = PITCH[orientation];
  const along = step.level * pitch.level;
  const across = step.lane * pitch.lane;
  if (orientation === 'across') {
    return { x: along, y: across };
  }
  return { x: across, y: along };
}

function inputPointOf(box: Box, orientation: Orientation): Point {
  if (orientation === 'across') {
    return { x: box.x, y: box.y + box.height / 2 };
  }
  return { x: box.x + box.width / 2, y: box.y };
}

/** One output leaves from the middle of the edge, two from its thirds. */
function outputPointOf(
  box: Box,
  index: number,
  count: number,
  orientation: Orientation
): Point {
  const share = (index + 1) / (count + 1);
  if (orientation === 'across') {
    return { x: box.x + box.width, y: box.y + box.height * share };
  }
  return { x: box.x + box.width * share, y: box.y + box.height };
}

function placeOf(step: Step, orientation: Orientation): StepPlace {
  const origin = originOf(step, orientation);
  const width = CARD_WIDTH[orientation];
  const box = { ...origin, width, height: CARD_HEIGHT };
  const outputIds = OUTPUTS_OF[step.kind];
  const outputs: Partial<Record<OutputId, Point>> = {};
  outputIds.forEach((output, index) => {
    outputs[output] = outputPointOf(box, index, outputIds.length, orientation);
  });
  if (step.kind === 'trigger') {
    return { box, input: null, outputs };
  }
  return { box, input: inputPointOf(box, orientation), outputs };
}

export function wirePathOf(from: Point, to: Point, orientation: Orientation) {
  if (orientation === 'across') {
    const span = Math.abs(to.x - from.x);
    const reach = Math.max(MIN_REACH, span / 2);
    const leaveX = from.x + reach;
    const arriveX = to.x - reach;
    return `M ${from.x} ${from.y} C ${leaveX} ${from.y}, ${arriveX} ${to.y}, ${to.x} ${to.y}`;
  }
  const span = Math.abs(to.y - from.y);
  const reach = Math.max(MIN_REACH, span / 2);
  const leaveY = from.y + reach;
  const arriveY = to.y - reach;
  return `M ${from.x} ${from.y} C ${from.x} ${leaveY}, ${to.x} ${arriveY}, ${to.x} ${to.y}`;
}

export function wireIdOf(link: Connection) {
  return `${link.from}:${link.output}`;
}

function labelOf(
  step: Step,
  output: OutputId,
  port: Point,
  orientation: Orientation
): OutputLabel {
  const id = `${step.id}:${output}`;
  const text = OUTPUT_WORD[output];
  if (orientation === 'across') {
    return { id, text, x: port.x + 10, y: port.y - 6 };
  }
  return { id, text, x: port.x + 9, y: port.y + 14 };
}

function labelsOf(
  steps: Step[],
  places: Record<string, StepPlace>,
  orientation: Orientation
) {
  const labels: OutputLabel[] = [];
  const forks = steps.filter((step) => step.kind === 'condition');
  for (const step of forks) {
    for (const output of OUTPUTS_OF.condition) {
      const port = places[step.id]?.outputs[output];
      if (port) {
        labels.push(labelOf(step, output, port, orientation));
      }
    }
  }
  return labels;
}

function boundsOf(places: StepPlace[], orientation: Orientation): Box {
  if (places.length === 0) {
    const width = CARD_WIDTH[orientation];
    return { x: 0, y: 0, width, height: CARD_HEIGHT };
  }
  const lefts = places.map((place) => place.box.x);
  const tops = places.map((place) => place.box.y);
  const rights = places.map((place) => place.box.x + place.box.width);
  const bottoms = places.map((place) => place.box.y + place.box.height);
  const x = Math.min(...lefts);
  const y = Math.min(...tops);
  return {
    x,
    y,
    width: Math.max(...rights) - x,
    height: Math.max(...bottoms) - y,
  };
}

/** Everything the canvas draws, worked out from the steps and their connections alone. */
export function layoutOf<Link extends Connection>(
  steps: Step[],
  connections: Link[],
  orientation: Orientation
): CanvasLayout<Link> {
  const places: Record<string, StepPlace> = {};
  for (const step of steps) {
    places[step.id] = placeOf(step, orientation);
  }
  const wires: PlacedWire<Link>[] = [];
  for (const link of connections) {
    const from = places[link.from]?.outputs[link.output];
    const to = places[link.to]?.input;
    if (from && to) {
      wires.push({
        id: wireIdOf(link),
        link,
        path: wirePathOf(from, to, orientation),
      });
    }
  }
  return {
    places,
    wires,
    labels: labelsOf(steps, places, orientation),
    bounds: boundsOf(Object.values(places), orientation),
  };
}

/** The pixels between two drawn lines, along the flow and across it. */
function lineGapOf(orientation: Orientation): Cell {
  const grid = GRID[orientation];
  if (orientation === 'across') {
    return { level: grid.x, lane: grid.y };
  }
  return { level: grid.y, lane: grid.x };
}

/** A whole number of drawn lines, in grid units: on a phone a line is two units apart along the flow. */
function snappedUnitsOf(pixels: number, lineGap: number, unit: number) {
  const lines = Math.round(pixels / lineGap);
  const unitsPerLine = Math.round(lineGap / unit);
  return lines * unitsPerLine;
}

/** The cell a step dragged by `dx` and `dy` pixels of the canvas snaps to: always on a drawn line. */
export function draggedCellOf(
  orientation: Orientation,
  origin: Cell,
  dx: number,
  dy: number
): Cell {
  const pitch = PITCH[orientation];
  const lineGap = lineGapOf(orientation);
  let along = dx;
  let across = dy;
  if (orientation === 'down') {
    along = dy;
    across = dx;
  }
  const levelShift = snappedUnitsOf(along, lineGap.level, pitch.level);
  const laneShift = snappedUnitsOf(across, lineGap.lane, pitch.lane);
  const level = origin.level + levelShift;
  const lane = origin.lane + laneShift;
  return {
    level: clamp(level, LEVEL_MIN, LEVEL_MAX),
    lane: clamp(lane, LANE_MIN, LANE_MAX),
  };
}

const DIRECTIONS: Partial<Record<string, Point>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** One line of the grid in the direction of an arrow key, or null for any other key. */
export function nudgedCellOf(
  orientation: Orientation,
  origin: Cell,
  key: string
) {
  const direction = DIRECTIONS[key];
  if (!direction) {
    return null;
  }
  const grid = GRID[orientation];
  const dx = direction.x * grid.x;
  const dy = direction.y * grid.y;
  return draggedCellOf(orientation, origin, dx, dy);
}

const MOVES: Record<Orientation, Partial<Record<string, Move>>> = {
  across: {
    ArrowRight: 'forward',
    ArrowLeft: 'back',
    ArrowDown: 'next',
    ArrowUp: 'previous',
  },
  down: {
    ArrowDown: 'forward',
    ArrowUp: 'back',
    ArrowRight: 'next',
    ArrowLeft: 'previous',
  },
};

/** An arrow key follows the flow in the direction the canvas reads. */
export function moveOfKey(orientation: Orientation, key: string) {
  return MOVES[orientation][key] ?? null;
}

function contains(box: Box, point: Point, reach: number) {
  const isInsideX =
    point.x >= box.x - reach && point.x <= box.x + box.width + reach;
  const isInsideY =
    point.y >= box.y - reach && point.y <= box.y + box.height + reach;
  return isInsideX && isInsideY;
}

/** The step under a point of the canvas, with some reach around its card so a wire lands easily. */
export function stepAt(
  places: Record<string, StepPlace>,
  point: Point,
  reach: number
) {
  const ids = Object.keys(places);
  const found = ids.find((id) => contains(places[id].box, point, reach));
  return found ?? null;
}
