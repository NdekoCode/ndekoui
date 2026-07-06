/** The row after a step through a list that wraps round, or the first one when nothing is active. */
export function wrappedIndexOf(current: number, step: number, count: number) {
  if (count === 0) {
    return -1;
  }
  const hasCurrent = current >= 0;
  if (!hasCurrent) {
    return firstIndexFor(step, count);
  }
  const moved = current + step;
  const shifted = moved + count;
  return shifted % count;
}

function firstIndexFor(step: number, count: number) {
  if (step > 0) {
    return 0;
  }
  return count - 1;
}

/** Scrolls the list itself, never the page: `list` must be positioned so `offsetTop` is measured from it. */
export function keepRowInView(list: HTMLElement, row: HTMLElement) {
  const rowTop = row.offsetTop;
  const rowBottom = rowTop + row.offsetHeight;
  const viewTop = list.scrollTop;
  const viewBottom = viewTop + list.clientHeight;
  if (rowTop < viewTop) {
    list.scrollTop = rowTop;
    return;
  }
  if (rowBottom > viewBottom) {
    list.scrollTop = rowBottom - list.clientHeight;
  }
}

/** The highlighted row if it is still listed, otherwise the first one. */
export function activeIdOf(
  items: { id: string }[],
  highlightedId: string | null
) {
  const stillListed = items.some((item) => item.id === highlightedId);
  if (stillListed) {
    return highlightedId;
  }
  return items[0]?.id ?? null;
}
