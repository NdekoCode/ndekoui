export type ObjectId =
  'planet' | 'phone' | 'laptop' | 'monitor' | 'globe' | 'network' | 'dial';

type Point = { x: number; y: number };

type Stroke = {
  points: Point[];
  weight: number;
  tone: number;
};

export type OutlineCloud = {
  x: Float32Array;
  y: Float32Array;
  light: Float32Array;
};

const STEP = 0.01;

const FULL_TURN = Math.PI * 2;

const JITTER = 0.007;

const GAP_EPSILON = 1e-9;

function distanceBetween(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function stroke(points: Point[], weight: number, tone: number): Stroke {
  return { points, weight, tone };
}

function segmentPoints(from: Point, to: Point) {
  const span = distanceBetween(from, to);
  const steps = Math.max(1, Math.ceil(span / STEP));
  const points: Point[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const share = step / steps;
    points.push({
      x: from.x + (to.x - from.x) * share,
      y: from.y + (to.y - from.y) * share,
    });
  }
  return points;
}

function line(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  weight: number,
  tone: number
) {
  const points = segmentPoints({ x: x0, y: y0 }, { x: x1, y: y1 });
  return stroke(points, weight, tone);
}

function path(corners: Point[], weight: number, tone: number) {
  const points: Point[] = [];
  for (let index = 1; index < corners.length; index += 1) {
    const run = segmentPoints(corners[index - 1], corners[index]);
    points.push(...run);
  }
  return stroke(points, weight, tone);
}

function ellipsePoints(
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  from: number,
  to: number,
  tilt: number
) {
  const sweep = to - from;
  const rough = Math.PI * (radiusX + radiusY) * (Math.abs(sweep) / FULL_TURN);
  const steps = Math.max(8, Math.ceil(rough / STEP));
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  const points: Point[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const angle = from + (sweep * step) / steps;
    const flatX = Math.cos(angle) * radiusX;
    const flatY = Math.sin(angle) * radiusY;
    points.push({
      x: centreX + flatX * cosTilt - flatY * sinTilt,
      y: centreY + flatX * sinTilt + flatY * cosTilt,
    });
  }
  return points;
}

function arc(
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  from: number,
  to: number,
  weight: number,
  tone: number,
  tilt = 0
) {
  const points = ellipsePoints(
    centreX,
    centreY,
    radiusX,
    radiusY,
    from,
    to,
    tilt
  );
  return stroke(points, weight, tone);
}

function circle(
  centreX: number,
  centreY: number,
  radius: number,
  weight: number,
  tone: number
) {
  return arc(centreX, centreY, radius, radius, 0, FULL_TURN, weight, tone);
}

function roundedRect(
  centreX: number,
  centreY: number,
  width: number,
  height: number,
  radius: number,
  weight: number,
  tone: number
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const left = centreX - halfWidth;
  const right = centreX + halfWidth;
  const top = centreY - halfHeight;
  const bottom = centreY + halfHeight;
  const quarter = Math.PI / 2;
  const corner = (x: number, y: number, from: number) =>
    ellipsePoints(x, y, radius, radius, from, from + quarter, 0);
  const points: Point[] = [
    ...corner(right - radius, top + radius, -quarter),
    ...corner(right - radius, bottom - radius, 0),
    ...corner(left + radius, bottom - radius, quarter),
    ...corner(left + radius, top + radius, Math.PI),
  ];
  points.push(points[0]);
  return stroke(points, weight, tone);
}

function hiddenWhere(
  strokes: Stroke[],
  isHidden: (point: Point) => boolean
): Stroke[] {
  const kept: Stroke[] = [];
  for (const original of strokes) {
    let run: Point[] = [];
    for (const point of original.points) {
      if (isHidden(point)) {
        if (run.length > 1) {
          kept.push(stroke(run, original.weight, original.tone));
        }
        run = [];
      } else {
        run.push(point);
      }
    }
    if (run.length > 1) {
      kept.push(stroke(run, original.weight, original.tone));
    }
  }
  return kept;
}

function turned(strokes: Stroke[], angle: number): Stroke[] {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  return strokes.map((original) => {
    const points = original.points.map((point) => ({
      x: point.x * cosAngle - point.y * sinAngle,
      y: point.x * sinAngle + point.y * cosAngle,
    }));
    return stroke(points, original.weight, original.tone);
  });
}

function planetStrokes(): Stroke[] {
  const radius = 0.5;
  const tilt = -0.26;
  const planet = [
    circle(0, 0, radius, 1, 1),
    arc(0, 0.2, radius * 0.93, 0.13, 0.05, Math.PI - 0.05, 0.55, 0.55),
    arc(0, -0.16, radius * 0.97, 0.09, 0.05, Math.PI - 0.05, 0.55, 0.55),
  ];
  const outerRing = arc(0, 0, 0.98, 0.27, 0, FULL_TURN, 0.9, 0.9, tilt);
  const innerRing = arc(0, 0, 0.82, 0.22, 0, FULL_TURN, 0.8, 0.6, tilt);
  const behindPlanet = (point: Point) => {
    const localDown = point.x * Math.sin(-tilt) + point.y * Math.cos(-tilt);
    const isBackHalf = localDown < 0;
    const isInsideDisc = Math.hypot(point.x, point.y) < radius;
    return isBackHalf && isInsideDisc;
  };
  const rings = hiddenWhere([outerRing, innerRing], behindPlanet);
  return [...planet, ...rings];
}

function phoneStrokes(): Stroke[] {
  return [
    roundedRect(0, 0, 0.56, 1.04, 0.1, 1, 1),
    roundedRect(0, 0.01, 0.48, 0.9, 0.05, 0.7, 0.55),
    roundedRect(0, -0.43, 0.14, 0.035, 0.0175, 0.8, 0.8),
    line(-0.09, 0.47, 0.09, 0.47, 0.8, 0.7),
    line(-0.17, -0.3, 0.12, -0.3, 0.55, 0.6),
    line(-0.17, -0.22, 0.06, -0.22, 0.55, 0.45),
    roundedRect(0, 0.0, 0.38, 0.28, 0.04, 0.6, 0.55),
    roundedRect(0, 0.33, 0.38, 0.1, 0.03, 0.6, 0.45),
  ];
}

function laptopStrokes(): Stroke[] {
  return [
    roundedRect(0, -0.12, 1.3, 0.82, 0.05, 1, 1),
    roundedRect(0, -0.12, 1.16, 0.68, 0.02, 0.6, 0.55),
    roundedRect(0, 0.4, 1.6, 0.1, 0.05, 0.9, 0.9),
    line(-0.12, 0.36, 0.12, 0.36, 0.7, 0.6),
    line(-0.48, -0.32, -0.14, -0.32, 0.5, 0.6),
    line(-0.42, -0.23, 0.12, -0.23, 0.5, 0.5),
    line(-0.42, -0.14, -0.05, -0.14, 0.5, 0.5),
    line(-0.48, -0.05, 0.3, -0.05, 0.5, 0.5),
    line(-0.42, 0.04, 0.0, 0.04, 0.5, 0.4),
  ];
}

function monitorStrokes(): Stroke[] {
  const chart = path(
    [
      { x: -0.5, y: -0.05 },
      { x: -0.3, y: -0.2 },
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.32 },
      { x: 0.3, y: -0.22 },
      { x: 0.5, y: -0.4 },
    ],
    0.8,
    0.7
  );
  return [
    roundedRect(0, -0.1, 1.5, 0.94, 0.04, 1, 1),
    roundedRect(0, -0.1, 1.38, 0.82, 0.02, 0.6, 0.55),
    line(-0.1, 0.37, -0.13, 0.64, 0.9, 0.9),
    line(0.1, 0.37, 0.13, 0.64, 0.9, 0.9),
    roundedRect(0, 0.68, 0.6, 0.07, 0.035, 0.9, 0.9),
    chart,
    roundedRect(-0.42, 0.18, 0.18, 0.2, 0.01, 0.5, 0.5),
    roundedRect(-0.18, 0.12, 0.18, 0.26, 0.01, 0.5, 0.5),
    roundedRect(0.06, 0.2, 0.18, 0.18, 0.01, 0.5, 0.5),
    roundedRect(0.3, 0.1, 0.18, 0.28, 0.01, 0.5, 0.5),
  ];
}

