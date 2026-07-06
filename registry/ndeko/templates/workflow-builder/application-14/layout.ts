import { edgeIdOf } from './flow';
import type {
  BranchOutput,
  BranchStep,
  InsertAt,
  Step,
  Workflow,
} from './model';

export const NODE_WIDTH = 208;

export const NODE_HEIGHT = 52;

const COLUMN_GAP = 24;

const ROW_GAP = 36;

const PADDING = 32;

/** Under a branch: the line that carries its outputs sideways, then down each column a label, an insert point and the first step. */
const FORK_BUS = 14;

const FORK_LABEL = 18;

const FORK_INSERT = 42;

const FORK_STEP = 56;

/** Where outputs join: the line that brings them back under the branch, then the step they join at. */
const JOIN_BUS = 30;

const JOIN_STEP = 30;

const INSERT_DROP = 15;

const TAIL_DROP = 28;

const ELBOW_RADIUS = 8;

export type Point = {
  x: number;
  y: number;
};

export type Box = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlowEdge = {
  id: string;
  fromId: string;
  /** Null for the edge that ends the flow. */
  toId: string | null;
  outputId: string | null;
  /** Where the label of an output sits. Its text is not here: a layout reads only the structure of the flow. */
  labelAt: Point | null;
  /** The corners the path turns at, from its first point to its last: what travels along the edge follows them. */
  points: Point[];
  path: string;
};

export type InsertPoint = {
  id: string;
  at: InsertAt;
  x: number;
  y: number;
  /** The step read just before this point in the order of the flow: the keyboard reaches the point right after it. */
  afterId: string | null;
};

export type FlowLayout = {
  width: number;
  height: number;
  trunkX: number;
  /** In the order of the flow, the outputs of a branch left to right. */
  boxes: Box[];
  edges: FlowEdge[];
  inserts: InsertPoint[];
};

/** An edge that has left its step and has not reached the next one yet. */
type OpenEnd = {
  fromId: string;
  outputId: string | null;
  labelAt: Point | null;
  points: Point[];
};

type Draft = {
  boxes: Box[];
  edges: FlowEdge[];
  inserts: InsertPoint[];
  lastId: string | null;
};

type Placement = {
  ends: OpenEnd[];
  bottom: number;
};

/** A list is as wide as its widest step, and a branch as wide as its outputs side by side. */
function widthOfList(steps: Step[]): number {
  let width = NODE_WIDTH;
  for (const step of steps) {
    const stepWidth = widthOfStep(step);
    width = Math.max(width, stepWidth);
  }
  return width;
}

function widthOfStep(step: Step): number {
  if (step.kind !== 'branch') {
    return NODE_WIDTH;
  }
  let width = 0;
  for (const output of step.outputs) {
    width += widthOfList(output.steps);
  }
  const gaps = step.outputs.length - 1;
  return width + gaps * COLUMN_GAP;
}

function distanceOf(from: Point, to: Point) {
  const offsetX = to.x - from.x;
  const offsetY = to.y - from.y;
  return Math.hypot(offsetX, offsetY);
}

function towards(from: Point, to: Point, distance: number): Point {
  const length = distanceOf(from, to);
  if (length === 0) {
    return from;
  }
  const share = distance / length;
  const offsetX = (to.x - from.x) * share;
  const offsetY = (to.y - from.y) * share;
  return { x: from.x + offsetX, y: from.y + offsetY };
}

/** An elbow: the line stops short of the corner and a curve takes the turn, never over more than half a side. */
function elbowOf(before: Point, corner: Point, after: Point) {
  const sideIn = distanceOf(before, corner);
  const sideOut = distanceOf(corner, after);
  const shortSide = Math.min(sideIn, sideOut);
  const radius = Math.min(ELBOW_RADIUS, shortSide / 2);
  const start = towards(corner, before, radius);
  const end = towards(corner, after, radius);
  return `L ${start.x} ${start.y} Q ${corner.x} ${corner.y} ${end.x} ${end.y}`;
}

