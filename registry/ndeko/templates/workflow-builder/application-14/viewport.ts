import type { Point } from './layout';

/** Where the plane of the canvas stands in its frame: one translation and one scale. */
export type View = {
  x: number;
  y: number;
  zoom: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** The part of the frame that toolbars and cards cover at its top and at its bottom. */
export type Insets = {
  top: number;
  bottom: number;
};

export const MIN_ZOOM = 0.4;

export const MAX_ZOOM = 1.6;

const ZOOM_STEP = 0.1;

/** Under this size the names on the cards stop being readable, so a canvas never opens smaller. */
const HOME_MIN_ZOOM = 0.8;

/** What stays of the flow in the frame however far it is panned, so it cannot be lost. */
const KEPT_IN_FRAME = 72;

const GLIDE_MS = 320;

/** A step counts as a tenth already reached when the zoom sits this close to it. */
const STEP_SLACK = 0.001;

const REST_VIEW: View = { x: 0, y: 0, zoom: 1 };

function clampedZoom(zoom: number) {
  const capped = Math.min(MAX_ZOOM, zoom);
  return Math.max(MIN_ZOOM, capped);
}

/** The whole flow, centred in the free part of the frame, never larger than life. */
export function fitOf(frame: Size, flow: Size, insets: Insets): View {
  const freeHeight = frame.height - insets.top - insets.bottom;
  const zoomAcross = frame.width / flow.width;
  const zoomDown = freeHeight / flow.height;
  const fitting = Math.min(zoomAcross, zoomDown, 1);
  const zoom = clampedZoom(fitting);
  const spareWidth = frame.width - flow.width * zoom;
  const spareHeight = freeHeight - flow.height * zoom;
  const offsetDown = Math.max(0, spareHeight / 2);
  return { x: spareWidth / 2, y: insets.top + offsetDown, zoom };
}

/** What a canvas opens on: the whole flow when it stays readable, else the top of the trunk at a readable size. */
export function homeOf(
  frame: Size,
  flow: Size,
  trunkX: number,
  insets: Insets
): View {
  const fit = fitOf(frame, flow, insets);
  if (fit.zoom >= HOME_MIN_ZOOM) {
    return fit;
  }
  const middle = frame.width / 2;
  const x = middle - trunkX * HOME_MIN_ZOOM;
  return { x, y: insets.top, zoom: HOME_MIN_ZOOM };
}

/** A new zoom that keeps the point under `anchor` where it is. */
export function zoomedAround(view: View, zoom: number, anchor: Point): View {
  const next = clampedZoom(zoom);
  const ratio = next / view.zoom;
  const x = anchor.x - (anchor.x - view.x) * ratio;
  const y = anchor.y - (anchor.y - view.y) * ratio;
  return { x, y, zoom: next };
}

/** The next tenth above or under a zoom: 88% goes to 90% or to 80%. */
export function steppedZoom(zoom: number, direction: 1 | -1) {
  const tenths = zoom / ZOOM_STEP;
  if (direction === 1) {
    const reached = Math.floor(tenths + STEP_SLACK);
    const above = (reached + 1) * ZOOM_STEP;
    return clampedZoom(above);
  }
  const reached = Math.ceil(tenths - STEP_SLACK);
  const under = (reached - 1) * ZOOM_STEP;
  return clampedZoom(under);
}

function clampedBetween(value: number, least: number, most: number) {
  const capped = Math.min(most, value);
  return Math.max(least, capped);
}

export function clampedTo(view: View, frame: Size, flow: Size): View {
  const leastX = KEPT_IN_FRAME - flow.width * view.zoom;
  const leastY = KEPT_IN_FRAME - flow.height * view.zoom;
  const mostX = frame.width - KEPT_IN_FRAME;
  const mostY = frame.height - KEPT_IN_FRAME;
  const x = clampedBetween(view.x, leastX, mostX);
  const y = clampedBetween(view.y, leastY, mostY);
  return { x, y, zoom: view.zoom };
}

export function shownOf(view: View, box: Rect): Rect {
  return {
    left: view.x + box.left * view.zoom,
    top: view.y + box.top * view.zoom,
    right: view.x + box.right * view.zoom,
    bottom: view.y + box.bottom * view.zoom,
  };
}

/** How far to move along one axis so a span fits between two bounds. Its start wins when it cannot fit. */
export function shiftInto(
  start: number,
  end: number,
  least: number,
  most: number
) {
  if (start < least) {
    return least - start;
  }
  if (end > most) {
    return most - end;
  }
  return 0;
}

function positiveModulo(value: number, size: number) {
  const remainder = value % size;
  return (remainder + size) % size;
}

/**
 * The grid starts one tile before the frame and slides by less than a tile, so it never shows an
 * edge and its dots stay on the same points of the plane at every zoom.
 */
export function gridOffsetOf(view: View, cell: number) {
  const scaled = cell * view.zoom;
  const x = positiveModulo(view.x, scaled);
  const y = positiveModulo(view.y, scaled);
  return { x: x - scaled, y: y - scaled };
}

function easedOut(progress: number) {
  const rest = 1 - progress;
  return 1 - rest * rest * rest * rest;
}

function between(from: number, to: number, share: number) {
  return from + (to - from) * share;
}

export type ViewStore = {
  /** Where the plane stands now, in the middle of a glide included. */
  get: () => View;
  /** Where it will rest: the end of the glide, or where it stands. */
  rest: () => View;
  jump: (view: View) => void;
  glide: (view: View) => void;
  subscribe: (listener: () => void) => () => void;
  stop: () => void;
};

/**
 * The view lives outside React: it changes on every frame of a drag or a glide, and only the
 * elements it moves are written to. A frame is asked for while a glide lasts, never at rest.
 */
export function createViewStore(): ViewStore {
  const listeners = new Set<() => void>();
  let view = REST_VIEW;
  let target = REST_VIEW;
  let origin = REST_VIEW;
  let startedAt = 0;
  let frame = 0;

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function tick(now: number) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / GLIDE_MS);
    const share = easedOut(progress);
    view = {
      x: between(origin.x, target.x, share),
      y: between(origin.y, target.y, share),
      zoom: between(origin.zoom, target.zoom, share),
    };
    notify();
    if (progress >= 1) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  return {
    get: () => view,
    rest: () => target,
    jump(next) {
      stop();
      view = next;
      target = next;
      notify();
    },
    glide(next) {
      stop();
      origin = view;
      target = next;
      startedAt = performance.now();
      frame = requestAnimationFrame(tick);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    stop,
  };
}
