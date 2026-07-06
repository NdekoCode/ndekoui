import {
  AssistiveDndState,
  isOrderedDragTarget,
  type DragTarget,
  type ItemInstance,
  type TreeInstance,
} from '@headless-tree/core';

function namesOf<T>(rows: ItemInstance<T>[]) {
  const names = rows.map((row) => row.getItemName());
  return names.join(', ');
}

function placeOf<T>(target: DragTarget<T>) {
  const parentName = target.item.getItemName();
  if (isOrderedDragTarget(target)) {
    const position = target.childIndex + 1;
    return `position ${position} in ${parentName}`;
  }
  return `inside ${parentName}`;
}

export function moveNoticeOf<T>(
  rows: ItemInstance<T>[],
  target: DragTarget<T>
) {
  const names = namesOf(rows);
  const parentName = target.item.getItemName();
  return `Moved ${names} to ${parentName}`;
}

/* Only a drag from the keyboard is spoken: a drag with the pointer is already seen by the person doing it. */
export function dragStatusOf<T>(tree: TreeInstance<T>) {
  const { dnd, assistiveDndState } = tree.getState();
  const target = dnd?.dragTarget;
  if (!target) {
    return '';
  }
  const rows = dnd?.draggedItems ?? [];
  const names = namesOf(rows);
  const place = placeOf(target);
  if (assistiveDndState === AssistiveDndState.Started) {
    return `Picked up ${names}, ${place}. Arrow keys move, Enter drops, Escape cancels.`;
  }
  if (assistiveDndState === AssistiveDndState.Dragging) {
    return `${names}, ${place}`;
  }
  return '';
}

export function spokenStatusOf(dragStatus: string, moveNotice: string) {
  if (dragStatus !== '') {
    return dragStatus;
  }
  return moveNotice;
}
