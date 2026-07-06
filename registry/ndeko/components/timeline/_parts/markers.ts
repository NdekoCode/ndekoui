/*
 * A marker wider than the 16px dot. Its size is --marker, set on the timeline: the row, the marker
 * and the rail are all placed from it, so the marker keeps its left edge on the edge of the piece.
 */
export const MARKER_ROW =
  'group-data-[orientation=vertical]/timeline:ms-[calc(var(--marker)_+_1rem)]';

export const MARKER = [
  'flex size-(--marker) items-center justify-center',
  'group-data-[orientation=vertical]/timeline:-left-[calc(var(--marker)/2_+_1rem)]',
].join(' ');

export const MARKER_RAIL = [
  'group-data-[orientation=vertical]/timeline:-left-[calc(var(--marker)/2_+_1rem)]',
  'group-data-[orientation=vertical]/timeline:h-[calc(100%_-_var(--marker)_-_0.25rem)]',
  'group-data-[orientation=vertical]/timeline:translate-y-[calc(var(--marker)_+_0.125rem)]',
].join(' ');
