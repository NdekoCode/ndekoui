import type { Point } from './math';

/**
 * Where a point of the window falls inside `host`, in the pixels of its own box, or null when it
 * falls outside. A host that an ancestor scales still answers in its own pixels.
 */
export function placeIn(
  host: HTMLElement,
  clientX: number,
  clientY: number
): Point | null {
  const box = host.getBoundingClientRect();
  const isEmpty = box.width === 0 || box.height === 0;
  if (isEmpty) {
    return null;
  }
  const isInsideX = clientX >= box.left && clientX <= box.right;
  const isInsideY = clientY >= box.top && clientY <= box.bottom;
  if (!isInsideX || !isInsideY) {
    return null;
  }
  const scaleX = host.offsetWidth / box.width;
  const scaleY = host.offsetHeight / box.height;
  const offsetX = clientX - box.left;
  const offsetY = clientY - box.top;
  const x = offsetX * scaleX;
  const y = offsetY * scaleY;
  return { x, y };
}

/** Where the centre of `element` falls inside `host`, or null when it falls outside. */
export function centreIn(host: HTMLElement, element: Element) {
  const box = element.getBoundingClientRect();
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const centreX = box.left + halfWidth;
  const centreY = box.top + halfHeight;
  return placeIn(host, centreX, centreY);
}

/**
 * Follows a pointer that can hover, from the window: content laid over a background takes the
 * pointer events of its own box, so a listener on the background would go blind under a headline.
 * The place is read once a frame at most, and only on a frame where the pointer moved. `onMove`
 * gets the place inside `host`; `onLeave` is called once when the pointer goes out of it. The
 * function returned ends the watch, and lets go of a pointer that was still over the host.
 */
export function watchPointer(
  host: HTMLElement,
  onMove: (x: number, y: number) => void,
  onLeave: () => void
) {
  let clientX = 0;
  let clientY = 0;
  let frame = 0;
  let isOver = false;

  function leave() {
    if (!isOver) {
      return;
    }
    isOver = false;
    onLeave();
  }

  function read() {
    frame = 0;
    const place = placeIn(host, clientX, clientY);
    if (!place) {
      leave();
      return;
    }
    isOver = true;
    onMove(place.x, place.y);
  }

  function onPointerMove(event: PointerEvent) {
    const isTouch = event.pointerType === 'touch';
    if (isTouch) {
      return;
    }
    clientX = event.clientX;
    clientY = event.clientY;
    const isReadComing = frame !== 0;
    if (isReadComing) {
      return;
    }
    frame = requestAnimationFrame(read);
  }

  function onPointerGone() {
    cancelAnimationFrame(frame);
    frame = 0;
    leave();
  }

  const root = document.documentElement;
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  root.addEventListener('pointerleave', onPointerGone, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerGone);
    onPointerGone();
  };
}
