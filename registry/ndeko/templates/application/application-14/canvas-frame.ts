import type { Box, FlowLayout, Point } from './layout';
import {
  gridOffsetOf,
  homeOf,
  shiftInto,
  shownOf,
  type Insets,
  type Size,
  type View,
} from './viewport';

export const GRID_CELL = 20;

/** What is kept in view around a step the canvas pans to, so the edge that leaves it shows too. */
const REVEAL_MARGIN = 20;

const PAN_STEP = 56;

/** An arrow key moves the view that way, so what is on the canvas slides the other way. */
export const ARROW_OFFSET: Partial<Record<string, Point>> = {
  ArrowLeft: { x: PAN_STEP, y: 0 },
  ArrowRight: { x: -PAN_STEP, y: 0 },
  ArrowUp: { x: 0, y: PAN_STEP },
  ArrowDown: { x: 0, y: -PAN_STEP },
};

export const SAFE_MARGIN = 16;

/** A press on one of these is a press on the interface, not on the empty canvas behind it. */
const SOLID = 'button, a, input, textarea, select, label, [data-solid]';

export function flowSizeOf(layout: FlowLayout): Size {
  return { width: layout.width, height: layout.height };
}

/**
 * A layer drawn outside the frame (the menu of a step, the palette of a plus) still sends its
 * presses to the frame through React. Taken for the canvas, its item would lose its click to a pan.
 */
export function isOnBackground(frame: Element, target: EventTarget) {
  if (!(target instanceof Element)) {
    return false;
  }
  if (!frame.contains(target)) {
    return false;
  }
  return target.closest(SOLID) === null;
}

function overlayOf(frame: HTMLElement, name: string) {
  const panel = frame.parentElement;
  const overlay = panel?.querySelector<HTMLElement>(
    `[data-canvas-overlay="${name}"]`
  );
  return overlay?.getBoundingClientRect();
}

/** The tool bar and the row of buttons cover the frame: a view that shows the whole flow leaves them their room. */
export function insetsOf(frame: HTMLElement): Insets {
  const bounds = frame.getBoundingClientRect();
  const topBox = overlayOf(frame, 'top');
  const bottomBox = overlayOf(frame, 'bottom');
  const insets = { top: SAFE_MARGIN, bottom: SAFE_MARGIN };
  if (topBox && topBox.height > 0) {
    insets.top = topBox.bottom - bounds.top + SAFE_MARGIN;
  }
  if (bottomBox && bottomBox.height > 0) {
    insets.bottom = bounds.bottom - bottomBox.top + SAFE_MARGIN;
  }
  return insets;
}

/** Only what floats above or under a span counts: a card beside it hides nothing of it. */
export function clearSpanOf(frame: HTMLElement, left: number, right: number) {
  const bounds = frame.getBoundingClientRect();
  const panel = frame.parentElement;
  const overlays = panel?.querySelectorAll<HTMLElement>(
    '[data-canvas-overlay]'
  );
  const middle = bounds.height / 2;
  let top = SAFE_MARGIN;
  let bottom = bounds.height - SAFE_MARGIN;
  for (const overlay of overlays ?? []) {
    const box = overlay.getBoundingClientRect();
    const boxLeft = box.left - bounds.left;
    const boxRight = box.right - bounds.left;
    const boxTop = box.top - bounds.top;
    const boxBottom = box.bottom - bounds.top;
    const isEmpty = box.width === 0 || box.height === 0;
    const isBeside = boxRight < left || boxLeft > right;
    if (isEmpty || isBeside) {
      continue;
    }
    const boxMiddle = (boxTop + boxBottom) / 2;
    const isAbove = boxMiddle < middle;
    if (isAbove) {
      top = Math.max(top, boxBottom + SAFE_MARGIN);
    } else {
      bottom = Math.min(bottom, boxTop - SAFE_MARGIN);
    }
  }
  return { top, bottom };
}

/** How far the view moves so a step shows clear of what floats over the frame. Null when it already does. */
export function revealShiftOf(
  frame: HTMLElement,
  size: Size,
  view: View,
  box: Box
): Point | null {
  const shown = shownOf(view, {
    left: box.x - REVEAL_MARGIN,
    top: box.y - REVEAL_MARGIN,
    right: box.x + box.width + REVEAL_MARGIN,
    bottom: box.y + box.height + REVEAL_MARGIN,
  });
  const mostRight = size.width - SAFE_MARGIN;
  const shiftX = shiftInto(shown.left, shown.right, SAFE_MARGIN, mostRight);
  const movedLeft = shown.left + shiftX;
  const movedRight = shown.right + shiftX;
  const clear = clearSpanOf(frame, movedLeft, movedRight);
  const shiftY = shiftInto(shown.top, shown.bottom, clear.top, clear.bottom);
  const isInView = shiftX === 0 && shiftY === 0;
  if (isInView) {
    return null;
  }
  return { x: shiftX, y: shiftY };
}

export function writeView(
  view: View,
  plane: HTMLElement | null,
  grid: HTMLElement | null
) {
  const x = Math.round(view.x);
  const y = Math.round(view.y);
  if (plane) {
    const zoom = String(view.zoom);
    plane.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    plane.style.setProperty('--zoom', zoom);
  }
  if (grid) {
    const offset = gridOffsetOf({ x, y, zoom: view.zoom }, GRID_CELL);
    grid.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${view.zoom})`;
  }
}

export function homeViewOf(frame: HTMLElement, size: Size, layout: FlowLayout) {
  const flow = flowSizeOf(layout);
  const insets = insetsOf(frame);
  return homeOf(size, flow, layout.trunkX, insets);
}
