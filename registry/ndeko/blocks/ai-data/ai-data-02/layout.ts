import { DAY_END, DAY_START } from './data';

export type Timed = {
  id: string;
  start: number;
  end: number;
};

/** Where a block sits in its day: which column of how many, among the blocks it overlaps. */
export type Place = {
  column: number;
  columns: number;
};

/** The box of a block inside its day, as shares of the width and of the height of the day. */
export type Box = {
  top: string;
  height: string;
  left: string;
  width: string;
};

const DAY_SPAN = DAY_END - DAY_START;

function byStart(first: Timed, second: Timed) {
  if (first.start !== second.start) {
    return first.start - second.start;
  }
  return second.end - first.end;
}

/** The first column whose last block has ended, or a new one. */
function freeColumnOf(columnEnds: number[], start: number) {
  const free = columnEnds.findIndex((end) => end <= start);
  if (free === -1) {
    return columnEnds.length;
  }
  return free;
}

/**
 * Blocks that overlap in time share the width of the day, side by side. Blocks are read in order of
 * start; a run of blocks that touch one another is a cluster, and every block of a cluster takes
 * one column of as many as the cluster needed.
 */
export function placesOf(items: Timed[]) {
  const ordered = [...items];
  ordered.sort(byStart);
  const places = new Map<string, Place>();
  let cluster: Timed[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = 0;

  function closeCluster() {
    for (const item of cluster) {
      const place = places.get(item.id);
      if (place) {
        place.columns = columnEnds.length;
      }
    }
    cluster = [];
    columnEnds = [];
  }

  for (const item of ordered) {
    const startsAfterCluster = item.start >= clusterEnd;
    if (startsAfterCluster) {
      closeCluster();
    }
    const column = freeColumnOf(columnEnds, item.start);
    columnEnds[column] = item.end;
    places.set(item.id, { column, columns: 1 });
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  closeCluster();
  return places;
}

function shareOf(part: number, whole: number) {
  const share = (part / whole) * 100;
  return `${share}%`;
}

export function boxOf(item: Timed, place: Place | undefined): Box {
  const column = place?.column ?? 0;
  const columns = place?.columns ?? 1;
  return {
    top: shareOf(item.start - DAY_START, DAY_SPAN),
    height: shareOf(item.end - item.start, DAY_SPAN),
    left: shareOf(column, columns),
    width: shareOf(1, columns),
  };
}
