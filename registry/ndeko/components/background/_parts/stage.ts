import { createFrameLoop } from './frame-loop';
import type { Point } from './math';
import { centreIn, watchPointer } from './pointer';
import { watchShowing } from './showing';
import {
  createSurface,
  fitSurface,
  hasSameInks,
  inksOf,
  isFitted,
  watchSurface,
  type Inks,
  type Surface,
} from './surface';

/** What a background draws on its canvas. The stage decides when; the scene only knows how. */
export type Scene = {
  /** The colours changed: the theme, or the hue. */
  ink: (inks: Inks) => void;
  /**
   * The box changed, and the canvas was wiped: what depends on its size is built again. `isStill`
   * is the reduced motion setting: the scene then holds its most telling picture and never moves.
   */
  fit: (surface: Surface, isStill: boolean) => void;
  /** The whole picture as it stands. */
  draw: (surface: Surface) => void;
  /**
   * Moves the picture on by `seconds` and draws what changed. It answers how long it can wait for
   * its next frame: `NEXT_FRAME`, `AT_REST`, or a number of milliseconds.
   */
  step: (surface: Surface, seconds: number, now: number) => number;
  pointerMoved?: (x: number, y: number) => void;
  pointerLeft?: () => void;
};

export type Stage = {
  /** Something outside the loop changed the scene: it is drawn again, and its loop is woken. */
  refresh: () => void;
  /** Reads the colours again, and draws again when they changed. */
  reink: () => void;
  /** Where the centre of an element sits on the canvas, or null when it is outside. */
  centreOf: (element: Element) => Point | null;
  dispose: () => void;
};

export type StageOptions = {
  /** Reduced motion: no pointer is followed and nothing moves by itself. */
  isStill: boolean;
  isInteractive: boolean;
};

function idle() {}

function stageOf(
  surface: Surface,
  scene: Scene,
  { isStill, isInteractive }: StageOptions
): Stage {
  const { canvas } = surface;
  const followsPointer = isInteractive && !isStill;
  let isShowing = false;
  let stopPointer = idle;
  let inks = inksOf(canvas);

  const loop = createFrameLoop((seconds, now) =>
    scene.step(surface, seconds, now)
  );

  function wake() {
    if (isShowing) {
      loop.wake();
    }
  }

  function lay() {
    fitSurface(surface);
    scene.fit(surface, isStill);
    scene.draw(surface);
  }

  function onPointerMove(x: number, y: number) {
    scene.pointerMoved?.(x, y);
    wake();
  }

  function onPointerLeave() {
    scene.pointerLeft?.();
    wake();
  }

  function show() {
    isShowing = true;
    if (followsPointer) {
      stopPointer = watchPointer(canvas, onPointerMove, onPointerLeave);
    }
    loop.start();
  }

  function hide() {
    isShowing = false;
    stopPointer();
    stopPointer = idle;
    loop.stop();
  }

  function onShowing(isNowShowing: boolean) {
    if (isNowShowing) {
      show();
      return;
    }
    hide();
  }

  function onResize() {
    if (isFitted(surface)) {
      return;
    }
    lay();
    wake();
  }

  function reink() {
    const latest = inksOf(canvas);
    if (hasSameInks(inks, latest)) {
      return;
    }
    inks = latest;
    scene.ink(inks);
    scene.draw(surface);
    wake();
  }

  /** In the loop, the next frame draws the change. Out of it, nothing would, so it is drawn here. */
  function refresh() {
    const isOutOfLoop = isStill || !isShowing;
    if (isOutOfLoop) {
      scene.draw(surface);
    }
    wake();
  }

  scene.ink(inks);
  lay();
  const stopSurface = watchSurface(canvas, onResize, reink);
  const stopShowing = watchShowing(canvas, onShowing);

  return {
    refresh,
    reink,
    centreOf: (element) => centreIn(canvas, element),
    dispose() {
      stopShowing();
      stopSurface();
      hide();
    },
  };
}

/**
 * Puts a scene on a canvas. The stage sizes the canvas for the screen, reads its colours, and runs
 * the loop of the scene only while the canvas is on screen in a visible tab. It draws one frame
 * when it is set up, so the picture is there before anything moves.
 */
export function mountStage(
  canvas: HTMLCanvasElement,
  scene: Scene,
  options: StageOptions
) {
  const surface = createSurface(canvas);
  if (!surface) {
    return null;
  }
  return stageOf(surface, scene, options);
}