function globeStrokes(): Stroke[] {
  const radius = 0.78;
  const globe: Stroke[] = [circle(0, 0, radius, 1, 1)];
  const parallels = [-0.52, -0.26, 0, 0.26, 0.52];
  for (const height of parallels) {
    const half = Math.sqrt(radius * radius - (height * radius * 1.3) ** 2);
    const bend = 0.1 * (1 - Math.abs(height));
    globe.push(
      arc(0, height * radius * 1.3, half, bend, 0, Math.PI, 0.55, 0.6)
    );
  }
  for (const share of [0.3, 0.62, 0.9]) {
    globe.push(arc(0, 0, radius * share, radius, 0, FULL_TURN, 0.55, 0.55));
  }
  globe.push(line(0, -radius, 0, radius, 0.5, 0.5));
  return turned(globe, -0.4);
}

function networkStrokes(): Stroke[] {
  const nodes: Point[] = [
    { x: -0.78, y: -0.26 },
    { x: -0.42, y: 0.38 },
    { x: -0.12, y: -0.5 },
    { x: 0.2, y: 0.06 },
    { x: 0.58, y: -0.4 },
    { x: 0.8, y: 0.34 },
    { x: -0.02, y: 0.66 },
  ];
  const sizes = [0.07, 0.08, 0.07, 0.13, 0.08, 0.07, 0.07];
  const links: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [3, 6],
    [4, 5],
    [1, 6],
  ];
  const strokes: Stroke[] = [];
  for (const [from, to] of links) {
    const start = nodes[from];
    const end = nodes[to];
    const gap = sizes[from];
    const stop = sizes[to];
    const span = distanceBetween(start, end);
    const lead = gap / span;
    const trail = 1 - stop / span;
    const near = {
      x: start.x + (end.x - start.x) * lead,
      y: start.y + (end.y - start.y) * lead,
    };
    const far = {
      x: start.x + (end.x - start.x) * trail,
      y: start.y + (end.y - start.y) * trail,
    };
    strokes.push(line(near.x, near.y, far.x, far.y, 0.7, 0.55));
  }
  nodes.forEach((node, index) => {
    const isHub = index === 3;
    let weight = 1.4;
    if (isHub) {
      weight = 1.8;
    }
    strokes.push(circle(node.x, node.y, sizes[index], weight, 1));
  });
  return strokes;
}

