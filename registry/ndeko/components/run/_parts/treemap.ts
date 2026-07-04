export type TreemapRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TreemapEntry = {
  id: string;
  value: number;
};

export type PlacedEntry = TreemapEntry & {
  rect: TreemapRect;
};

type Sized = {
  entry: TreemapEntry;
  area: number;
};

function byValueThenId(first: TreemapEntry, second: TreemapEntry) {
  const difference = second.value - first.value;
  if (difference !== 0) {
    return difference;
  }
  return first.id.localeCompare(second.id);
}

function totalArea(row: Sized[]) {
  let total = 0;
  for (const item of row) {
    total += item.area;
  }
  return total;
}

/** The worst aspect ratio of a row laid along a side: the closer to 1, the squarer its tiles. */
function worstRatio(row: Sized[], side: number) {
  let max = 0;
  let min = Infinity;
  for (const item of row) {
    max = Math.max(max, item.area);
    min = Math.min(min, item.area);
  }
  const sum = totalArea(row);
  const sideSquared = side * side;
  const sumSquared = sum * sum;
  const wide = (sideSquared * max) / sumSquared;
  const tall = sumSquared / (sideSquared * min);
  return Math.max(wide, tall);
}

/** Lays a row along the shorter side of the free rectangle and returns what is left of it. */
function layoutRow(
  row: Sized[],
  rect: TreemapRect,
  placed: PlacedEntry[]
): TreemapRect {
  const rowArea = totalArea(row);
  const isWide = rect.width >= rect.height;
  if (isWide) {
    const columnWidth = rowArea / rect.height;
    let y = rect.y;
    for (const item of row) {
      const height = item.area / columnWidth;
      const tile = { x: rect.x, y, width: columnWidth, height };
      placed.push({ ...item.entry, rect: tile });
      y += height;
    }
    return {
      x: rect.x + columnWidth,
      y: rect.y,
      width: rect.width - columnWidth,
      height: rect.height,
    };
  }
  const rowHeight = rowArea / rect.width;
  let x = rect.x;
  for (const item of row) {
    const width = item.area / rowHeight;
    const tile = { x, y: rect.y, width, height: rowHeight };
    placed.push({ ...item.entry, rect: tile });
    x += width;
  }
  return {
    x: rect.x,
    y: rect.y + rowHeight,
    width: rect.width,
    height: rect.height - rowHeight,
  };
}

/**
 * Squarified treemap (Bruls, Huizing and van Wijk): entries sorted by value, then by id, so the same
 * input always gives the same layout.
 */
export function squarify(
  entries: readonly TreemapEntry[],
  rect: TreemapRect
): PlacedEntry[] {
  const positive = entries.filter((entry) => entry.value > 0);
  const sorted = [...positive].sort(byValueThenId);
  let total = 0;
  for (const entry of sorted) {
    total += entry.value;
  }
  if (total === 0) {
    return [];
  }
  const rectArea = rect.width * rect.height;
  const placed: PlacedEntry[] = [];
  let remaining = rect;
  let row: Sized[] = [];
  for (const entry of sorted) {
    const share = entry.value / total;
    const item = { entry, area: share * rectArea };
    if (row.length === 0) {
      row = [item];
      continue;
    }
    const side = Math.min(remaining.width, remaining.height);
    const grown = [...row, item];
    const keepsSquare = worstRatio(grown, side) <= worstRatio(row, side);
    if (keepsSquare) {
      row = grown;
      continue;
    }
    remaining = layoutRow(row, remaining, placed);
    row = [item];
  }
  if (row.length > 0) {
    layoutRow(row, remaining, placed);
  }
  return placed;
}
