import {
  closestCenter,
  closestCorners,
  pointerWithin,
  type Active,
  type CollisionDetection,
  type Over,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { Columns, LaneId } from './data';

export function isLaneId(columns: Columns, id: string): id is LaneId {
  return Object.prototype.hasOwnProperty.call(columns, id);
}

export function laneOf(columns: Columns, taskId: string): LaneId | null {
  const lanes = Object.keys(columns) as LaneId[];
  const lane = lanes.find((laneId) => columns[laneId].includes(taskId));
  if (lane) {
    return lane;
  }
  return null;
}

export function targetLaneOf(columns: Columns, overId: string) {
  if (isLaneId(columns, overId)) {
    return overId;
  }
  return laneOf(columns, overId);
}

/** Inside the lane under the pointer, the closest card wins; an empty lane is the target itself. */
export function detectBoardCollision(
  args: Parameters<CollisionDetection>[0],
  columns: Columns
) {
  const hasPointer = Boolean(args.pointerCoordinates);
  if (!hasPointer) {
    return closestCorners(args);
  }
  const pointerHits = pointerWithin(args);
  const laneHit = pointerHits.find((hit) => isLaneId(columns, String(hit.id)));
  if (!laneHit) {
    return pointerHits;
  }
  const laneTaskIds = columns[laneHit.id as LaneId];
  const cardContainers = args.droppableContainers.filter((container) =>
    laneTaskIds.includes(String(container.id))
  );
  const isEmptyLane = cardContainers.length === 0;
  if (isEmptyLane) {
    return [laneHit];
  }
  return closestCenter({ ...args, droppableContainers: cardContainers });
}

function isBelowOver(active: Active, over: Over) {
  const translated = active.rect.current.translated;
  if (!translated) {
    return false;
  }
  const overMiddle = over.rect.top + over.rect.height / 2;
  return translated.top > overMiddle;
}

/** Moves the dragged card into the lane under it, before or after the card it hovers. */
export function moveAcrossLanes(
  columns: Columns,
  active: Active,
  over: Over
): Columns {
  const activeId = String(active.id);
  const overId = String(over.id);
  const fromLane = laneOf(columns, activeId);
  const toLane = targetLaneOf(columns, overId);
  if (!fromLane) {
    return columns;
  }
  if (!toLane) {
    return columns;
  }
  if (fromLane === toLane) {
    return columns;
  }
  const fromItems = columns[fromLane].filter((id) => id !== activeId);
  const toItems = columns[toLane];
  let insertAt = toItems.length;
  const isOverCard = !isLaneId(columns, overId);
  if (isOverCard) {
    const overIndex = toItems.indexOf(overId);
    insertAt = overIndex;
    if (isBelowOver(active, over)) {
      insertAt = overIndex + 1;
    }
  }
  const nextToItems = [
    ...toItems.slice(0, insertAt),
    activeId,
    ...toItems.slice(insertAt),
  ];
  return { ...columns, [fromLane]: fromItems, [toLane]: nextToItems };
}

/** Reorders the dragged card inside its lane once it is dropped. */
export function reorderInLane(
  columns: Columns,
  activeId: string,
  overId: string
): Columns {
  const lane = laneOf(columns, activeId);
  if (!lane) {
    return columns;
  }
  const items = columns[lane];
  const oldIndex = items.indexOf(activeId);
  const newIndex = items.indexOf(overId);
  const isMissing = newIndex === -1;
  const isSamePlace = oldIndex === newIndex;
  if (isMissing || isSamePlace) {
    return columns;
  }
  return { ...columns, [lane]: arrayMove(items, oldIndex, newIndex) };
}
