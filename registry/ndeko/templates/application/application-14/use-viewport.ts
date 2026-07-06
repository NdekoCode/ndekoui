'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import {
  flowSizeOf,
  homeViewOf,
  insetsOf,
  isOnBackground,
  revealShiftOf,
  writeView,
} from './canvas-frame';
import type { Box, FlowLayout } from './layout';
import {
  clampedTo,
  createViewStore,
  fitOf,
  steppedZoom,
  zoomedAround,
  type Size,
  type View,
  type ViewStore,
} from './viewport';

/** A press that moved less than this was a click on the empty canvas, not a drag. */
const DRAG_SLACK_PX = 4;

const WHEEL_ZOOM_RATE = 0.0015;

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  view: View;
  hasMoved: boolean;
};

function moveTo(store: ViewStore, view: View, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    store.jump(view);
    return;
  }
  store.glide(view);
}

export type Viewport = {
  frameRef: RefObject<HTMLDivElement | null>;
  planeRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<HTMLDivElement | null>;
  store: ViewStore;
  zoomBy: (direction: 1 | -1) => void;
  fit: () => void;
  goHome: () => void;
  panBy: (offsetX: number, offsetY: number) => void;
  show: (view: View) => void;
  reveal: (box: Box) => void;
  follow: (box: Box) => void;
  startFollowing: () => void;
  frameSizeOf: () => Size;
  startPan: (event: React.PointerEvent<HTMLDivElement>) => void;
  pan: (event: React.PointerEvent<HTMLDivElement>) => void;
  endPan: (event: React.PointerEvent<HTMLDivElement>) => void;
  cancelPan: () => void;
};

/**
 * Pan and zoom of the canvas: one transform on the plane, written straight to the element. A drag
 * on the empty canvas pans, Ctrl or Cmd with the wheel zooms round the pointer, and the view keeps
 * its opening position through a change of size for as long as nothing has moved it.
 * `onWheelZoom` hears the one gesture a demonstration cannot see by itself: a wheel is neither a
 * press nor a key.
 */