function dialStrokes(): Stroke[] {
  const radius = 0.8;
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  const strokes: Stroke[] = [arc(0, 0.04, radius, radius, start, end, 1, 1)];
  const ticks = 21;
  for (let tick = 0; tick < ticks; tick += 1) {
    const share = tick / (ticks - 1);
    const angle = start + (end - start) * share;
    const isMajor = tick % 5 === 0;
    let inner = 0.7;
    let tone = 0.55;
    if (isMajor) {
      inner = 0.64;
      tone = 0.9;
    }
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    strokes.push(
      line(
        cosAngle * inner,
        sinAngle * inner + 0.04,
        cosAngle * 0.76,
        sinAngle * 0.76 + 0.04,
        0.7,
        tone
      )
    );
  }
  const reading = start + (end - start) * 0.7;
  strokes.push(arc(0, 0.04, 0.54, 0.54, start, reading, 0.8, 0.65));
  strokes.push(
    line(0, 0.04, Math.cos(reading) * 0.5, Math.sin(reading) * 0.5 + 0.04, 1, 1)
  );
  strokes.push(circle(0, 0.04, 0.07, 1.4, 1));
  return strokes;
}

const BUILDERS: Record<ObjectId, () => Stroke[]> = {
  planet: planetStrokes,
  phone: phoneStrokes,
  laptop: laptopStrokes,
  monitor: monitorStrokes,
  globe: globeStrokes,
  network: networkStrokes,
  dial: dialStrokes,
};

type Walker = {
  stroke: Stroke;
  lengths: number[];
  total: number;
};

function walkerOf(original: Stroke): Walker {
  const lengths = [0];
  for (let index = 1; index < original.points.length; index += 1) {
    const step = distanceBetween(
      original.points[index - 1],
      original.points[index]
    );
    lengths.push(lengths[index - 1] + step);
  }
  const total = lengths[lengths.length - 1];
  return { stroke: original, lengths, total };
}

function pointAt(walker: Walker, distance: number): Point {
  const { points } = walker.stroke;
  const { lengths } = walker;
  let low = 0;
  let high = lengths.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (lengths[middle] <= distance) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const span = Math.max(GAP_EPSILON, lengths[high] - lengths[low]);
  const share = (distance - lengths[low]) / span;
  const from = points[low];
  const to = points[high];
  return {
    x: from.x + (to.x - from.x) * share,
    y: from.y + (to.y - from.y) * share,
  };
}

function countsOf(walkers: Walker[], count: number) {
  let sum = 0;
  for (const walker of walkers) {
    sum += walker.total * walker.stroke.weight;
  }
  const counts = walkers.map((walker) => {
    const share = (walker.total * walker.stroke.weight) / sum;
    return Math.round(share * count);
  });
  let assigned = 0;
  let widest = 0;
  counts.forEach((value, index) => {
    assigned += value;
    if (value > counts[widest]) {
      widest = index;
    }
  });
  counts[widest] += count - assigned;
  return counts;
}

export function outlineOf(
  object: ObjectId,
  count: number,
  random: () => number
): OutlineCloud {
  const build = BUILDERS[object];
  const walkers = build()
    .map(walkerOf)
    .filter((walker) => walker.total > 0);
  const counts = countsOf(walkers, count);
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const light = new Float32Array(count);
  let next = 0;
  walkers.forEach((walker, index) => {
    const share = counts[index];
    for (let slot = 0; slot < share; slot += 1) {
      const along = ((slot + 0.5) / share) * walker.total;
      const spot = pointAt(walker, along);
      x[next] = spot.x + (random() - 0.5) * JITTER;
      y[next] = spot.y + (random() - 0.5) * JITTER;
      light[next] = walker.stroke.tone * (0.85 + random() * 0.15);
      next += 1;
    }
  });
  return { x, y, light };
}