function pathOf(points: Point[]) {
  const first = points[0];
  const last = points[points.length - 1];
  const parts = [`M ${first.x} ${first.y}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1];
    const corner = points[index];
    const after = points[index + 1];
    const elbow = elbowOf(before, corner, after);
    parts.push(elbow);
  }
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

/** Straight down when the target sits under the end, else down to a line just above the target and across to it. */
function routeTo(end: OpenEnd, target: Point): Point[] {
  const last = end.points[end.points.length - 1];
  if (last.x === target.x) {
    return [...end.points, target];
  }
  const busY = target.y - JOIN_STEP;
  const down = { x: last.x, y: busY };
  const across = { x: target.x, y: busY };
  return [...end.points, down, across, target];
}

function closeEnd(
  draft: Draft,
  end: OpenEnd,
  toId: string | null,
  target: Point
) {
  const points = routeTo(end, target);
  draft.edges.push({
    id: edgeIdOf(end.fromId, end.outputId),
    fromId: end.fromId,
    toId,
    outputId: end.outputId,
    labelAt: end.labelAt,
    points,
    path: pathOf(points),
  });
}

function insertIdOf(at: InsertAt) {
  if (at.at === 'after') {
    return `after:${at.stepId}`;
  }
  if (at.at === 'first') {
    return `first:${at.branchId}:${at.outputId}`;
  }
  return 'end';
}

function addInsert(draft: Draft, at: InsertAt, point: Point) {
  draft.inserts.push({
    id: insertIdOf(at),
    at,
    x: point.x,
    y: point.y,
    afterId: draft.lastId,
  });
}

/** The edge of an output leaves the branch, runs along the line under it and stops above its own column. */
function forkEndOf(
  branch: BranchStep,
  output: BranchOutput,
  from: Point,
  columnX: number
): OpenEnd {
  const busY = from.y + FORK_BUS;
  const points = [from, { x: from.x, y: busY }];
  if (columnX !== from.x) {
    points.push({ x: columnX, y: busY });
  }
  return {
    fromId: branch.id,
    outputId: output.id,
    labelAt: { x: columnX, y: busY + FORK_LABEL },
    points,
  };
}

function placeBranch(draft: Draft, branch: BranchStep, from: Point): Placement {
  const busY = from.y + FORK_BUS;
  const firstTop = busY + FORK_STEP;
  const ends: OpenEnd[] = [];
  const total = widthOfStep(branch);
  let left = from.x - total / 2;
  let bottom = firstTop;
  for (const output of branch.outputs) {
    const width = widthOfList(output.steps);
    const columnX = left + width / 2;
    const end = forkEndOf(branch, output, from, columnX);
    const first: InsertAt = {
      at: 'first',
      branchId: branch.id,
      outputId: output.id,
    };
    addInsert(draft, first, { x: columnX, y: busY + FORK_INSERT });
    const placed = placeList(draft, output.steps, columnX, firstTop, [end]);
    ends.push(...placed.ends);
    bottom = Math.max(bottom, placed.bottom);
    left += width + COLUMN_GAP;
  }
  return { ends, bottom };
}

/**
 * Places a list of steps down one column. `incoming` are the edges that reach its first step. It
 * returns the edges that leave it, for the step that comes next in the list above.
 */
function placeList(
  draft: Draft,
  steps: Step[],
  centerX: number,
  top: number,
  incoming: OpenEnd[],
  isTrunk = false
): Placement {
  let ends = incoming;
  let cursor = top;
  let bottom = top;
  let previous: Step | null = null;
  for (const [index, step] of steps.entries()) {
    const target = { x: centerX, y: cursor };
    if (previous?.kind === 'branch') {
      const join: InsertAt = { at: 'after', stepId: previous.id };
      addInsert(draft, join, { x: centerX, y: cursor - INSERT_DROP });
    }
    for (const end of ends) {
      closeEnd(draft, end, step.id, target);
    }
    draft.boxes.push({
      id: step.id,
      x: centerX - NODE_WIDTH / 2,
      y: cursor,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
    draft.lastId = step.id;
    const stepBottom = cursor + NODE_HEIGHT;
    const exit = { x: centerX, y: stepBottom };
    if (step.kind === 'branch') {
      const fork = placeBranch(draft, step, exit);
      ends = fork.ends;
      bottom = fork.bottom;
      cursor = fork.bottom + JOIN_BUS + JOIN_STEP;
    } else {
      const isLast = index === steps.length - 1;
      addOwnInsert(draft, step, exit, isLast, isTrunk);
      ends = [openEndOf(step, exit)];
      bottom = stepBottom;
      cursor = stepBottom + ROW_GAP;
    }
    previous = step;
  }
  return { ends, bottom };
}

function openEndOf(step: Step, exit: Point): OpenEnd {
  return {
    fromId: step.id,
    outputId: null,
    labelAt: null,
    points: [exit],
  };
}

/**
 * Between two steps the point sits halfway. Under the last step of an output it sits close to the
 * step, since the line then turns towards the join. The last step of the trunk has none: the point
 * that ends the flow stands for it.
 */
function addOwnInsert(
  draft: Draft,
  step: Step,
  exit: Point,
  isLast: boolean,
  isTrunk: boolean
) {
  const after: InsertAt = { at: 'after', stepId: step.id };
  if (!isLast) {
    addInsert(draft, after, { x: exit.x, y: exit.y + ROW_GAP / 2 });
    return;
  }
  if (!isTrunk) {
    addInsert(draft, after, { x: exit.x, y: exit.y + INSERT_DROP });
  }
}

function tailYOf(bottom: number, last: Step | undefined) {
  if (!last) {
    return bottom + INSERT_DROP;
  }
  if (last.kind === 'branch') {
    return bottom + JOIN_BUS + JOIN_STEP;
  }
  return bottom + TAIL_DROP;
}

/** The whole canvas from the data and nothing else: where each step sits, how each edge runs, where a step can be added. */
export function layoutOf(workflow: Workflow): FlowLayout {
  const draft: Draft = { boxes: [], edges: [], inserts: [], lastId: null };
  const inner = widthOfList(workflow.steps);
  const width = inner + PADDING * 2;
  const trunkX = width / 2;
  const placed = placeList(draft, workflow.steps, trunkX, PADDING, [], true);
  const last = workflow.steps.at(-1);
  const tail = { x: trunkX, y: tailYOf(placed.bottom, last) };
  for (const end of placed.ends) {
    closeEnd(draft, end, null, tail);
  }
  addInsert(draft, { at: 'end' }, tail);
  return {
    width,
    height: tail.y + PADDING,
    trunkX,
    boxes: draft.boxes,
    edges: draft.edges,
    inserts: draft.inserts,
  };
}

export function boxOf(layout: FlowLayout, id: string) {
  return layout.boxes.find((box) => box.id === id);
}

export function lengthOf(points: Point[]) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    length += distanceOf(from, to);
  }
  return length;
}