export function useViewport(
  layout: FlowLayout,
  onBackgroundPress: () => void,
  onWheelZoom: () => void
): Viewport {
  const [store] = useState(createViewStore);
  const frameRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const frameSize = useRef<Size>({ width: 0, height: 0 });
  const latestLayout = useRef(layout);
  const isAtHome = useRef(true);
  const followsRun = useRef(true);
  const drag = useRef<Drag | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { width, height, trunkX } = layout;

  useEffect(() => {
    latestLayout.current = layout;
  });

  useEffect(() => {
    function write() {
      const view = store.get();
      writeView(view, planeRef.current, gridRef.current);
    }
    write();
    const unsubscribe = store.subscribe(write);
    return () => {
      unsubscribe();
      store.stop();
    };
  }, [store]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      const size = { width: box.width, height: box.height };
      frameSize.current = size;
      if (isAtHome.current) {
        const home = homeViewOf(frame, size, latestLayout.current);
        store.jump(home);
      } else {
        const flow = flowSizeOf(latestLayout.current);
        const kept = clampedTo(store.rest(), size, flow);
        store.jump(kept);
      }
      frame.dataset.ready = 'true';
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [store]);

  useEffect(() => {
    const frame = frameRef.current;
    const size = frameSize.current;
    const isMeasured = size.width > 0;
    const canGoHome = isMeasured && isAtHome.current;
    if (!frame || !canGoHome) {
      return;
    }
    const home = homeViewOf(frame, size, latestLayout.current);
    moveTo(store, home, shouldReduceMotion);
  }, [store, width, height, trunkX, shouldReduceMotion]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    function zoomFromWheel(event: WheelEvent) {
      const isZoomGesture = event.ctrlKey || event.metaKey;
      if (!isZoomGesture || !frame) {
        return;
      }
      event.preventDefault();
      const bounds = frame.getBoundingClientRect();
      const anchor = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const current = store.rest();
      const exponent = -event.deltaY * WHEEL_ZOOM_RATE;
      const zoom = current.zoom * Math.exp(exponent);
      const zoomed = zoomedAround(current, zoom, anchor);
      const flow = flowSizeOf(latestLayout.current);
      const kept = clampedTo(zoomed, frameSize.current, flow);
      isAtHome.current = false;
      followsRun.current = false;
      store.jump(kept);
      onWheelZoom();
    }
    frame.addEventListener('wheel', zoomFromWheel, { passive: false });
    return () => frame.removeEventListener('wheel', zoomFromWheel);
  }, [store, onWheelZoom]);

  /** Once a person moves the view it is theirs: it stops following the run and stays where they put it. */
  const takeOver = useCallback(() => {
    isAtHome.current = false;
    followsRun.current = false;
  }, []);

  const keptInFrame = useCallback(
    (view: View) => {
      const flow = flowSizeOf(layout);
      return clampedTo(view, frameSize.current, flow);
    },
    [layout]
  );

  const zoomBy = useCallback(
    (direction: 1 | -1) => {
      const size = frameSize.current;
      const centre = { x: size.width / 2, y: size.height / 2 };
      const current = store.rest();
      const zoom = steppedZoom(current.zoom, direction);
      const zoomed = zoomedAround(current, zoom, centre);
      const kept = keptInFrame(zoomed);
      takeOver();
      moveTo(store, kept, shouldReduceMotion);
    },
    [store, keptInFrame, takeOver, shouldReduceMotion]
  );

  const fit = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const insets = insetsOf(frame);
    const flow = flowSizeOf(layout);
    const fitted = fitOf(frameSize.current, flow, insets);
    takeOver();
    moveTo(store, fitted, shouldReduceMotion);
  }, [store, layout, takeOver, shouldReduceMotion]);

  const goHome = useCallback(() => {
    const frame = frameRef.current;
    isAtHome.current = true;
    followsRun.current = true;
    if (!frame || frameSize.current.width === 0) {
      return;
    }
    const home = homeViewOf(frame, frameSize.current, layout);
    moveTo(store, home, shouldReduceMotion);
  }, [store, layout, shouldReduceMotion]);

  const show = useCallback(
    (view: View) => {
      const kept = keptInFrame(view);
      takeOver();
      store.jump(kept);
    },
    [store, keptInFrame, takeOver]
  );

  const panBy = useCallback(
    (offsetX: number, offsetY: number) => {
      const current = store.rest();
      const moved = {
        x: current.x + offsetX,
        y: current.y + offsetY,
        zoom: current.zoom,
      };
      show(moved);
    },
    [store, show]
  );

  const reveal = useCallback(
    (box: Box) => {
      const frame = frameRef.current;
      const size = frameSize.current;
      if (!frame || size.width === 0) {
        return;
      }
      const current = store.rest();
      const shift = revealShiftOf(frame, size, current, box);
      if (shift === null) {
        return;
      }
      const moved = {
        x: current.x + shift.x,
        y: current.y + shift.y,
        zoom: current.zoom,
      };
      const kept = keptInFrame(moved);
      isAtHome.current = false;
      moveTo(store, kept, shouldReduceMotion);
    },
    [store, keptInFrame, shouldReduceMotion]
  );

  const follow = useCallback(
    (box: Box) => {
      if (followsRun.current) {
        reveal(box);
      }
    },
    [reveal]
  );

  const startFollowing = useCallback(() => {
    followsRun.current = true;
  }, []);

  const frameSizeOf = useCallback(() => frameSize.current, []);

  const startPan = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const isMainButton = event.button === 0;
      const isOnCanvas = isOnBackground(event.currentTarget, event.target);
      if (!isMainButton || !isOnCanvas) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        view: store.rest(),
        hasMoved: false,
      };
    },
    [store]
  );

  const pan = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const current = drag.current;
      if (current?.pointerId !== event.pointerId) {
        return;
      }
      const offsetX = event.clientX - current.startX;
      const offsetY = event.clientY - current.startY;
      const distance = Math.hypot(offsetX, offsetY);
      const isStill = !current.hasMoved && distance < DRAG_SLACK_PX;
      if (isStill) {
        return;
      }
      current.hasMoved = true;
      show({
        x: current.view.x + offsetX,
        y: current.view.y + offsetY,
        zoom: current.view.zoom,
      });
    },
    [show]
  );

  const endPan = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const current = drag.current;
      if (current?.pointerId !== event.pointerId) {
        return;
      }
      drag.current = null;
      if (!current.hasMoved) {
        onBackgroundPress();
      }
    },
    [onBackgroundPress]
  );

  const cancelPan = useCallback(() => {
    drag.current = null;
  }, []);

  /** One object for as long as the layout stays: the canvas, the tool bar and the mini map hold still while a step is typed into. */
  return useMemo(
    () => ({
      frameRef,
      planeRef,
      gridRef,
      store,
      zoomBy,
      fit,
      goHome,
      panBy,
      show,
      reveal,
      follow,
      startFollowing,
      frameSizeOf,
      startPan,
      pan,
      endPan,
      cancelPan,
    }),
    [
      store,
      zoomBy,
      fit,
      goHome,
      panBy,
      show,
      reveal,
      follow,
      startFollowing,
      frameSizeOf,
      startPan,
      pan,
      endPan,
      cancelPan,
    ]
  );
}

function serverZoomPercent() {
  return 100;
}

/** The zoom as a whole percentage. Only the text that shows it reads this, so a drag draws nothing else again. */
export function useZoomPercent(store: ViewStore) {
  function readPercent() {
    const view = store.rest();
    return Math.round(view.zoom * 100);
  }
  return useSyncExternalStore(store.subscribe, readPercent, serverZoomPercent);
}
