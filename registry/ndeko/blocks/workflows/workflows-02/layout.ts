import { nodeOf, NODES, type Link, type NodeId, type PortType } from './data';

/** A wide canvas reads from left to right. A phone reads from top to bottom. */
export type Orientation = 'across' | 'down';

export type Point = {
  x: number;
  y: number;
};

export type Box = Point & {
  width: number;
  height: number;
};

export const NODE_WIDTH = 216;

export const NODE_HEIGHT = 168;

/** The room between two nodes along the pipeline, where their wire runs. */
const GAP = 40;

/** How far every other node steps aside, so a wire curves instead of running straight. */
const ASIDE = 48;

/** The ports of a wide canvas sit on the first line of the node, beside its types. */
const PORT_INSET = 18;

/** How far a wire runs straight out of a port before it turns. */
const MIN_REACH = 28;

export type NodePlace = {
  box: Box;
  /** Where its wire arrives. The first node takes no input. */
  input: Point | null;
  output: Point;
};

export type PlacedWire<Wire extends Link> = {
  id: string;
  link: Wire;
  type: PortType;
  path: string;
};

export type GraphLayout<Wire extends Link> = {
  places: Record<NodeId, NodePlace>;
  wires: PlacedWire<Wire>[];
  bounds: Box;
};

function asideOf(isAside: boolean) {
  if (isAside) {
    return ASIDE;
  }
  return 0;
}

function boxOf(
  column: number,
  isAside: boolean,
  orientation: Orientation
): Box {
  const aside = asideOf(isAside);
  if (orientation === 'across') {
    const x = column * (NODE_WIDTH + GAP);
    return { x, y: aside, width: NODE_WIDTH, height: NODE_HEIGHT };
  }
  const y = column * (NODE_HEIGHT + GAP);
  return { x: aside, y, width: NODE_WIDTH, height: NODE_HEIGHT };
}

function placeOf(
  box: Box,
  hasInput: boolean,
  orientation: Orientation
): NodePlace {
  let input: Point = { x: box.x + box.width / 2, y: box.y };
  let output: Point = { x: box.x + box.width / 2, y: box.y + box.height };
  if (orientation === 'across') {
    input = { x: box.x, y: box.y + PORT_INSET };
    output = { x: box.x + box.width, y: box.y + PORT_INSET };
  }
  if (!hasInput) {
    return { box, input: null, output };
  }
  return { box, input, output };
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

function nodePlaceOf(id: NodeId, orientation: Orientation) {
  const node = nodeOf(id);
  const box = boxOf(node.column, node.isAside, orientation);
  return placeOf(box, node.input !== null, orientation);
}

function placesOf(orientation: Orientation): Record<NodeId, NodePlace> {
  return {
    load: nodePlaceOf('load', orientation),
    split: nodePlaceOf('split', orientation),
    embed: nodePlaceOf('embed', orientation),
    search: nodePlaceOf('search', orientation),
    answer: nodePlaceOf('answer', orientation),
  };
}

function boundsOf(places: NodePlace[]): Box {
  const rights = places.map((place) => place.box.x + place.box.width);
  const bottoms = places.map((place) => place.box.y + place.box.height);
  return {
    x: 0,
    y: 0,
    width: Math.max(...rights),
    height: Math.max(...bottoms),
  };
}

/** Everything the canvas draws, worked out from the nodes and their wires alone. */
export function layoutOf<Wire extends Link>(
  links: Wire[],
  orientation: Orientation
): GraphLayout<Wire> {
  const places = placesOf(orientation);
  const wires: PlacedWire<Wire>[] = [];
  for (const link of links) {
    const from = places[link.from].output;
    const to = places[link.to].input;
    if (to) {
      wires.push({
        id: `${link.from}:${link.to}`,
        link,
        type: nodeOf(link.from).output,
        path: wirePathOf(from, to, orientation),
      });
    }
  }
  return { places, wires, bounds: boundsOf(Object.values(places)) };
}

function contains(box: Box, point: Point, reach: number) {
  const isInsideX =
    point.x >= box.x - reach && point.x <= box.x + box.width + reach;
  const isInsideY =
    point.y >= box.y - reach && point.y <= box.y + box.height + reach;
  return isInsideX && isInsideY;
}

/** The node under a point of the canvas, with some reach around it so a wire lands easily. */
export function nodeAt(
  places: Record<NodeId, NodePlace>,
  point: Point,
  reach: number
) {
  const found = NODES.find((node) =>
    contains(places[node.id].box, point, reach)
  );
  return found?.id ?? null;
}
